# 🏛️ Municipal Fund Blockchain Tracker
### Smart India Hackathon 2025 🏆

<div align="center">

![Blockchain](https://img.shields.io/badge/Blockchain-Polygon-8247E5?style=for-the-badge)
![Smart Contract](https://img.shields.io/badge/Smart_Contract-Solidity-363636?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A revolutionary blockchain-based municipal fund management system ensuring transparency, accountability, and automated payments through smart contracts.**

[🎥 Demo Video](#) | [🌐 Live Demo](#) | [📖 Documentation](./MILESTONE_SYSTEM_GUIDE.md) | [🐛 Report Bug](#)

</div>

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Smart Contract](#-smart-contract)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

The **Municipal Fund Blockchain Tracker** is a comprehensive solution for transparent government fund management. It eliminates corruption, ensures quality accountability, and automates payment processing through blockchain technology.

### 🎯 Problem Statement
- **Lack of transparency** in government fund allocation
- **Payment delays** and disputes in infrastructure projects
- **Corruption** in tender selection process
- **No accountability** for project quality
- **Manual verification** causing inefficiencies

### ✅ Our Solution
- **Blockchain-based** transparent fund tracking
- **Anonymous tender** evaluation system
- **5-milestone** automated payment system (20% each)
- **Oracle verification** for work completion
- **Mandatory quality reports** ensuring accountability
- **Smart contract** automation eliminating manual intervention

---

## 🚀 Key Features

### 1. 🎭 Anonymous Tender System
- Contractor name hidden during evaluation
- Fair and unbiased selection
- Document-based review only
- Prevents nepotism and favoritism

### 2. 📊 5-Milestone Payment System
- **Milestone 1 (20%):** Foundation & Site Preparation
- **Milestone 2 (20%):** Structural Framework
- **Milestone 3 (20%):** Utility Installation
- **Milestone 4 (20%):** Finishing & QA
- **Milestone 5 (20%):** Final Inspection & Handover

### 3. 🔍 Oracle Verification
- Independent supervisor reviews work
- Approve or reject with feedback
- Automatic payment release on approval
- Next milestone activates automatically

### 4. ✅ Quality Assurance
- Mandatory quality report after 100% completion
- 5 quality metrics tracking
- Compliance checklist
- Blocks new tenders until submitted

### 5. 👥 Role-Based Access Control
- **Admin:** Create projects, upload documents
- **Supervisor:** Verify tenders and milestones
- **Citizen:** View projects and transactions

### 6. 📁 IPFS Integration
- Decentralized file storage
- Tamper-proof document upload
- Permanent record keeping
- Geo-tagged photo support

### 7. 📈 Real-time Dashboard
- Live fund allocation tracking
- Project progress monitoring
- Budget utilization analytics
- Category-wise breakdowns

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  Dashboard | Projects | Milestones | Verifications | QA     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Flask API)                       │
│  Auth | Projects | Milestones | Oracle | Quality Reports   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Blockchain │  │     IPFS     │  │   Database   │
│   (Polygon)  │  │   Storage    │  │   (Mock)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow
1. **Admin** creates project with contractor details
2. **Supervisor** receives anonymous tender
3. **Supervisor** approves → 5 milestones created automatically
4. **Contractor** completes work → Submits proof
5. **Oracle** verifies → Payment released automatically
6. **Repeat** for all 5 milestones
7. **Contractor** submits quality report → Project complete

---

## 💻 Tech Stack

### Frontend
- **React 18.x** - UI framework
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Ethers.js** - Blockchain interaction
- **Axios** - API calls
- **React Router** - Navigation
- **Sonner** - Toast notifications

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin requests
- **Python 3.x** - Backend logic

### Blockchain
- **Solidity 0.8.20** - Smart contract
- **Polygon Mumbai** - Testnet
- **Hardhat** - Development environment
- **OpenZeppelin** - Contract standards

### Tools & Services
- **IPFS** - Decentralized storage
- **MetaMask** - Wallet integration
- **Git** - Version control
- **VS Code** - IDE

---

## 🛠️ Getting Started

### Prerequisites
```bash
# Node.js (v16+)
node --version

# Python (v3.8+)
python --version

# Git
git --version
```

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/darshan-stack/Municipal.git
cd Municipal
```

#### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server_demo.py
```
Backend runs on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

#### 4. Smart Contract Deployment (Optional)
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

### Environment Variables
Create `.env` files:

**Backend (.env):**
```env
FLASK_APP=server_demo.py
FLASK_ENV=development
PORT=5000
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_CHAIN_ID=80001
```

---

## 📖 Usage Guide

### 1. Login Credentials (Demo Mode)
```
Admin:      admin / admin123
Supervisor: supervisor / super123
Citizen:    citizen / citizen123
```

### 2. Create Project (Admin)
1. Login as admin
2. Click "Create New Project"
3. Fill project details
4. Upload files:
   - Tender documents (PDF/DOC)
   - Design files (PDF/DWG/Images)
   - Geo-tagged photos
   - Expected quality report template
5. Click "Send to Supervisor"

### 3. Approve Tender (Supervisor)
1. Login as supervisor
2. Go to "Tender Approvals"
3. Review documents (contractor name hidden)
4. Approve or reject
5. If approved: 5 milestones created automatically

### 4. Submit Milestone Work (Contractor)
1. Go to project details
2. Click "Milestones" tab
3. Active milestone shows "Submit Work" button
4. Upload proof of work
5. Add completion notes
6. Submit for verification

### 5. Verify Milestone (Supervisor/Oracle)
1. Go to "Milestone Verifications"
2. Review submitted work
3. Approve → Payment released, next milestone activates
4. Reject → Contractor resubmits with improvements

### 6. Submit Quality Report (Contractor)
1. After all 5 milestones completed
2. Go to "Quality Report" tab
3. Upload final reports
4. Fill quality metrics
5. Complete compliance checklist
6. Submit (required before applying for new tenders)

---

## 📜 Smart Contract

### FundTracker.sol Features
- Project creation and management
- Anonymous tender submission
- Milestone tracking
- Fund allocation and release
- Event emission for transparency

### Key Functions
```solidity
createProject()          // Create new project
evaluateTender()         // Anonymous tender evaluation  
submitMilestone()        // Contractor submits work
verifyMilestone()        // Oracle verifies completion
releaseFunds()           // Automatic payment release
submitQualityReport()    // Final quality submission
```

### Deployment
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Contract deployed on Polygon Mumbai Testnet.

---

## 🔌 API Documentation

### Authentication
```
POST /api/login
Body: { username, password }
Response: { success, user: { username, role, address } }
```

### Projects
```
GET  /api/projects              # Get all projects
GET  /api/projects/:id          # Get project details
POST /api/projects              # Create project
```

### Milestones
```
GET  /api/projects/:id/milestones                    # Get milestones
POST /api/projects/:id/milestones/initialize         # Initialize 5 milestones
POST /api/projects/:id/milestones/:mid/submit        # Submit work
```

### Oracle Verification
```
GET  /api/oracle/verifications  # Get pending verifications
POST /api/oracle/verify         # Approve/reject milestone
```

### Quality Reports
```
POST /api/projects/:id/quality-report  # Submit quality report
GET  /api/projects/:id/quality-report  # Get quality report
GET  /api/contractor/:addr/can-tender  # Check eligibility
```

### Supervisor
```
POST /api/supervisor/tenders         # Submit tender
GET  /api/supervisor/pending-tenders # Get pending tenders
POST /api/supervisor/approve-tender  # Approve tender
POST /api/supervisor/reject-tender   # Reject tender
GET  /api/admin/rejections           # Get rejection reasons
```

Full API documentation: [API_DOCS.md](./API_DOCS.md)

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Real-time fund tracking and project analytics*

### Anonymous Tender Review
![Tender Review](./screenshots/tender-review.png)
*Contractor identity hidden during evaluation*

### Milestone Tracker
![Milestones](./screenshots/milestones.png)
*5-milestone progress with payment status*

### Oracle Verification
![Verification](./screenshots/verification.png)
*Independent work verification interface*

### Quality Report
![Quality Report](./screenshots/quality-report.png)
*Comprehensive quality metrics and compliance*

---

## 📚 Documentation

- [📘 Citizen Guide](./CITIZEN_GUIDE.md) - How to use the system
- [📗 Milestone System Guide](./MILESTONE_SYSTEM_GUIDE.md) - Complete milestone workflow
- [📙 Upload & Approval Guide](./UPLOAD_AND_APPROVAL_GUIDE.md) - File upload process
- [📕 GitHub Push Guide](./GITHUB_PUSH_COMPLETE_GUIDE.md) - Version control
- [📔 RPC Configuration](./RPC_CONFIGURATION.md) - Blockchain setup
- [📓 Transaction Verification](./TRANSACTION_VERIFICATION_GUIDE.md) - Verify on blockchain

---

## 🎓 Smart India Hackathon 2025

### Problem Statement
**PS-XXXX:** Municipal Fund Management & Transparency

### Theme
Blockchain & Governance

### Objectives Met
✅ Transparent fund allocation  
✅ Automated payment processing  
✅ Corruption prevention  
✅ Quality accountability  
✅ Citizen engagement  
✅ Real-time monitoring  

### Innovation Points
1. **Anonymous tender evaluation** prevents bias
2. **Oracle-based verification** ensures quality
3. **Automatic milestone activation** reduces delays
4. **Mandatory quality reports** ensure accountability
5. **IPFS storage** provides permanent records

---

## 👥 Team

### Team Members
- **Sakshi Sanjay Chavan** - Full Stack Developer
- **Darshan** - Blockchain Developer
- **[Member 3]** - UI/UX Designer
- **[Member 4]** - Quality Assurance

### Mentors
- **[Mentor Name]** - Blockchain Expert
- **[Mentor Name]** - Government Domain Expert

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

---

## 🙏 Acknowledgments

- Smart India Hackathon 2025 organizers
- OpenZeppelin for secure contract standards
- Polygon for blockchain infrastructure
- IPFS for decentralized storage
- React and Flask communities

---

## 📞 Contact

**Project Repository:** https://github.com/darshan-stack/Municipal

**For queries:**
- Email: [your-email@example.com]
- LinkedIn: [Your LinkedIn]
- Twitter: [@YourHandle]

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=darshan-stack/Municipal&type=Date)](https://star-history.com/#darshan-stack/Municipal&Date)

---

<div align="center">

### Made with ❤️ for Smart India Hackathon 2025

**[⬆ Back to Top](#-municipal-fund-blockchain-tracker)**

</div>
