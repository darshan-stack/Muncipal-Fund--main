from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# User database (simple in-memory for demo)
USERS = {
    'admin': {'password': 'admin123', 'role': 'admin', 'address': '0xAdmin123'},
    'supervisor': {'password': 'super123', 'role': 'supervisor', 'address': '0xSuper456'},
    'citizen': {'password': 'citizen123', 'role': 'citizen', 'address': '0xCitizen789'}
}

# Mock data for demo (without blockchain)
MOCK_PROJECTS = [
    {
        "id": 1,
        "name": "Highway Construction - NH48",
        "description": "Construction of 50km highway with smart lighting",
        "location": "Mumbai-Pune",
        "category": "Infrastructure",
        "budget": 50000000,
        "allocated_funds": 10000000,
        "allocatedFunds": 10000000,  # Both formats for compatibility
        "spent_funds": 5000000,
        "spentFunds": 5000000,  # Both formats for compatibility
        "admin": "0xAdmin123",
        "manager_address": "0xAdmin123",  # For frontend compatibility
        "status": "Active",
        "createdAt": 1698153600,
        "tx_hash": "0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
    },
    {
        "id": 2,
        "name": "Smart City Water Pipeline",
        "description": "Underground water supply system for 1000 homes",
        "location": "Bangalore",
        "category": "Infrastructure",
        "budget": 25000000,
        "allocated_funds": 5000000,
        "allocatedFunds": 5000000,  # Both formats for compatibility
        "spent_funds": 2500000,
        "spentFunds": 2500000,  # Both formats for compatibility
        "admin": "0xAdmin123",
        "manager_address": "0xAdmin123",  # For frontend compatibility
        "status": "Active",
        "createdAt": 1698240000,
        "tx_hash": "0xdemo0987654321fedcba0987654321fedcba0987654321fedcba0987654321fe"
    }
]

# Mock pending tenders for supervisor
MOCK_PENDING_TENDERS = []

# Mock rejection reasons
MOCK_REJECTIONS = []

# Mock milestones - each project has 5 milestones (20% each)
MOCK_MILESTONES = {}

# Mock oracle verifications (pending work submissions)
MOCK_ORACLE_VERIFICATIONS = []

# Mock quality reports
MOCK_QUALITY_REPORTS = {}

MOCK_TENDERS = [
    {
        "id": 1,
        "projectId": 1,
        "contractorCommitment": "0x1234567890abcdef",
        "tenderDocIPFS": "QmTenderDoc123",
        "status": 2,
        "submittedAt": 1698243600
    }
]

@app.route('/')
def home():
    return jsonify({
        "message": "Municipal Fund Tracker API - DEMO MODE (No Blockchain)",
        "status": "Running",
        "mode": "DEMO - Using Mock Data",
        "version": "2.0 - With Anonymous Tenders",
        "note": "Deploy smart contract using Remix IDE to enable blockchain",
        "endpoints": {
            "auth": "POST /api/login",
            "projects": "GET /api/projects",
            "project": "GET /api/projects/:id",
            "tenders": "GET /api/tenders/:projectId",
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
            },
            "message": f"Welcome {username}! (Demo mode - no blockchain)"
        })
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/blockchain/status')
def blockchain_status():
    return jsonify({
        "connected": False,
        "mode": "DEMO",
        "message": "Deploy contract using Remix IDE to enable blockchain",
        "rpc_url": "http://127.0.0.1:8545",
        "contract_address": "Not deployed - Using mock data"
    })

@app.route('/api/projects')
def get_projects():
    return jsonify({
        "projects": MOCK_PROJECTS,
        "total": len(MOCK_PROJECTS),
        "mode": "DEMO"
    })

@app.route('/api/projects/<int:project_id>')
def get_project(project_id):
    project = next((p for p in MOCK_PROJECTS if p['id'] == project_id), None)
    if project:
        return jsonify(project)
    return jsonify({"error": "Project not found"}), 404

@app.route('/api/milestones/<int:project_id>')
def get_milestones(project_id):
    # Mock milestones data
    mock_milestones = [
        {
            "id": 1,
            "project_id": project_id,
            "name": "Foundation & Site Preparation",
            "description": "Complete site clearing and foundation work",
            "target_amount": 5000000,
            "spent_amount": 4500000,
            "status": "Completed",
            "tx_hash": "0xmilestone1234567890abcdef1234567890abcdef1234567890abcdef1234567"
        },
        {
            "id": 2,
            "project_id": project_id,
            "name": "Structural Construction",
            "description": "Main structural work and framework",
            "target_amount": 8000000,
            "spent_amount": 2500000,
            "status": "InProgress",
            "tx_hash": "0xmilestone2345678901bcdef2345678901bcdef2345678901bcdef2345678901"
        }
    ]
    return jsonify(mock_milestones)

@app.route('/api/expenditures/<int:project_id>')
def get_expenditures(project_id):
    # Mock expenditures data
    mock_expenditures = [
        {
            "id": 1,
            "project_id": project_id,
            "milestone_id": 1,
            "amount": 2000000,
            "category": "Materials",
            "description": "Cement, steel, and construction materials",
            "recipient": "0xContractor1234567890abcdef1234567890",
            "timestamp": "2025-09-15T10:30:00Z",
            "tx_hash": "0xexp1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd"
        },
        {
            "id": 2,
            "project_id": project_id,
            "milestone_id": 1,
            "amount": 1500000,
            "category": "Labor",
            "description": "Construction workforce payment",
            "recipient": "0xLabor234567890abcdef1234567890abcde",
            "timestamp": "2025-09-20T14:45:00Z",
            "tx_hash": "0xexp2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef"
        },
        {
            "id": 3,
            "project_id": project_id,
            "milestone_id": 2,
            "amount": 2500000,
            "category": "Equipment",
            "description": "Heavy machinery rental and operation",
            "recipient": "0xEquipment34567890abcdef1234567890",
            "timestamp": "2025-10-01T09:15:00Z",
            "tx_hash": "0xexp3456789012cdef3456789012cdef3456789012cdef3456789012cdef34567"
        }
    ]
    return jsonify(mock_expenditures)

@app.route('/api/milestones', methods=['POST'])
def create_milestone():
    data = request.get_json()
    new_milestone = {
        "id": 100 + int(data.get('project_id', 0)),
        "project_id": data.get('project_id'),
        "name": data.get('name'),
        "description": data.get('description'),
        "target_amount": data.get('target_amount'),
        "spent_amount": 0,
        "status": "Pending",
        "tx_hash": data.get('tx_hash')
    }
    return jsonify({
        "message": "Milestone created successfully (DEMO mode)",
        "milestone": new_milestone
    }), 201

@app.route('/api/expenditures', methods=['POST'])
def create_expenditure():
    data = request.get_json()
    new_expenditure = {
        "id": 200 + int(data.get('project_id', 0)),
        "project_id": data.get('project_id'),
        "milestone_id": data.get('milestone_id'),
        "amount": data.get('amount'),
        "category": data.get('category'),
        "description": data.get('description'),
        "recipient": data.get('recipient'),
        "timestamp": "2025-10-25T12:00:00Z",
        "tx_hash": data.get('tx_hash')
    }
    return jsonify({
        "message": "Expenditure recorded successfully (DEMO mode)",
        "expenditure": new_expenditure
    }), 201

@app.route('/api/milestones/<int:milestone_id>', methods=['PUT'])
def update_milestone(milestone_id):
    data = request.get_json()
    return jsonify({
        "message": "Milestone updated successfully (DEMO mode)",
        "status": data.get('status')
    }), 200

# Supervisor Tender Submission
@app.route('/api/supervisor/tenders', methods=['POST'])
def submit_to_supervisor():
    data = request.get_json()
    
    # Create anonymous tender (contractor name hidden)
    tender = {
        "id": len(MOCK_PENDING_TENDERS) + 1,
        "project_id": data.get('project_id'),
        "tender_documents": data.get('tender_documents', []),
        "design_files": data.get('design_files', []),
        "geo_tagged_photos": data.get('geo_tagged_photos', []),
        "budget": data.get('budget'),
        "location": data.get('location'),
        "category": data.get('category'),
        "description": data.get('description'),
        "tx_hash": data.get('tx_hash'),
        "submitted_at": data.get('submitted_at'),
        "status": "PendingApproval"
        # Note: contractor_name is NOT included (anonymous)
    }
    
    MOCK_PENDING_TENDERS.append(tender)
    
    return jsonify({
        "message": "Tender sent to supervisor successfully (DEMO mode)",
        "tender_id": tender['id']
    }), 201

# Get pending tenders for supervisor
@app.route('/api/supervisor/pending-tenders')
def get_pending_tenders():
    return jsonify({
        "tenders": MOCK_PENDING_TENDERS,
        "total": len(MOCK_PENDING_TENDERS)
    })

# Approve tender
@app.route('/api/supervisor/approve-tender', methods=['POST'])
def approve_tender():
    data = request.get_json()
    project_id = data.get('project_id')
    tender_id = data.get('tender_id')
    
    # Remove from pending
    global MOCK_PENDING_TENDERS
    MOCK_PENDING_TENDERS = [t for t in MOCK_PENDING_TENDERS if t['id'] != tender_id]
    
    # Update project status
    for project in MOCK_PROJECTS:
        if project['id'] == project_id:
            project['status'] = 'Approved'
            project['approved_at'] = data.get('approved_at')
            project['supervisor_address'] = data.get('supervisor_address')
            # Release first milestone funds (20% of budget)
            first_milestone_amount = project['budget'] * 0.20
            project['allocated_funds'] = first_milestone_amount
            project['allocatedFunds'] = first_milestone_amount
            
            # Initialize 5 milestones automatically
            milestone_amount = project['budget'] * 0.20
            milestones = []
            milestone_names = [
                "Foundation & Site Preparation",
                "Structural Framework & Core Construction",
                "Utility Installation & Internal Systems",
                "Finishing & Quality Assurance",
                "Final Inspection & Handover"
            ]
            
            milestone_descriptions = [
                "Complete site clearing, excavation, and foundation work. Install base infrastructure.",
                "Construct main structural elements, framework, and load-bearing components.",
                "Install electrical, plumbing, HVAC systems and internal infrastructure.",
                "Complete interior/exterior finishing, painting, landscaping, and quality checks.",
                "Final inspection, documentation, quality report submission, and project handover."
            ]
            
            for i in range(5):
                milestone = {
                    "id": i + 1,
                    "project_id": project_id,
                    "milestone_number": i + 1,
                    "name": milestone_names[i],
                    "description": milestone_descriptions[i],
                    "percentage": 20,
                    "amount": milestone_amount,
                    "contractor_address": project.get('contractor_address', '0xContractor'),
                    "status": "pending" if i > 0 else "active",
                    "work_submitted": False,
                    "verification_status": "not_submitted",
                    "payment_released": False,
                    "payment_amount": 0,
                    "started_at": None if i > 0 else data.get('approved_at'),
                    "submitted_at": None,
                    "verified_at": None,
                    "paid_at": None,
                    "oracle_feedback": None,
                    "submission_files": []
                }
                milestones.append(milestone)
            
            MOCK_MILESTONES[project_id] = milestones
            break
    
    return jsonify({
        "message": "Tender approved successfully (DEMO mode)",
        "funds_released": first_milestone_amount,
        "tx_hash": data.get('tx_hash')
    }), 200

# Reject tender
@app.route('/api/supervisor/reject-tender', methods=['POST'])
def reject_tender():
    data = request.get_json()
    project_id = data.get('project_id')
    tender_id = data.get('tender_id')
    
    # Remove from pending
    global MOCK_PENDING_TENDERS
    MOCK_PENDING_TENDERS = [t for t in MOCK_PENDING_TENDERS if t['id'] != tender_id]
    
    # Store rejection reason
    rejection = {
        "project_id": project_id,
        "tender_id": tender_id,
        "supervisor_address": data.get('supervisor_address'),
        "rejection_reason": data.get('rejection_reason'),
        "rejected_at": data.get('rejected_at')
    }
    MOCK_REJECTIONS.append(rejection)
    
    # Update project status
    for project in MOCK_PROJECTS:
        if project['id'] == project_id:
            project['status'] = 'Rejected'
            project['rejection_reason'] = data.get('rejection_reason')
            project['rejected_at'] = data.get('rejected_at')
            break
    
    return jsonify({
        "message": "Tender rejected (DEMO mode)",
        "rejection_id": len(MOCK_REJECTIONS)
    }), 200

# Get rejections for admin
@app.route('/api/admin/rejections')
def get_rejections():
    return jsonify({
        "rejections": MOCK_REJECTIONS,
        "total": len(MOCK_REJECTIONS)
    })

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    
    # Generate new project ID
    new_id = max([p['id'] for p in MOCK_PROJECTS]) + 1 if MOCK_PROJECTS else 1
    
    # Create new project with both naming conventions for compatibility
    new_project = {
        "id": new_id,
        "name": data.get('name'),
        "description": data.get('description'),
        "location": data.get('category', 'N/A'),
        "category": data.get('category', 'Other'),
        "budget": int(data.get('budget', 0)),
        "allocated_funds": 0,
        "allocatedFunds": 0,  # Both formats
        "spent_funds": 0,
        "spentFunds": 0,  # Both formats
        "admin": data.get('manager_address', '0xDemo'),
        "manager_address": data.get('manager_address', '0xDemo'),  # For frontend compatibility
        "status": "Created",
        "createdAt": 1698240000,
        "tx_hash": f"0xdemo{new_id:064x}"  # Generate demo tx hash
    }
    
    # Add to mock projects list
    MOCK_PROJECTS.append(new_project)
    
    return jsonify({
        "id": new_id,
        "message": "Project created successfully (DEMO mode)",
        "project": new_project
    }), 201

@app.route('/api/tenders/<int:project_id>')
def get_tenders(project_id):
    tenders = [t for t in MOCK_TENDERS if t['projectId'] == project_id]
    return jsonify({
        "tenders": tenders,
        "total": len(tenders),
        "mode": "DEMO"
    })

@app.route('/api/stats')
def get_stats():
    total_budget = sum(p['budget'] for p in MOCK_PROJECTS)
    allocated = sum(p.get('allocated_funds', p.get('allocatedFunds', 0)) for p in MOCK_PROJECTS)
    spent = sum(p.get('spent_funds', p.get('spentFunds', 0)) for p in MOCK_PROJECTS)
    active = sum(1 for p in MOCK_PROJECTS if p.get('status') in ['Active', 'Created', 1, 2])
    
    # Calculate category-wise budgets
    budget_by_category = {}
    spent_by_category = {}
    for p in MOCK_PROJECTS:
        category = p.get('category', 'Other')
        budget_by_category[category] = budget_by_category.get(category, 0) + p['budget']
        spent_by_category[category] = spent_by_category.get(category, 0) + p.get('spent_funds', p.get('spentFunds', 0))
    
    allocation_rate = (allocated / total_budget * 100) if total_budget > 0 else 0
    spending_rate = (spent / allocated * 100) if allocated > 0 else 0
    budget_utilization = (spent / total_budget * 100) if total_budget > 0 else 0
    
    return jsonify({
        # Original format
        "totalBudget": total_budget,
        "allocatedFunds": allocated,
        "spentFunds": spent,
        "projectCount": len(MOCK_PROJECTS),
        "activeProjects": active,
        # Extended format expected by Dashboard
        "total_budget": total_budget,
        "total_allocated": allocated,
        "total_spent": spent,
        "total_projects": len(MOCK_PROJECTS),
        "active_projects": active,
        "allocation_rate": allocation_rate,
        "spending_rate": spending_rate,
        "budget_utilization": budget_utilization,
        "allocated_unspent": allocated - spent,
        "unallocated_funds": total_budget - allocated,
        "completed_milestones": 3,
        "total_milestones": 10,
        "budget_by_project_category": budget_by_category,
        "spent_by_project_category": spent_by_category,
        "mode": "DEMO"
    })

# ============= MILESTONE SYSTEM WITH ORACLE VERIFICATION =============

@app.route('/api/projects/<int:project_id>/milestones', methods=['GET'])
def get_project_milestones(project_id):
    """Get all 5 milestones for a project"""
    milestones = MOCK_MILESTONES.get(project_id, [])
    return jsonify({
        "milestones": milestones,
        "total": len(milestones),
        "project_id": project_id
    })

@app.route('/api/projects/<int:project_id>/milestones/initialize', methods=['POST'])
def initialize_milestones(project_id):
    """Initialize 5 milestones (20% each) when project is approved"""
    data = request.get_json()
    budget = data.get('budget', 0)
    contractor_address = data.get('contractor_address', '')
    
    # Create 5 milestones, each 20% of budget
    milestone_amount = budget * 0.20
    
    milestones = []
    milestone_names = [
        "Foundation & Site Preparation",
        "Structural Framework & Core Construction",
        "Utility Installation & Internal Systems",
        "Finishing & Quality Assurance",
        "Final Inspection & Handover"
    ]
    
    milestone_descriptions = [
        "Complete site clearing, excavation, and foundation work. Install base infrastructure.",
        "Construct main structural elements, framework, and load-bearing components.",
        "Install electrical, plumbing, HVAC systems and internal infrastructure.",
        "Complete interior/exterior finishing, painting, landscaping, and quality checks.",
        "Final inspection, documentation, quality report submission, and project handover."
    ]
    
    for i in range(5):
        milestone = {
            "id": i + 1,
            "project_id": project_id,
            "milestone_number": i + 1,
            "name": milestone_names[i],
            "description": milestone_descriptions[i],
            "percentage": 20,
            "amount": milestone_amount,
            "contractor_address": contractor_address,
            "status": "pending" if i > 0 else "active",  # First milestone active
            "work_submitted": False,
            "verification_status": "not_submitted",
            "payment_released": False,
            "payment_amount": 0,
            "started_at": None,
            "submitted_at": None,
            "verified_at": None,
            "paid_at": None,
            "oracle_feedback": None,
            "submission_files": []
        }
        milestones.append(milestone)
    
    MOCK_MILESTONES[project_id] = milestones
    
    return jsonify({
        "message": "Milestones initialized successfully",
        "milestones": milestones,
        "total_milestones": 5,
        "milestone_amount": milestone_amount
    })

@app.route('/api/projects/<int:project_id>/milestones/<int:milestone_id>/submit', methods=['POST'])
def submit_milestone_work(project_id, milestone_id):
    """Contractor submits work for oracle verification"""
    data = request.get_json()
    
    milestones = MOCK_MILESTONES.get(project_id, [])
    milestone = next((m for m in milestones if m['id'] == milestone_id), None)
    
    if not milestone:
        return jsonify({"error": "Milestone not found"}), 404
    
    if milestone['status'] != 'active':
        return jsonify({"error": "Milestone is not active"}), 400
    
    # Update milestone with submission
    milestone['work_submitted'] = True
    milestone['verification_status'] = 'pending_verification'
    milestone['submitted_at'] = data.get('submitted_at')
    milestone['submission_files'] = data.get('submission_files', [])
    milestone['submission_notes'] = data.get('notes', '')
    
    # Add to oracle verification queue
    verification = {
        "id": len(MOCK_ORACLE_VERIFICATIONS) + 1,
        "project_id": project_id,
        "milestone_id": milestone_id,
        "milestone_name": milestone['name'],
        "contractor_address": milestone['contractor_address'],
        "submission_files": data.get('submission_files', []),
        "notes": data.get('notes', ''),
        "submitted_at": data.get('submitted_at'),
        "status": "pending",
        "budget": milestone['amount'],
        "milestone_percentage": milestone['percentage']
    }
    MOCK_ORACLE_VERIFICATIONS.append(verification)
    
    return jsonify({
        "message": "Work submitted for oracle verification",
        "verification_id": verification['id'],
        "milestone": milestone
    })

@app.route('/api/oracle/verifications', methods=['GET'])
def get_pending_verifications():
    """Oracle/Supervisor gets list of pending verifications"""
    pending = [v for v in MOCK_ORACLE_VERIFICATIONS if v['status'] == 'pending']
    return jsonify({
        "verifications": pending,
        "total": len(pending)
    })

@app.route('/api/oracle/verify', methods=['POST'])
def oracle_verify_milestone():
    """Oracle/Supervisor verifies and approves/rejects milestone"""
    data = request.get_json()
    verification_id = data.get('verification_id')
    approved = data.get('approved', False)
    feedback = data.get('feedback', '')
    oracle_address = data.get('oracle_address', '0xOracle')
    
    verification = next((v for v in MOCK_ORACLE_VERIFICATIONS if v['id'] == verification_id), None)
    
    if not verification:
        return jsonify({"error": "Verification not found"}), 404
    
    project_id = verification['project_id']
    milestone_id = verification['milestone_id']
    
    milestones = MOCK_MILESTONES.get(project_id, [])
    milestone = next((m for m in milestones if m['id'] == milestone_id), None)
    
    if not milestone:
        return jsonify({"error": "Milestone not found"}), 404
    
    if approved:
        # APPROVE: Release payment and move to next milestone
        milestone['verification_status'] = 'verified'
        milestone['status'] = 'completed'
        milestone['payment_released'] = True
        milestone['payment_amount'] = milestone['amount']
        milestone['verified_at'] = data.get('verified_at')
        milestone['paid_at'] = data.get('verified_at')
        milestone['oracle_feedback'] = feedback
        
        verification['status'] = 'approved'
        verification['approved_at'] = data.get('verified_at')
        verification['oracle_address'] = oracle_address
        verification['feedback'] = feedback
        
        # Activate next milestone if exists
        next_milestone = next((m for m in milestones if m['id'] == milestone_id + 1), None)
        if next_milestone:
            next_milestone['status'] = 'active'
            next_milestone['started_at'] = data.get('verified_at')
        
        # Update project allocated funds
        project = next((p for p in MOCK_PROJECTS if p['id'] == project_id), None)
        if project:
            project['allocated_funds'] = project.get('allocated_funds', 0) + milestone['amount']
            project['allocatedFunds'] = project['allocated_funds']
        
        return jsonify({
            "message": "Milestone verified and payment released",
            "payment_amount": milestone['amount'],
            "milestone": milestone,
            "next_milestone_active": next_milestone is not None,
            "tx_hash": f"0xpayment{verification_id}{milestone_id}"
        })
    else:
        # REJECT: Send back for rework
        milestone['verification_status'] = 'rejected'
        milestone['work_submitted'] = False
        milestone['oracle_feedback'] = feedback
        milestone['submitted_at'] = None
        milestone['submission_files'] = []
        
        verification['status'] = 'rejected'
        verification['rejected_at'] = data.get('verified_at')
        verification['oracle_address'] = oracle_address
        verification['feedback'] = feedback
        
        return jsonify({
            "message": "Milestone rejected. Contractor must resubmit.",
            "feedback": feedback,
            "milestone": milestone
        })

@app.route('/api/projects/<int:project_id>/quality-report', methods=['POST'])
def submit_quality_report(project_id):
    """Contractor submits final quality report after milestone 5"""
    data = request.get_json()
    
    milestones = MOCK_MILESTONES.get(project_id, [])
    milestone_5 = next((m for m in milestones if m['id'] == 5), None)
    
    if not milestone_5 or milestone_5['status'] != 'completed':
        return jsonify({"error": "All 5 milestones must be completed first"}), 400
    
    quality_report = {
        "project_id": project_id,
        "contractor_address": data.get('contractor_address'),
        "report_files": data.get('report_files', []),
        "quality_metrics": data.get('quality_metrics', {}),
        "compliance_checklist": data.get('compliance_checklist', {}),
        "notes": data.get('notes', ''),
        "submitted_at": data.get('submitted_at'),
        "status": "submitted"
    }
    
    MOCK_QUALITY_REPORTS[project_id] = quality_report
    
    # Update project status
    project = next((p for p in MOCK_PROJECTS if p['id'] == project_id), None)
    if project:
        project['status'] = 'Completed'
        project['quality_report_submitted'] = True
    
    return jsonify({
        "message": "Quality report submitted successfully",
        "report": quality_report
    })

@app.route('/api/projects/<int:project_id>/quality-report', methods=['GET'])
def get_quality_report(project_id):
    """Get quality report for a project"""
    report = MOCK_QUALITY_REPORTS.get(project_id)
    if not report:
        return jsonify({"error": "Quality report not found"}), 404
    return jsonify(report)

@app.route('/api/contractor/<contractor_address>/can-tender', methods=['GET'])
def check_contractor_eligibility(contractor_address):
    """Check if contractor can submit new tenders (must have submitted quality reports for all completed projects)"""
    # Find all projects by this contractor
    contractor_projects = [p for p in MOCK_PROJECTS if p.get('contractor_address') == contractor_address]
    
    # Check if any completed project is missing quality report
    for project in contractor_projects:
        milestones = MOCK_MILESTONES.get(project['id'], [])
        milestone_5 = next((m for m in milestones if m['id'] == 5 and m['status'] == 'completed'), None)
        
        if milestone_5:  # Project completed (milestone 5 done)
            if project['id'] not in MOCK_QUALITY_REPORTS:
                return jsonify({
                    "can_tender": False,
                    "reason": f"Quality report pending for project '{project['name']}'",
                    "pending_project_id": project['id'],
                    "pending_project_name": project['name']
                })
    
    return jsonify({
        "can_tender": True,
        "message": "Contractor eligible for new tenders"
    })

# ============= END MILESTONE SYSTEM =============

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Municipal Fund Blockchain API Server - DEMO MODE")
    print("="*60)
    print("\n📝 Login Credentials:")
    print("  Admin:      admin / admin123")
    print("  Supervisor: supervisor / super123")
    print("  Citizen:    citizen / citizen123")
    print("\n⚠️  DEMO MODE: Using mock data (no blockchain)")
    print("   Deploy contract using Remix IDE to enable blockchain")
    print("\n🌐 API Endpoints:")
    print("  Frontend: http://localhost:3000")
    print("  Backend:  http://localhost:5000")
    print("  Status:   http://localhost:5000/api/blockchain/status")
    print("\n⚠️  SECURITY WARNING:")
    print("  Your MetaMask private key was shared publicly!")
    print("  Transfer all funds and create a NEW wallet immediately!")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
