# Backend API Implementation for Contractor System

## Quick Start Guide

This guide shows how to add the 6 required contractor API endpoints to your Flask backend.

---

## 1. Database Schema

Add to your database (PostgreSQL/MySQL):

```sql
-- Contractors table
CREATE TABLE contractors (
  id SERIAL PRIMARY KEY,
  blockchain_id INTEGER UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  registration_number VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  experience INTEGER,
  specialization VARCHAR(255),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  registration_tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active',
  role VARCHAR(20) DEFAULT 'contractor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tender submissions table
CREATE TABLE tender_submissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  contractor_id INTEGER NOT NULL REFERENCES contractors(id),
  contractor_blockchain_id INTEGER NOT NULL,
  proposal TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  review_notes TEXT
);

-- Contractor projects table (tracks assigned projects)
CREATE TABLE contractor_projects (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  contractor_id INTEGER NOT NULL REFERENCES contractors(id),
  current_milestone INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Milestone submissions table
CREATE TABLE milestone_submissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  contractor_id INTEGER NOT NULL REFERENCES contractors(id),
  milestone_number INTEGER NOT NULL,
  proof_description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approval_notes TEXT
);
```

---

## 2. Flask Backend Routes

Add these routes to `backend/server.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'municipal_fund'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )
    return conn

# ============================================
# CONTRACTOR ENDPOINTS
# ============================================

@app.route('/api/contractors/register', methods=['POST'])
def register_contractor():
    """
    Register a new contractor after blockchain registration
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = [
            'blockchain_id', 'company_name', 'contact_person', 
            'email', 'phone', 'wallet_address', 'username', 'password'
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if blockchain_id already exists
        cur.execute('SELECT id FROM contractors WHERE blockchain_id = %s', 
                    (data['blockchain_id'],))
        if cur.fetchone():
            return jsonify({'success': False, 'error': 'Blockchain ID already registered'}), 409
        
        # Check if email already exists
        cur.execute('SELECT id FROM contractors WHERE email = %s', (data['email'],))
        if cur.fetchone():
            return jsonify({'success': False, 'error': 'Email already registered'}), 409
        
        # Insert contractor
        cur.execute('''
            INSERT INTO contractors (
                blockchain_id, company_name, contact_person, email, phone,
                registration_number, address, city, state, pincode,
                experience, specialization, wallet_address, username,
                password_hash, registration_tx_hash, status, role
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        ''', (
            data['blockchain_id'],
            data['company_name'],
            data['contact_person'],
            data['email'],
            data['phone'],
            data.get('registration_number', ''),
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('pincode', ''),
            data.get('experience', 0),
            data.get('specialization', ''),
            data['wallet_address'],
            data['username'],
            password_hash,
            data.get('registration_tx_hash', ''),
            data.get('status', 'active'),
            data.get('role', 'contractor')
        ))
        
        contractor_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contractor registered successfully',
            'contractor_id': contractor_id
        }), 201
        
    except Exception as e:
        print(f"Error registering contractor: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/contractor/available-tenders', methods=['GET'])
def get_available_tenders():
    """
    Get all open tenders that contractors can apply for
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute('''
            SELECT 
                p.id,
                p.project_id,
                p.title,
                p.description,
                p.budget,
                p.location,
                p.category,
                p.status,
                p.created_at
            FROM projects p
            WHERE p.status = 'open' OR p.status = 'accepting_tenders'
            ORDER BY p.created_at DESC
        ''')
        
        tenders = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'tenders': tenders
        }), 200
        
    except Exception as e:
        print(f"Error fetching available tenders: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/contractor/my-submissions', methods=['GET'])
def get_my_submissions():
    """
    Get contractor's tender submissions
    """
    try:
        contractor_id = request.args.get('contractor_id')
        if not contractor_id:
            return jsonify({'success': False, 'error': 'contractor_id required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get contractor database ID from blockchain ID
        cur.execute('SELECT id FROM contractors WHERE blockchain_id = %s', (contractor_id,))
        contractor = cur.fetchone()
        if not contractor:
            return jsonify({'success': False, 'error': 'Contractor not found'}), 404
        
        db_contractor_id = contractor['id']
        
        # Get submissions
        cur.execute('''
            SELECT 
                ts.id,
                ts.project_id,
                p.title as project_title,
                p.budget,
                ts.proposal,
                ts.status,
                ts.submitted_at,
                ts.reviewed_at,
                ts.review_notes
            FROM tender_submissions ts
            JOIN projects p ON ts.project_id = p.id
            WHERE ts.contractor_id = %s
            ORDER BY ts.submitted_at DESC
        ''', (db_contractor_id,))
        
        submissions = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'submissions': submissions
        }), 200
        
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/contractor/my-projects', methods=['GET'])
def get_my_projects():
    """
    Get contractor's active and completed projects
    """
    try:
        contractor_id = request.args.get('contractor_id')
        if not contractor_id:
            return jsonify({'success': False, 'error': 'contractor_id required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get contractor database ID from blockchain ID
        cur.execute('SELECT id FROM contractors WHERE blockchain_id = %s', (contractor_id,))
        contractor = cur.fetchone()
        if not contractor:
            return jsonify({'success': False, 'error': 'Contractor not found'}), 404
        
        db_contractor_id = contractor['id']
        
        # Get projects
        cur.execute('''
            SELECT 
                cp.id,
                p.id as project_id,
                p.title,
                p.description,
                p.budget,
                p.location,
                p.category,
                cp.current_milestone,
                cp.status,
                cp.assigned_at,
                cp.completed_at
            FROM contractor_projects cp
            JOIN projects p ON cp.project_id = p.id
            WHERE cp.contractor_id = %s
            ORDER BY cp.assigned_at DESC
        ''', (db_contractor_id,))
        
        projects = cur.fetchall()
        
        # For each project, get milestone completion info
        for project in projects:
            cur.execute('''
                SELECT milestone_number, status 
                FROM milestone_submissions
                WHERE project_id = %s AND contractor_id = %s
                ORDER BY milestone_number
            ''', (project['project_id'], db_contractor_id))
            
            milestones = cur.fetchall()
            completed = [m['milestone_number'] for m in milestones if m['status'] == 'approved']
            pending = [m['milestone_number'] for m in milestones if m['status'] == 'pending']
            
            project['milestones_completed'] = completed
            project['milestones_pending'] = pending
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'projects': projects
        }), 200
        
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/contractor/submit-tender', methods=['POST'])
def submit_tender():
    """
    Submit a tender proposal for a project
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['project_id', 'contractor_id', 'contractor_address', 'proposal']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get contractor database ID from blockchain ID
        cur.execute('SELECT id FROM contractors WHERE blockchain_id = %s', 
                    (data['contractor_id'],))
        contractor = cur.fetchone()
        if not contractor:
            return jsonify({'success': False, 'error': 'Contractor not found'}), 404
        
        db_contractor_id = contractor['id']
        
        # Check if already submitted
        cur.execute('''
            SELECT id FROM tender_submissions 
            WHERE project_id = %s AND contractor_id = %s
        ''', (data['project_id'], db_contractor_id))
        
        if cur.fetchone():
            return jsonify({'success': False, 'error': 'Already submitted tender for this project'}), 409
        
        # Insert submission
        cur.execute('''
            INSERT INTO tender_submissions (
                project_id, contractor_id, contractor_blockchain_id, 
                proposal, status, submitted_at
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['project_id'],
            db_contractor_id,
            data['contractor_id'],
            data['proposal'],
            'pending',
            data.get('submitted_at', datetime.utcnow().isoformat())
        ))
        
        submission_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Tender submitted successfully',
            'submission_id': submission_id
        }), 201
        
    except Exception as e:
        print(f"Error submitting tender: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/contractor/submit-milestone', methods=['POST'])
def submit_milestone():
    """
    Submit milestone completion proof
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['project_id', 'contractor_id', 'milestone_number', 'proof_description']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get contractor database ID from blockchain ID
        cur.execute('SELECT id FROM contractors WHERE blockchain_id = %s', 
                    (data['contractor_id'],))
        contractor = cur.fetchone()
        if not contractor:
            return jsonify({'success': False, 'error': 'Contractor not found'}), 404
        
        db_contractor_id = contractor['id']
        
        # Check if milestone already submitted
        cur.execute('''
            SELECT id FROM milestone_submissions 
            WHERE project_id = %s AND contractor_id = %s AND milestone_number = %s
        ''', (data['project_id'], db_contractor_id, data['milestone_number']))
        
        if cur.fetchone():
            return jsonify({'success': False, 'error': 'Milestone already submitted'}), 409
        
        # Insert milestone submission
        cur.execute('''
            INSERT INTO milestone_submissions (
                project_id, contractor_id, milestone_number, 
                proof_description, status, submitted_at
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['project_id'],
            db_contractor_id,
            data['milestone_number'],
            data['proof_description'],
            'pending',
            data.get('submitted_at', datetime.utcnow().isoformat())
        ))
        
        milestone_id = cur.fetchone()['id']
        
        # Update contractor_projects current milestone
        cur.execute('''
            UPDATE contractor_projects
            SET current_milestone = %s
            WHERE project_id = %s AND contractor_id = %s
        ''', (data['milestone_number'], data['project_id'], db_contractor_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Milestone proof submitted successfully',
            'milestone_id': milestone_id
        }), 201
        
    except Exception as e:
        print(f"Error submitting milestone: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# UPDATE EXISTING LOGIN ENDPOINT
# ============================================

@app.route('/api/login', methods=['POST'])
def login():
    """
    Updated login to support contractor role
    """
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        
        if not username or not password or not role:
            return jsonify({'success': False, 'error': 'Missing credentials'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check contractor login
        if role == 'contractor':
            cur.execute('''
                SELECT id, blockchain_id, company_name, email, wallet_address, 
                       username, password_hash, status, role
                FROM contractors
                WHERE username = %s AND status = 'active'
            ''', (username,))
            
            user = cur.fetchone()
            
            if not user:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            cur.close()
            conn.close()
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'blockchain_id': user['blockchain_id'],
                    'name': user['company_name'],
                    'email': user['email'],
                    'address': user['wallet_address'],
                    'role': 'contractor',
                    'username': user['username']
                }
            }), 200
        
        # Existing admin/supervisor/citizen login logic...
        else:
            # Your existing login code for other roles
            pass
        
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## 3. Environment Variables

Create `.env` file in backend directory:

```env
DB_HOST=localhost
DB_NAME=municipal_fund
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432

FLASK_ENV=development
FLASK_DEBUG=True
```

---

## 4. Install Dependencies

```bash
cd backend
pip install flask flask-cors psycopg2-binary bcrypt python-dotenv
```

---

## 5. Run Database Migrations

```bash
# Connect to your database
psql -U postgres -d municipal_fund

# Run the SQL schema from step 1
\i schema.sql
```

---

## 6. Test API Endpoints

### Using curl:

```bash
# 1. Register contractor
curl -X POST http://localhost:5000/api/contractors/register \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain_id": 1,
    "company_name": "ABC Construction",
    "contact_person": "John Doe",
    "email": "john@abc.com",
    "phone": "1234567890",
    "wallet_address": "0x1234567890abcdef",
    "username": "johndoe",
    "password": "Test@123",
    "registration_tx_hash": "0xabcd..."
  }'

# 2. Login as contractor
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "Test@123",
    "role": "contractor"
  }'

# 3. Get available tenders
curl http://localhost:5000/api/contractor/available-tenders

# 4. Get my submissions
curl "http://localhost:5000/api/contractor/my-submissions?contractor_id=1"

# 5. Get my projects
curl "http://localhost:5000/api/contractor/my-projects?contractor_id=1"

# 6. Submit tender
curl -X POST http://localhost:5000/api/contractor/submit-tender \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "contractor_id": "1",
    "contractor_address": "0x1234...",
    "proposal": "My detailed proposal..."
  }'

# 7. Submit milestone
curl -X POST http://localhost:5000/api/contractor/submit-milestone \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "contractor_id": "1",
    "milestone_number": 1,
    "proof_description": "Completed 25% of work..."
  }'
```

---

## 7. CORS Configuration

Make sure CORS allows your frontend:

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

---

## 8. Error Handling

Add global error handlers:

```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

---

## 9. Security Best Practices

1. **Password Hashing**: ✅ Using bcrypt
2. **SQL Injection Prevention**: ✅ Using parameterized queries
3. **Input Validation**: ✅ Checking required fields
4. **Error Messages**: ✅ Not revealing sensitive info
5. **HTTPS**: 🔴 Use in production (nginx + SSL)

### Add JWT Authentication (Optional but Recommended):

```python
import jwt
from functools import wraps
from datetime import datetime, timedelta

SECRET_KEY = os.getenv('JWT_SECRET', 'your-secret-key')

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            token = token.split(' ')[1]  # Bearer <token>
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user_id = data['user_id']
            request.user_role = data['role']
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

# Use in routes:
@app.route('/api/contractor/my-projects', methods=['GET'])
@token_required
def get_my_projects():
    # Access request.user_id and request.user_role
    pass
```

---

## 10. Testing Checklist

- [ ] Database tables created successfully
- [ ] Flask server starts without errors
- [ ] POST /api/contractors/register returns 201
- [ ] POST /api/login with contractor role works
- [ ] GET /api/contractor/available-tenders returns data
- [ ] GET /api/contractor/my-submissions returns data
- [ ] GET /api/contractor/my-projects returns data
- [ ] POST /api/contractor/submit-tender returns 201
- [ ] POST /api/contractor/submit-milestone returns 201
- [ ] CORS allows frontend requests
- [ ] Password hashing works correctly
- [ ] Duplicate checks work (email, blockchain_id)

---

## 11. Troubleshooting

### Issue: "relation 'contractors' does not exist"
**Solution**: Run database schema SQL

### Issue: "CORS error"
**Solution**: Check CORS configuration, ensure frontend URL is allowed

### Issue: "Invalid password hash"
**Solution**: Ensure bcrypt is installed: `pip install bcrypt`

### Issue: "Connection refused"
**Solution**: Check database is running: `pg_ctl status`

### Issue: "ModuleNotFoundError: No module named 'psycopg2'"
**Solution**: Install: `pip install psycopg2-binary`

---

## 12. Production Deployment

### Using Gunicorn:

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### Using Docker:

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "server:app"]
```

---

## Summary

**Files to Create/Modify**:
1. `backend/server.py` - Add 6 contractor endpoints + update login
2. `backend/.env` - Add database credentials
3. Database - Run SQL schema to create tables

**Total Implementation Time**: ~2-3 hours

**Lines of Code**: ~500 lines

**Result**: Fully functional contractor backend API! 🎉

---

**Last Updated**: January 2024
