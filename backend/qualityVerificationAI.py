# AI Quality Verification Service
# Python + Flask + TensorFlow + OpenCV

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import cv2
import numpy as np
import requests
from io import BytesIO
from PIL import Image
import os
import tempfile

app = Flask(__name__)
CORS(app)

# ========== Model Setup ==========

# Load pre-trained MobileNetV2 model for construction scene detection
model = MobileNetV2(weights='imagenet', include_top=True)

print("✅ TensorFlow Model Loaded: MobileNetV2")

# ========== Image Quality Analysis Functions ==========

def download_from_ipfs(ipfs_hash):
    """Download image from IPFS"""
    try:
        url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        img_data = BytesIO(response.content)
        img = Image.open(img_data)
        
        return img
    except Exception as e:
        print(f"Error downloading from IPFS: {e}")
        return None

def check_sharpness(img_array):
    """
    Check image sharpness using Laplacian variance
    Higher variance = sharper image
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Score: 0-100
    # Laplacian variance > 100 = sharp (score 80-100)
    # Laplacian variance 50-100 = moderate (score 60-80)
    # Laplacian variance < 50 = blurry (score 0-60)
    
    if laplacian_var > 100:
        score = min(80 + (laplacian_var - 100) / 10, 100)
    elif laplacian_var > 50:
        score = 60 + (laplacian_var - 50) / 2
    else:
        score = laplacian_var * 1.2
    
    return {
        'score': round(score, 2),
        'laplacian_variance': round(laplacian_var, 2),
        'status': 'sharp' if score >= 70 else 'moderate' if score >= 50 else 'blurry'
    }

def check_brightness(img_array):
    """
    Check image brightness
    Well-lit images score higher
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    mean_brightness = np.mean(gray)
    
    # Score: 0-100
    # Mean brightness 100-180 = good (score 80-100)
    # Mean brightness 50-100 or 180-220 = moderate (score 50-80)
    # Mean brightness < 50 or > 220 = poor (score 0-50)
    
    if 100 <= mean_brightness <= 180:
        score = 80 + (20 - abs(mean_brightness - 140) / 2)
    elif 50 <= mean_brightness < 100:
        score = 50 + (mean_brightness - 50) / 2
    elif 180 < mean_brightness <= 220:
        score = 50 + (220 - mean_brightness) / 2
    else:
        score = max(0, 50 - abs(mean_brightness - 135) / 5)
    
    return {
        'score': round(score, 2),
        'mean_brightness': round(mean_brightness, 2),
        'status': 'good' if score >= 70 else 'moderate' if score >= 50 else 'poor'
    }

def check_contrast(img_array):
    """
    Check image contrast using standard deviation
    Higher contrast = better detail visibility
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    contrast = np.std(gray)
    
    # Score: 0-100
    # Std dev > 50 = high contrast (score 80-100)
    # Std dev 30-50 = moderate (score 60-80)
    # Std dev < 30 = low contrast (score 0-60)
    
    if contrast > 50:
        score = min(80 + (contrast - 50) / 2, 100)
    elif contrast > 30:
        score = 60 + (contrast - 30)
    else:
        score = contrast * 2
    
    return {
        'score': round(score, 2),
        'std_deviation': round(contrast, 2),
        'status': 'high' if score >= 70 else 'moderate' if score >= 50 else 'low'
    }

def detect_construction_elements(img_array):
    """
    Detect construction-related elements using MobileNetV2
    """
    # Resize image for model input
    img_resized = cv2.resize(img_array, (224, 224))
    img_expanded = np.expand_dims(img_resized, axis=0)
    img_preprocessed = preprocess_input(img_expanded)
    
    # Make prediction
    predictions = model.predict(img_preprocessed)
    decoded = decode_predictions(predictions, top=5)[0]
    
    # Construction-related keywords
    construction_keywords = [
        'crane', 'bulldozer', 'road', 'bridge', 'building', 'construction',
        'excavator', 'concrete', 'steel', 'scaffold', 'helmet', 'worker',
        'dump_truck', 'forklift', 'plow', 'tractor', 'barrier', 'fence',
        'wall', 'roof', 'beam', 'column', 'foundation', 'pavement'
    ]
    
    # Check if any prediction matches construction keywords
    construction_detected = False
    max_confidence = 0
    detected_items = []
    
    for pred in decoded:
        label = pred[1].lower()
        confidence = float(pred[2])
        
        for keyword in construction_keywords:
            if keyword in label:
                construction_detected = True
                max_confidence = max(max_confidence, confidence)
                detected_items.append({
                    'label': pred[1],
                    'confidence': round(confidence * 100, 2)
                })
    
    # Score based on detection confidence
    if construction_detected:
        score = 60 + (max_confidence * 40)  # 60-100 score range
    else:
        score = 40  # Default score if no construction elements detected
    
    return {
        'score': round(score, 2),
        'construction_detected': construction_detected,
        'detected_items': detected_items[:3],  # Top 3 items
        'status': 'detected' if construction_detected else 'not_detected'
    }

def calculate_edge_density(img_array):
    """
    Calculate edge density to check image detail
    More edges = more construction detail visible
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    
    edge_pixel_count = np.sum(edges > 0)
    total_pixels = edges.size
    edge_density = (edge_pixel_count / total_pixels) * 100
    
    # Score: 0-100
    # Edge density 5-20% = good detail (score 70-100)
    # Edge density 2-5% or 20-30% = moderate (score 50-70)
    # Edge density < 2% or > 30% = poor (score 0-50)
    
    if 5 <= edge_density <= 20:
        score = 70 + min((edge_density - 5) * 2, 30)
    elif 2 <= edge_density < 5:
        score = 50 + (edge_density - 2) * 10
    elif 20 < edge_density <= 30:
        score = 50 + (30 - edge_density) * 2
    else:
        score = max(0, 50 - abs(edge_density - 12) * 3)
    
    return {
        'score': round(score, 2),
        'edge_density_percentage': round(edge_density, 2),
        'status': 'good' if score >= 70 else 'moderate' if score >= 50 else 'poor'
    }

def analyze_image_composition(img_array):
    """
    Analyze overall image composition
    """
    height, width = img_array.shape[:2]
    aspect_ratio = width / height
    
    # Check for common photo aspect ratios
    standard_ratios = [16/9, 4/3, 3/2, 1/1]
    ratio_score = min([abs(aspect_ratio - ratio) for ratio in standard_ratios]) * -50 + 70
    ratio_score = max(50, min(ratio_score, 100))
    
    # Check image size (larger = better quality)
    total_pixels = height * width
    size_score = min(50 + (total_pixels / 100000), 100)
    
    composition_score = (ratio_score + size_score) / 2
    
    return {
        'score': round(composition_score, 2),
        'aspect_ratio': round(aspect_ratio, 2),
        'resolution': f"{width}x{height}",
        'total_pixels': total_pixels,
        'status': 'good' if composition_score >= 70 else 'acceptable'
    }

# ========== Main Verification Function ==========

def verify_image_quality(img):
    """
    Comprehensive image quality verification
    Returns overall quality score and detailed analysis
    """
    # Convert PIL Image to numpy array
    img_array = np.array(img.convert('RGB'))
    
    # Run all checks
    sharpness = check_sharpness(img_array)
    brightness = check_brightness(img_array)
    contrast = check_contrast(img_array)
    construction = detect_construction_elements(img_array)
    edges = calculate_edge_density(img_array)
    composition = analyze_image_composition(img_array)
    
    # Calculate weighted overall score
    overall_score = (
        sharpness['score'] * 0.25 +      # 25% weight
        brightness['score'] * 0.15 +     # 15% weight
        contrast['score'] * 0.15 +       # 15% weight
        construction['score'] * 0.30 +   # 30% weight (most important)
        edges['score'] * 0.10 +          # 10% weight
        composition['score'] * 0.05      # 5% weight
    )
    
    # Determine pass/fail (60+ = pass)
    passed = overall_score >= 60
    
    return {
        'quality_score': round(overall_score, 2),
        'passed': passed,
        'analysis': {
            'sharpness': sharpness,
            'brightness': brightness,
            'contrast': contrast,
            'construction_detection': construction,
            'edge_density': edges,
            'composition': composition
        },
        'summary': {
            'total_checks': 6,
            'passed_checks': sum([
                sharpness['score'] >= 60,
                brightness['score'] >= 60,
                contrast['score'] >= 60,
                construction['score'] >= 60,
                edges['score'] >= 60,
                composition['score'] >= 60
            ])
        }
    }

# ========== API Endpoints ==========

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'service': 'AI Quality Verification',
        'model': 'MobileNetV2',
        'version': '1.0'
    })

@app.route('/verify-quality', methods=['POST'])
def verify_quality():
    """
    Main endpoint for image quality verification
    Expects: { "ipfs_hash": "QmXXXX..." }
    Returns: { "quality_score": 85.5, "passed": true, "analysis": {...} }
    """
    try:
        data = request.get_json()
        ipfs_hash = data.get('ipfs_hash')
        
        if not ipfs_hash:
            return jsonify({'error': 'Missing ipfs_hash parameter'}), 400
        
        # Download image from IPFS
        print(f"Downloading image from IPFS: {ipfs_hash}")
        img = download_from_ipfs(ipfs_hash)
        
        if img is None:
            return jsonify({'error': 'Failed to download image from IPFS'}), 400
        
        # Verify quality
        print("Running AI quality verification...")
        result = verify_image_quality(img)
        
        print(f"✅ Verification complete: Score = {result['quality_score']}, Passed = {result['passed']}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/verify-quality/upload', methods=['POST'])
def verify_quality_upload():
    """
    Alternative endpoint for direct file upload
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        # Open and verify
        img = Image.open(temp_path)
        result = verify_image_quality(img)
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return jsonify({'error': str(e)}), 500

# ========== Start Server ==========

if __name__ == '__main__':
    print("🤖 Starting AI Quality Verification Service...")
    print("📦 TensorFlow version:", tf.__version__)
    print("🖼️  OpenCV version:", cv2.__version__)
    print("✅ Service ready on port 5002")
    
    app.run(host='0.0.0.0', port=5002, debug=False)
