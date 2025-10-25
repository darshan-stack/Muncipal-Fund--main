from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# In-memory storage
users = {
    'admin': {'role': 'admin', 'address': '0x' + '1' * 40, 'password': 'admin123'},
    'supervisor': {'role': 'supervisor', 'address': '0x' + '2' * 40, 'password': 'super123'},
    'citizen': {'role': 'citizen', 'address': '0x' + '3' * 40, 'password': 'citizen123'}
}

contractors = {}
projects = {}
tenders = {}

@app.route('/')
def home():
    return jsonify({
        "message": "Municipal Fund Tracker API",
        "status": "✅ Running",
        "version": "3.0 - With Contractor Registration",
        "endpoints": {
            "auth": "POST /api/login",
            "contractors": {
                "register": "POST /api/contractors/register",
                "list": "GET /api/contractors",
                "get": "GET /api/contractors/<id>"
            },
            "projects": "GET /api/projects",
            "tenders": "GET /api/tenders"
        }
    })

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = users.get(username)
        if user and user['password'] == password:
            return jsonify({
                'success': True,
                'user': {
                    'username': username,
                    'role': user['role'],
                    'address': user['address'],
                    'blockchain_id': user.get('blockchain_id')
                },
                'token': f"token_{username}_{int(datetime.now().timestamp())}"
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contractors/register', methods=['POST', 'OPTIONS'])
def register_contractor():
    """Register a new contractor with blockchain ID"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        print(f"\n📝 Registering contractor: {data.get('company_name')}")
        print(f"   Received data keys: {list(data.keys())}")
        
        # Validate required fields
        required = ['blockchain_id', 'company_name', 'email', 'username', 'password']
        missing = [f for f in required if not data.get(f)]
        if missing:
            error_msg = f'Missing required fields: {", ".join(missing)}'
            print(f"   ❌ Validation failed: {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        # Check if blockchain ID already exists
        if data['blockchain_id'] in contractors:
            return jsonify({'error': 'Blockchain ID already registered'}), 400
        
        # Check if username already exists
        if data['username'] in users:
            return jsonify({'error': 'Username already taken'}), 400
            
        for cid, contractor in contractors.items():
            if contractor.get('username') == data['username']:
                return jsonify({'error': 'Username already taken'}), 400
        
        # Store contractor
        contractor_data = {
            'blockchain_id': data['blockchain_id'],
            'company_name': data['company_name'],
            'contact_person': data.get('contact_person', ''),
            'email': data['email'],
            'phone': data.get('phone', ''),
            'registration_number': data.get('registration_number', ''),
            'address': data.get('address', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'pincode': data.get('pincode', ''),
            'experience': data.get('experience', 0),
            'specialization': data.get('specialization', ''),
            'wallet_address': data.get('wallet_address', ''),
            'username': data['username'],
            'password': data['password'],  # In production, hash this!
            'registration_tx_hash': data.get('registration_tx_hash', ''),
            'status': data.get('status', 'pending'),
            'role': 'contractor',
            'registered_at': datetime.now().isoformat()
        }
        
        contractors[data['blockchain_id']] = contractor_data
        
        # Also add to users dict for login
        users[data['username']] = {
            'role': 'contractor',
            'address': data.get('wallet_address'),
            'password': data['password'],
            'blockchain_id': data['blockchain_id'],
            'company_name': data['company_name']
        }
        
        print(f"✅ Contractor registered successfully!")
        print(f"   Company: {data['company_name']}")
        print(f"   Blockchain ID: {data['blockchain_id']}")
        print(f"   Username: {data['username']}")
        
        return jsonify({
            'success': True,
            'message': 'Contractor registered successfully',
            'blockchain_id': data['blockchain_id'],
            'username': data['username']
        }), 201
        
    except Exception as e:
        print(f"❌ Error registering contractor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/contractors/<blockchain_id>', methods=['GET'])
def get_contractor(blockchain_id):
    """Get contractor details by blockchain ID"""
    contractor = contractors.get(blockchain_id)
    if contractor:
        # Don't send password
        contractor_data = contractor.copy()
        contractor_data.pop('password', None)
        return jsonify(contractor_data)
    return jsonify({'error': 'Contractor not found'}), 404

@app.route('/api/contractors', methods=['GET'])
def list_contractors():
    """List all contractors"""
    contractor_list = []
    for cid, contractor in contractors.items():
        contractor_data = contractor.copy()
        contractor_data.pop('password', None)
        contractor_list.append(contractor_data)
    return jsonify(contractor_list)

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    # Return demo projects if none exist
    if not projects:
        demo_projects = [
            {
                'id': 'demo-1',
                'name': 'Road Construction - Main Street',
                'description': 'Repair and upgrade main street infrastructure',
                'budget': 500000,
                'allocated': 500000,
                'spent': 250000,
                'status': 'In Progress',
                'location': 'Downtown',
                'created_at': '2025-10-01',
                'tx_hash': '0xdemo1234567890abcdef'
            },
            {
                'id': 'demo-2',
                'name': 'School Building Renovation',
                'description': 'Renovate and modernize school facilities',
                'budget': 750000,
                'allocated': 600000,
                'spent': 150000,
                'status': 'Planning',
                'location': 'East District',
                'created_at': '2025-10-15',
                'tx_hash': '0xdemo2234567890abcdef'
            },
            {
                'id': 'demo-3',
                'name': 'Water Supply Upgrade',
                'description': 'Upgrade water supply infrastructure',
                'budget': 1000000,
                'allocated': 1000000,
                'spent': 800000,
                'status': 'Completed',
                'location': 'West Zone',
                'created_at': '2025-09-10',
                'tx_hash': '0xdemo3234567890abcdef'
            }
        ]
        return jsonify(demo_projects)
    return jsonify(list(projects.values()))

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    # Calculate stats from projects
    total_budget = sum(p.get('budget', 0) for p in projects.values()) if projects else 2250000
    total_allocated = sum(p.get('allocated', 0) for p in projects.values()) if projects else 2100000
    total_spent = sum(p.get('spent', 0) for p in projects.values()) if projects else 1200000
    active_projects = sum(1 for p in projects.values() if p.get('status') != 'Completed') if projects else 2
    
    return jsonify({
        'total_projects': len(projects) if projects else 3,
        'active_projects': active_projects,
        'total_budget': total_budget,
        'total_allocated': total_allocated,
        'total_spent': total_spent,
        'unallocated_funds': total_budget - total_allocated,
        'budget_utilization': round((total_spent / total_budget * 100) if total_budget > 0 else 0, 2),
        'contractors_count': len(contractors),
        'pending_approvals': 0
    })

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all blockchain transactions"""
    demo_transactions = [
        {
            'id': 'tx-1',
            'type': 'project_create',
            'tx_hash': '0xa1b2c3d4e5f6789012345678901234567890abcd',
            'timestamp': '2025-01-15T10:30:00Z',
            'block_number': 12345678,
            'status': 'confirmed',
            'details': {
                'project_name': 'Road Construction',
                'budget': 500000,
                'created_by': 'Admin'
            }
        },
        {
            'id': 'tx-2',
            'type': 'fund_allocation',
            'tx_hash': '0xb2c3d4e5f6789012345678901234567890abcdef',
            'timestamp': '2025-01-16T14:20:00Z',
            'block_number': 12345890,
            'status': 'confirmed',
            'details': {
                'project_name': 'Road Construction',
                'amount': 250000,
                'allocated_by': 'Supervisor'
            }
        },
        {
            'id': 'tx-3',
            'type': 'expenditure',
            'tx_hash': '0xc3d4e5f6789012345678901234567890abcdef01',
            'timestamp': '2025-01-17T09:15:00Z',
            'block_number': 12346012,
            'status': 'confirmed',
            'details': {
                'project_name': 'Road Construction',
                'amount': 150000,
                'contractor': 'ABC Contractors',
                'description': 'Material procurement'
            }
        },
        {
            'id': 'tx-4',
            'type': 'project_create',
            'tx_hash': '0xd4e5f6789012345678901234567890abcdef0123',
            'timestamp': '2025-01-18T11:00:00Z',
            'block_number': 12346234,
            'status': 'confirmed',
            'details': {
                'project_name': 'School Building',
                'budget': 750000,
                'created_by': 'Admin'
            }
        },
        {
            'id': 'tx-5',
            'type': 'milestone_create',
            'tx_hash': '0xe5f6789012345678901234567890abcdef012345',
            'timestamp': '2025-01-19T16:30:00Z',
            'block_number': 12346456,
            'status': 'confirmed',
            'details': {
                'project_name': 'Road Construction',
                'milestone': 'Foundation Complete',
                'target_amount': 100000
            }
        },
        {
            'id': 'tx-6',
            'type': 'fund_allocation',
            'tx_hash': '0xf6789012345678901234567890abcdef01234567',
            'timestamp': '2025-01-20T10:45:00Z',
            'block_number': 12346678,
            'status': 'confirmed',
            'details': {
                'project_name': 'School Building',
                'amount': 300000,
                'allocated_by': 'Supervisor'
            }
        },
        {
            'id': 'tx-7',
            'type': 'expenditure',
            'tx_hash': '0x0789012345678901234567890abcdef012345678',
            'timestamp': '2025-01-21T13:20:00Z',
            'block_number': 12346890,
            'status': 'confirmed',
            'details': {
                'project_name': 'Water Supply Upgrade',
                'amount': 500000,
                'contractor': 'XYZ Infrastructure',
                'description': 'Pipeline installation'
            }
        },
        {
            'id': 'tx-8',
            'type': 'project_create',
            'tx_hash': '0x189012345678901234567890abcdef0123456789',
            'timestamp': '2025-01-22T09:00:00Z',
            'block_number': 12347012,
            'status': 'confirmed',
            'details': {
                'project_name': 'Water Supply Upgrade',
                'budget': 1000000,
                'created_by': 'Admin'
            }
        },
        {
            'id': 'tx-9',
            'type': 'expenditure',
            'tx_hash': '0x29012345678901234567890abcdef01234567890',
            'timestamp': '2025-01-23T15:10:00Z',
            'block_number': 12347234,
            'status': 'confirmed',
            'details': {
                'project_name': 'Road Construction',
                'amount': 100000,
                'contractor': 'ABC Contractors',
                'description': 'Labor costs'
            }
        },
        {
            'id': 'tx-10',
            'type': 'milestone_create',
            'tx_hash': '0x3a012345678901234567890abcdef012345678901',
            'timestamp': '2025-01-24T11:30:00Z',
            'block_number': 12347456,
            'status': 'pending',
            'details': {
                'project_name': 'School Building',
                'milestone': 'Ground Floor Complete',
                'target_amount': 200000
            }
        }
    ]
    
    return jsonify(demo_transactions)

# ============================================
# SUPERVISOR ENDPOINTS
# ============================================

@app.route('/api/supervisor/pending-tenders', methods=['GET'])
def get_pending_tenders():
    """Get all pending tenders for supervisor approval"""
    # Return demo pending tenders
    demo_tenders = [
        {
            'id': 'tender-1',
            'project_id': 'demo-1',
            'project_name': 'Road Construction - Main Street',
            'contractor_id': 'CNTR-ANON-001',
            'submitted_at': '2025-01-15T10:00:00Z',
            'status': 'pending',
            'tender_documents': [
                {
                    'name': 'Technical Proposal.pdf',
                    'url': '/uploads/tender1-technical.pdf',
                    'type': 'pdf'
                },
                {
                    'name': 'Financial Bid.pdf',
                    'url': '/uploads/tender1-financial.pdf',
                    'type': 'pdf'
                }
            ],
            'estimated_cost': 480000,
            'completion_time': '6 months',
            'experience_years': 10
        },
        {
            'id': 'tender-2',
            'project_id': 'demo-2',
            'project_name': 'School Building Renovation',
            'contractor_id': 'CNTR-ANON-002',
            'submitted_at': '2025-01-16T14:30:00Z',
            'status': 'pending',
            'tender_documents': [
                {
                    'name': 'Renovation Plan.pdf',
                    'url': '/uploads/tender2-plan.pdf',
                    'type': 'pdf'
                }
            ],
            'estimated_cost': 720000,
            'completion_time': '8 months',
            'experience_years': 15
        }
    ]
    
    return jsonify({'tenders': demo_tenders})

@app.route('/api/supervisor/approve-tender', methods=['POST'])
def approve_tender():
    """Approve a tender"""
    data = request.get_json()
    
    print(f"=== Approving Tender ===")
    print(f"Project ID: {data.get('project_id')}")
    print(f"Tender ID: {data.get('tender_id')}")
    
    # In a real app, update tender status in database
    # For demo, just return success
    
    return jsonify({
        'success': True,
        'message': 'Tender approved successfully',
        'tender_id': data.get('tender_id'),
        'approved_at': datetime.now().isoformat()
    })

@app.route('/api/supervisor/reject-tender', methods=['POST'])
def reject_tender():
    """Reject a tender"""
    data = request.get_json()
    
    print(f"=== Rejecting Tender ===")
    print(f"Project ID: {data.get('project_id')}")
    print(f"Tender ID: {data.get('tender_id')}")
    print(f"Reason: {data.get('reason')}")
    
    # In a real app, update tender status in database
    # For demo, just return success
    
    return jsonify({
        'success': True,
        'message': 'Tender rejected',
        'tender_id': data.get('tender_id'),
        'rejected_at': datetime.now().isoformat()
    })

# ============================================
# ORACLE/VERIFICATION ENDPOINTS
# ============================================

@app.route('/api/oracle/verifications', methods=['GET'])
def get_verifications():
    """Get all pending milestone verifications"""
    # Return demo verifications
    demo_verifications = [
        {
            'id': 'verify-1',
            'project_id': 'demo-1',
            'project_name': 'Road Construction - Main Street',
            'milestone_id': 'milestone-1',
            'milestone_name': 'Foundation Complete',
            'contractor_id': 'CNTR-12345',
            'contractor_name': 'ABC Contractors',
            'contractor_address': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            'submitted_at': '2025-01-20T09:00:00Z',
            'status': 'pending_verification',
            'percentage_complete': 25,
            'amount_requested': 125000,
            'proof_documents': [
                {
                    'name': 'Foundation Photos.pdf',
                    'url': '/uploads/milestone1-photos.pdf',
                    'type': 'pdf'
                },
                {
                    'name': 'Quality Report.pdf',
                    'url': '/uploads/milestone1-quality.pdf',
                    'type': 'pdf'
                }
            ],
            'gps_coordinates': '40.7128° N, 74.0060° W',
            'completion_proof': 'Foundation work completed as per specifications',
            'submission_files': [
                {
                    'name': 'Foundation Photos.pdf',
                    'url': '/uploads/milestone1-photos.pdf',
                    'type': 'pdf'
                },
                {
                    'name': 'Quality Report.pdf',
                    'url': '/uploads/milestone1-quality.pdf',
                    'type': 'pdf'
                }
            ]
        },
        {
            'id': 'verify-2',
            'project_id': 'demo-3',
            'project_name': 'Water Supply Upgrade',
            'milestone_id': 'milestone-3',
            'milestone_name': 'Pipeline Installation Phase 1',
            'contractor_id': 'CNTR-67890',
            'contractor_name': 'XYZ Infrastructure',
            'contractor_address': '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
            'submitted_at': '2025-01-21T15:30:00Z',
            'status': 'pending_verification',
            'percentage_complete': 50,
            'amount_requested': 500000,
            'proof_documents': [
                {
                    'name': 'Installation Report.pdf',
                    'url': '/uploads/milestone3-report.pdf',
                    'type': 'pdf'
                }
            ],
            'gps_coordinates': '40.7580° N, 73.9855° W',
            'completion_proof': 'Phase 1 pipeline installation completed',
            'submission_files': [
                {
                    'name': 'Installation Report.pdf',
                    'url': '/uploads/milestone3-report.pdf',
                    'type': 'pdf'
                }
            ]
        }
    ]
    
    return jsonify({'verifications': demo_verifications})

@app.route('/api/oracle/verify', methods=['POST'])
def verify_milestone():
    """Verify and approve/reject a milestone"""
    data = request.get_json()
    
    print(f"=== Verifying Milestone ===")
    print(f"Milestone ID: {data.get('milestone_id')}")
    print(f"Verification ID: {data.get('verification_id')}")
    print(f"Approved: {data.get('approved')}")
    print(f"GPS Verified: {data.get('gps_verified')}")
    print(f"Quality Verified: {data.get('quality_verified')}")
    print(f"Progress Verified: {data.get('progress_verified')}")
    
    # In a real app, update milestone status and release funds
    # For demo, just return success
    
    approved = data.get('approved', True)
    
    return jsonify({
        'success': True,
        'message': 'Milestone verified and funds released' if approved else 'Milestone verification rejected',
        'milestone_id': data.get('milestone_id'),
        'verified_at': datetime.now().isoformat(),
        'funds_released': approved
    })

@app.route('/api/tenders/<project_id>', methods=['GET'])
def get_tenders(project_id):
    """Get tenders for a project"""
    project_tenders = [t for t in tenders.values() if t['project_id'] == project_id]
    return jsonify(project_tenders)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'contractors_count': len(contractors),
        'users_count': len(users),
        'projects_count': len(projects)
    })

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 Municipal Fund Tracker API - CONTRACTOR VERSION")
    print("=" * 70)
    print(f"\n📍 Server: http://localhost:5000")
    print(f"🏥 Health: http://localhost:5000/api/health")
    print(f"\n📋 Available Endpoints:")
    print(f"   POST /api/login - User authentication")
    print(f"   POST /api/contractors/register - ✨ Register contractor")
    print(f"   GET  /api/contractors - List all contractors")
    print(f"   GET  /api/contractors/<id> - Get contractor details")
    print(f"   GET  /api/projects - List projects")
    print(f"   GET  /api/tenders/<project_id> - Get tenders")
    print(f"\n👥 Demo Accounts:")
    print(f"   Admin:      admin / admin123")
    print(f"   Supervisor: supervisor / super123")
    print(f"   Citizen:    citizen / citizen123")
    print(f"   Contractor: Register at http://localhost:3000/contractor/signup")
    print("\n" + "=" * 70)
    print("✅ Server ready! Waiting for contractor registrations...")
    print("=" * 70 + "\n")
    
    try:
        app.run(debug=True, port=5000, host='0.0.0.0')
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
