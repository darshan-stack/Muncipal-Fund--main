// Oracle Backend Service for Municipal Fund Blockchain System
// Node.js + Express + Web3 + PostgreSQL + IPFS

const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const axios = require('axios');
const { Pool } = require('pg');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ========== Configuration ==========

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Web3 Setup
const web3 = new Web3(process.env.RPC_URL || 'https://rpc-mumbai.maticvigil.com');
const contractAddress = process.env.CONTRACT_ADDRESS || '0x...';
const contractABI = require('./AnonymousTenderSystemABI.json');
const contract = new web3.eth.Contract(contractABI, contractAddress);

// PostgreSQL Database Setup
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'municipal_fund',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// IPFS Setup (Pinata)
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_BASE_URL = 'https://api.pinata.cloud';

// File upload setup
const upload = multer({ dest: 'uploads/' });

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5002';

// ========== Database Initialization ==========

async function initializeDatabase() {
    try {
        // Create tenders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tenders (
                id SERIAL PRIMARY KEY,
                blockchain_tender_id INTEGER UNIQUE NOT NULL,
                project_name VARCHAR(255) NOT NULL,
                commitment_hash VARCHAR(66) NOT NULL,
                contractor_address VARCHAR(42),
                budget_amount DECIMAL(20, 2) NOT NULL,
                released_amount DECIMAL(20, 2) DEFAULT 0,
                status VARCHAR(50) NOT NULL,
                submission_time TIMESTAMP NOT NULL,
                approval_time TIMESTAMP,
                ipfs_doc_hash VARCHAR(100),
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create milestones table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS milestones (
                id SERIAL PRIMARY KEY,
                blockchain_milestone_id INTEGER UNIQUE NOT NULL,
                tender_id INTEGER REFERENCES tenders(blockchain_tender_id),
                description TEXT NOT NULL,
                fund_amount DECIMAL(20, 2) NOT NULL,
                status VARCHAR(50) NOT NULL,
                submission_time TIMESTAMP NOT NULL,
                verification_time TIMESTAMP,
                proof_ipfs_hash VARCHAR(100),
                gps_coordinates VARCHAR(100),
                quality_score INTEGER,
                verified_by VARCHAR(42),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create verifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS verifications (
                id SERIAL PRIMARY KEY,
                milestone_id INTEGER REFERENCES milestones(blockchain_milestone_id),
                gps_verified BOOLEAN DEFAULT FALSE,
                timestamp_verified BOOLEAN DEFAULT FALSE,
                ipfs_verified BOOLEAN DEFAULT FALSE,
                duplicate_check_passed BOOLEAN DEFAULT FALSE,
                ai_quality_score INTEGER,
                ai_analysis JSONB,
                verification_status VARCHAR(50),
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            );
        `);

        // Create contractors table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contractors (
                id SERIAL PRIMARY KEY,
                address VARCHAR(42) UNIQUE NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                registration_number VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

// ========== IPFS Functions ==========

async function uploadToIPFS(filePath, fileName) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), fileName);

        const metadata = JSON.stringify({
            name: fileName,
            keyvalues: {
                uploadedBy: 'municipal-fund-system',
                timestamp: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(
            `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
            formData,
            {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );

        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw new Error('Failed to upload to IPFS');
    }
}

async function getFromIPFS(ipfsHash) {
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        return response.data;
    } catch (error) {
        console.error('IPFS retrieval error:', error);
        throw new Error('Failed to retrieve from IPFS');
    }
}

// ========== Verification Functions ==========

async function verifyGPSCoordinates(gpsCoords, projectLocation) {
    // Parse GPS coordinates
    const coords = gpsCoords.split(',').map(c => parseFloat(c.trim()));
    const projectCoords = projectLocation.split(',').map(c => parseFloat(c.trim()));
    
    if (coords.length !== 2 || projectCoords.length !== 2) {
        return { verified: false, reason: 'Invalid GPS format' };
    }
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (projectCoords[0] - coords[0]) * Math.PI / 180;
    const dLon = (projectCoords[1] - coords[1]) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords[0] * Math.PI / 180) * Math.cos(projectCoords[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Allow 5km radius
    const verified = distance <= 5;
    
    return {
        verified,
        distance: distance.toFixed(2),
        reason: verified ? 'Within project area' : 'Outside project area'
    };
}

async function verifyTimestamp(submissionTime, blockchainTime) {
    const timeDiff = Math.abs(submissionTime - blockchainTime);
    const verified = timeDiff <= 300; // 5 minutes tolerance
    
    return {
        verified,
        timeDiff,
        reason: verified ? 'Timestamp valid' : 'Timestamp mismatch'
    };
}

async function checkDuplicateSubmission(ipfsHash) {
    const result = await pool.query(
        'SELECT COUNT(*) as count FROM milestones WHERE proof_ipfs_hash = $1',
        [ipfsHash]
    );
    
    const isDuplicate = parseInt(result.rows[0].count) > 1;
    
    return {
        verified: !isDuplicate,
        reason: isDuplicate ? 'Duplicate submission detected' : 'No duplicates found'
    };
}

async function getAIQualityScore(ipfsHash) {
    try {
        // Call Python AI service
        const response = await axios.post(`${AI_SERVICE_URL}/verify-quality`, {
            ipfs_hash: ipfsHash
        }, {
            timeout: 30000 // 30 second timeout
        });
        
        return {
            score: response.data.quality_score,
            analysis: response.data.analysis,
            verified: response.data.quality_score >= 60
        };
    } catch (error) {
        console.error('AI verification error:', error);
        return {
            score: 0,
            analysis: { error: 'AI service unavailable' },
            verified: false
        };
    }
}

// ========== API Endpoints ==========

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Municipal Fund Oracle', timestamp: new Date().toISOString() });
});

// Upload document to IPFS
app.post('/api/upload-document', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const ipfsHash = await uploadToIPFS(req.file.path, req.file.originalname);
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        
        res.json({
            success: true,
            ipfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Get tender from blockchain
app.get('/api/tender/:tenderId', async (req, res) => {
    try {
        const tenderId = req.params.tenderId;
        const tender = await contract.methods.getTender(tenderId).call();
        
        // Store in database if not exists
        await pool.query(`
            INSERT INTO tenders (
                blockchain_tender_id, project_name, commitment_hash,
                contractor_address, budget_amount, released_amount,
                status, submission_time, approval_time, ipfs_doc_hash, is_anonymous
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), to_timestamp($9), $10, $11)
            ON CONFLICT (blockchain_tender_id) DO UPDATE SET
                contractor_address = EXCLUDED.contractor_address,
                status = EXCLUDED.status,
                approval_time = EXCLUDED.approval_time,
                is_anonymous = EXCLUDED.is_anonymous
        `, [
            tender.id,
            tender.projectName,
            tender.commitmentHash,
            tender.contractorAddress,
            web3.utils.fromWei(tender.budgetAmount, 'ether'),
            web3.utils.fromWei(tender.releasedAmount, 'ether'),
            Object.keys(tender.status)[0],
            tender.submissionTime,
            tender.approvalTime || null,
            tender.ipfsDocHash,
            tender.isAnonymous
        ]);
        
        res.json({ success: true, tender });
    } catch (error) {
        console.error('Get tender error:', error);
        res.status(500).json({ error: 'Failed to fetch tender' });
    }
});

// Submit milestone for verification
app.post('/api/milestone/verify/:milestoneId', async (req, res) => {
    try {
        const milestoneId = req.params.milestoneId;
        const { projectLocation } = req.body;
        
        // Get milestone from blockchain
        const milestone = await contract.methods.getMilestone(milestoneId).call();
        const tender = await contract.methods.getTender(milestone.tenderId).call();
        
        // Step 1: GPS Verification
        const gpsCheck = await verifyGPSCoordinates(
            milestone.gpsCoordinates,
            projectLocation
        );
        
        // Step 2: Timestamp Verification
        const timestampCheck = await verifyTimestamp(
            Date.now() / 1000,
            milestone.submissionTime
        );
        
        // Step 3: IPFS Verification
        const ipfsCheck = {
            verified: milestone.proofIpfsHash && milestone.proofIpfsHash.length > 0,
            reason: 'IPFS hash present'
        };
        
        // Step 4: Duplicate Check
        const duplicateCheck = await checkDuplicateSubmission(milestone.proofIpfsHash);
        
        // Step 5: AI Quality Verification
        const aiCheck = await getAIQualityScore(milestone.proofIpfsHash);
        
        // Calculate overall verification status
        const allChecks = [
            gpsCheck.verified,
            timestampCheck.verified,
            ipfsCheck.verified,
            duplicateCheck.verified,
            aiCheck.verified
        ];
        const verificationPassed = allChecks.every(check => check === true);
        const qualityScore = aiCheck.score;
        
        // Store verification in database
        await pool.query(`
            INSERT INTO verifications (
                milestone_id, gps_verified, timestamp_verified, ipfs_verified,
                duplicate_check_passed, ai_quality_score, ai_analysis,
                verification_status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            milestoneId,
            gpsCheck.verified,
            timestampCheck.verified,
            ipfsCheck.verified,
            duplicateCheck.verified,
            qualityScore,
            JSON.stringify(aiCheck.analysis),
            verificationPassed ? 'APPROVED' : 'REJECTED',
            JSON.stringify({ gpsCheck, timestampCheck, ipfsCheck, duplicateCheck })
        ]);
        
        // If all checks pass, verify on blockchain
        if (verificationPassed) {
            const accounts = await web3.eth.getAccounts();
            const oracleAccount = accounts[0]; // Oracle account
            
            await contract.methods.verifyMilestone(milestoneId, qualityScore)
                .send({ from: oracleAccount, gas: 300000 });
            
            res.json({
                success: true,
                verified: true,
                qualityScore,
                message: 'Milestone verified successfully',
                checks: {
                    gps: gpsCheck,
                    timestamp: timestampCheck,
                    ipfs: ipfsCheck,
                    duplicate: duplicateCheck,
                    ai: aiCheck
                }
            });
        } else {
            // Reject on blockchain
            const accounts = await web3.eth.getAccounts();
            const oracleAccount = accounts[0];
            
            const failedChecks = [];
            if (!gpsCheck.verified) failedChecks.push('GPS');
            if (!timestampCheck.verified) failedChecks.push('Timestamp');
            if (!ipfsCheck.verified) failedChecks.push('IPFS');
            if (!duplicateCheck.verified) failedChecks.push('Duplicate');
            if (!aiCheck.verified) failedChecks.push('AI Quality');
            
            await contract.methods.rejectMilestone(
                milestoneId,
                `Failed checks: ${failedChecks.join(', ')}`
            ).send({ from: oracleAccount, gas: 300000 });
            
            res.json({
                success: true,
                verified: false,
                message: 'Milestone verification failed',
                failedChecks,
                checks: {
                    gps: gpsCheck,
                    timestamp: timestampCheck,
                    ipfs: ipfsCheck,
                    duplicate: duplicateCheck,
                    ai: aiCheck
                }
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify milestone' });
    }
});

// Get all pending verifications
app.get('/api/verifications/pending', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, t.project_name, t.contractor_address
            FROM milestones m
            JOIN tenders t ON m.tender_id = t.blockchain_tender_id
            WHERE m.status IN ('Submitted', 'UnderVerification')
            ORDER BY m.submission_time DESC
        `);
        
        res.json({ success: true, verifications: result.rows });
    } catch (error) {
        console.error('Get verifications error:', error);
        res.status(500).json({ error: 'Failed to fetch verifications' });
    }
});

// Get verification history
app.get('/api/verifications/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, m.description as milestone_description, t.project_name
            FROM verifications v
            JOIN milestones m ON v.milestone_id = m.blockchain_milestone_id
            JOIN tenders t ON m.tender_id = t.blockchain_tender_id
            ORDER BY v.verified_at DESC
            LIMIT 100
        `);
        
        res.json({ success: true, history: result.rows });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Get contractor statistics
app.get('/api/contractor/:address/stats', async (req, res) => {
    try {
        const address = req.params.address;
        
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tenders,
                COUNT(DISTINCT m.id) as total_milestones,
                SUM(CASE WHEN m.status = 'FundsReleased' THEN m.fund_amount ELSE 0 END) as funds_received,
                AVG(CASE WHEN v.ai_quality_score IS NOT NULL THEN v.ai_quality_score ELSE NULL END) as avg_quality_score
            FROM tenders t
            LEFT JOIN milestones m ON t.blockchain_tender_id = m.tender_id
            LEFT JOIN verifications v ON m.blockchain_milestone_id = v.milestone_id
            WHERE t.contractor_address = $1
        `, [address]);
        
        res.json({ success: true, stats: result.rows[0] });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ========== Start Server ==========

app.listen(PORT, async () => {
    console.log(`🚀 Oracle Backend Service running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'municipal_fund'}`);
    console.log(`🔗 Blockchain: ${process.env.RPC_URL || 'Mumbai Testnet'}`);
    console.log(`🤖 AI Service: ${AI_SERVICE_URL}`);
    
    // Initialize database
    await initializeDatabase();
    
    console.log('✅ Oracle service ready to accept verifications');
});
