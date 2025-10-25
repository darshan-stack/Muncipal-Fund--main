from flask import Flask, jsonify, request
from flask_cors import CORS
from web3 import Web3
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Blockchain connection
RPC_URL = os.getenv('RPC_URL', 'http://127.0.0.1:8545')
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Contract details (will be loaded after deployment)
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '')
CONTRACT_ABI = []

# User database (simple in-memory for demo)
USERS = {
    'admin': {'password': 'admin123', 'role': 'admin', 'address': ''},
    'supervisor': {'password': 'super123', 'role': 'supervisor', 'address': ''},
    'citizen': {'password': 'citizen123', 'role': 'citizen', 'address': ''}
}

def load_contract():
    """Load contract ABI and assign addresses"""
    global CONTRACT_ABI, USERS
    
    try:
        # Load ABI
        abi_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'contractABI.json')
        if os.path.exists(abi_path):
            with open(abi_path, 'r') as f:
                CONTRACT_ABI = json.load(f)
        
        # Assign addresses from blockchain accounts
        if w3.is_connected():
            accounts = w3.eth.accounts
            if len(accounts) >= 3:
                USERS['admin']['address'] = accounts[0]
                USERS['supervisor']['address'] = accounts[1]
                USERS['citizen']['address'] = accounts[2]
                print(f"✓ Assigned addresses: Admin={accounts[0]}, Supervisor={accounts[1]}, Citizen={accounts[2]}")
            else:
                print("⚠ Not enough blockchain accounts. Using default addresses.")
        else:
            print("⚠ Blockchain not connected")
            
    except Exception as e:
        print(f"⚠ Error loading contract: {e}")

def get_contract():
    """Get contract instance"""
    if not CONTRACT_ADDRESS or not CONTRACT_ABI:
        return None
    return w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

@app.route('/')
def home():
    return jsonify({
        "message": "Municipal Fund Tracker API",
        "blockchain": "Connected" if w3.is_connected() else "Disconnected",
        "contract": CONTRACT_ADDRESS if CONTRACT_ADDRESS else "Not deployed yet",
        "version": "2.0 - With Anonymous Tenders",
        "endpoints": {
            "auth": "POST /api/login",
            "blockchain": "GET /api/blockchain/status",
            "projects": "GET /api/projects",
            "project": "GET /api/projects/:id",
            "create_project": "POST /api/projects/create",
            "tenders": "GET /api/tenders/:projectId",
            "submit_tender": "POST /api/tenders/submit",
            "approve_tender": "POST /api/tenders/approve",
            "milestones": "GET /api/milestones/:projectId",
            "submit_milestone": "POST /api/milestones/submit",
            "verify_milestone": "POST /api/milestones/verify",
            "stats": "GET /api/stats"
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in USERS and USERS[username]['password'] == password:
        return jsonify({
            "success": True,
            "user": {
                "username": username,
                "role": USERS[username]['role'],
                "address": USERS[username]['address']
            }
        })
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/blockchain/status')
def blockchain_status():
    return jsonify({
        "connected": w3.is_connected(),
        "rpc_url": RPC_URL,
        "contract_address": CONTRACT_ADDRESS if CONTRACT_ADDRESS else "Not deployed",
        "has_abi": len(CONTRACT_ABI) > 0,
        "accounts": w3.eth.accounts if w3.is_connected() else []
    })

@app.route('/api/projects')
def get_projects():
    contract = get_contract()
    if not contract:
        return jsonify({"error": "Contract not deployed"}), 500
    
    try:
        project_count = contract.functions.projectCount().call()
        projects = []
        
        for i in range(1, project_count + 1):
            try:
                project = contract.functions.getProject(i).call()
                projects.append({
                    "id": project[0],
                    "name": project[1],
                    "description": project[2],
                    "location": project[3],
                    "budget": project[4],
                    "allocatedFunds": project[5],
                    "spentFunds": project[6],
                    "admin": project[7],
                    "status": project[8],
                    "createdAt": project[9]
                })
            except:
                continue
        
        return jsonify({"projects": projects, "total": len(projects)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<int:project_id>')
def get_project(project_id):
    contract = get_contract()
    if not contract:
        return jsonify({"error": "Contract not deployed"}), 500
    
    try:
        project = contract.functions.getProject(project_id).call()
        return jsonify({
            "id": project[0],
            "name": project[1],
            "description": project[2],
            "location": project[3],
            "budget": project[4],
            "allocatedFunds": project[5],
            "spentFunds": project[6],
            "admin": project[7],
            "status": project[8],
            "createdAt": project[9]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tenders/<int:project_id>')
def get_tenders(project_id):
    contract = get_contract()
    if not contract:
        return jsonify({"error": "Contract not deployed"}), 500
    
    try:
        tender_ids = contract.functions.getProjectTenders(project_id).call()
        tenders = []
        
        for tender_id in tender_ids:
            tender = contract.functions.getTender(tender_id).call()
            tenders.append({
                "id": tender[0],
                "projectId": tender[1],
                "contractorCommitment": tender[2].hex(),
                "encryptedDataIPFS": tender[3],
                "tenderDocIPFS": tender[4],
                "qualityReportIPFS": tender[5],
                "status": tender[6],
                "submittedAt": tender[7]
            })
        
        return jsonify({"tenders": tenders, "total": len(tenders)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/milestones/<int:project_id>')
def get_milestones(project_id):
    contract = get_contract()
    if not contract:
        return jsonify({"error": "Contract not deployed"}), 500
    
    try:
        milestone_ids = contract.functions.getProjectMilestones(project_id).call()
        milestones = []
        
        for milestone_id in milestone_ids:
            milestone = contract.functions.getMilestone(milestone_id).call()
            milestones.append({
                "id": milestone[0],
                "projectId": milestone[1],
                "tenderId": milestone[2],
                "percentageComplete": milestone[3],
                "targetAmount": milestone[4],
                "spentAmount": milestone[5],
                "status": milestone[6],
                "submittedAt": milestone[7],
                "approvedAt": milestone[8]
            })
        
        return jsonify({"milestones": milestones, "total": len(milestones)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats')
def get_stats():
    contract = get_contract()
    if not contract:
        return jsonify({
            "totalBudget": 0,
            "allocatedFunds": 0,
            "spentFunds": 0,
            "projectCount": 0,
            "activeProjects": 0
        })
    
    try:
        project_count = contract.functions.projectCount().call()
        total_budget = 0
        allocated = 0
        spent = 0
        active = 0
        
        for i in range(1, project_count + 1):
            try:
                project = contract.functions.getProject(i).call()
                total_budget += project[4]  # budget
                allocated += project[5]  # allocatedFunds
                spent += project[6]  # spentFunds
                if project[8] == 1:  # InProgress status
                    active += 1
            except:
                continue
        
        return jsonify({
            "totalBudget": total_budget,
            "allocatedFunds": allocated,
            "spentFunds": spent,
            "projectCount": project_count,
            "activeProjects": active
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Municipal Fund Blockchain API Server")
    print("="*50)
    print(f"RPC URL: {RPC_URL}")
    print(f"Blockchain Connected: {w3.is_connected()}")
    print(f"Contract Address: {CONTRACT_ADDRESS if CONTRACT_ADDRESS else 'Not deployed yet'}")
    print("\nUser Accounts:")
    print("  Admin:      admin / admin123")
    print("  Supervisor: supervisor / super123")
    print("  Citizen:    citizen / citizen123")
    print("\n⚠️  SECURITY WARNING:")
    print("  Your MetaMask private key was shared publicly!")
    print("  Transfer all funds and create a NEW wallet immediately!")
    print("="*50 + "\n")
    
    load_contract()
    app.run(host='0.0.0.0', port=5000, debug=True)
