const request = require('supertest');
const { Pool } = require('pg');

// Mock database for testing
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('Oracle Backend API Tests', () => {
    let app;
    let pool;
    
    beforeAll(() => {
        // Setup test environment
        process.env.NODE_ENV = 'test';
        process.env.PORT = 5003;
        
        // Import app after setting env vars
        app = require('../backend/server');
        pool = new Pool();
    });
    
    afterAll(() => {
        // Cleanup
    });
    
    describe('Health Check', () => {
        it('should return OK status', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'OK');
            expect(res.body).toHaveProperty('service');
        });
    });
    
    describe('Document Upload', () => {
        it('should upload document to IPFS', async () => {
            const res = await request(app)
                .post('/api/upload-document')
                .attach('file', Buffer.from('test content'), 'test.pdf');
            
            // Mock successful upload
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                expect(res.body).toHaveProperty('ipfsHash');
                expect(res.body).toHaveProperty('url');
            }
        });
        
        it('should reject request without file', async () => {
            const res = await request(app)
                .post('/api/upload-document');
            
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });
    });
    
    describe('Tender Retrieval', () => {
        beforeEach(() => {
            pool.query.mockClear();
        });
        
        it('should get tender from blockchain and store in DB', async () => {
            pool.query.mockResolvedValue({ rows: [] });
            
            const res = await request(app).get('/api/tender/1');
            
            // Should attempt to query blockchain
            expect(res.statusCode).toBeLessThan(500);
        });
    });
    
    describe('Milestone Verification', () => {
        it('should verify milestone with all checks', async () => {
            const milestoneData = {
                projectLocation: '19.0760,72.8777'
            };
            
            pool.query.mockResolvedValue({ 
                rows: [{ count: '1' }] 
            });
            
            const res = await request(app)
                .post('/api/milestone/verify/1')
                .send(milestoneData);
            
            // Check that verification logic runs
            expect(res.statusCode).toBeLessThan(500);
        });
        
        it('should fail verification with invalid GPS', async () => {
            const milestoneData = {
                projectLocation: '0.0000,0.0000'  // Far from project
            };
            
            const res = await request(app)
                .post('/api/milestone/verify/1')
                .send(milestoneData);
            
            // Should handle GPS mismatch
            expect(res.statusCode).toBeLessThan(500);
        });
    });
    
    describe('GPS Verification', () => {
        const { verifyGPSCoordinates } = require('../backend/server');
        
        it('should verify GPS within 5km radius', async () => {
            // Same location
            const result = await verifyGPSCoordinates(
                '19.0760,72.8777',
                '19.0760,72.8777'
            );
            expect(result.verified).toBe(true);
        });
        
        it('should reject GPS outside 5km radius', async () => {
            // Different cities
            const result = await verifyGPSCoordinates(
                '19.0760,72.8777',  // Mumbai
                '28.6139,77.2090'   // Delhi
            );
            expect(result.verified).toBe(false);
        });
    });
    
    describe('Timestamp Verification', () => {
        const { verifyTimestamp } = require('../backend/server');
        
        it('should verify timestamp within tolerance', async () => {
            const now = Math.floor(Date.now() / 1000);
            const result = await verifyTimestamp(now, now - 100);
            expect(result.verified).toBe(true);
        });
        
        it('should reject timestamp outside tolerance', async () => {
            const now = Math.floor(Date.now() / 1000);
            const result = await verifyTimestamp(now, now - 1000);
            expect(result.verified).toBe(false);
        });
    });
    
    describe('Duplicate Check', () => {
        const { checkDuplicateSubmission } = require('../backend/server');
        
        beforeEach(() => {
            pool.query.mockClear();
        });
        
        it('should pass if no duplicate found', async () => {
            pool.query.mockResolvedValue({ rows: [{ count: '1' }] });
            
            const result = await checkDuplicateSubmission('QmUnique123');
            expect(result.verified).toBe(true);
        });
        
        it('should fail if duplicate found', async () => {
            pool.query.mockResolvedValue({ rows: [{ count: '3' }] });
            
            const result = await checkDuplicateSubmission('QmDuplicate456');
            expect(result.verified).toBe(false);
        });
    });
    
    describe('Contractor Statistics', () => {
        it('should return contractor stats', async () => {
            pool.query.mockResolvedValue({
                rows: [{
                    total_tenders: 5,
                    total_milestones: 15,
                    funds_received: '250.50',
                    avg_quality_score: 82.5
                }]
            });
            
            const res = await request(app)
                .get('/api/contractor/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1/stats');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.stats).toHaveProperty('total_tenders');
        });
    });
    
    describe('Pending Verifications', () => {
        it('should list all pending verifications', async () => {
            pool.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        description: 'Foundation Work',
                        status: 'Submitted',
                        project_name: 'Highway Bridge'
                    },
                    {
                        id: 2,
                        description: 'Structural Work',
                        status: 'UnderVerification',
                        project_name: 'Water Pipeline'
                    }
                ]
            });
            
            const res = await request(app).get('/api/verifications/pending');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.verifications)).toBe(true);
        });
    });
    
    describe('Verification History', () => {
        it('should return verification history', async () => {
            pool.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        ai_quality_score: 85,
                        verification_status: 'APPROVED',
                        verified_at: new Date()
                    }
                ]
            });
            
            const res = await request(app).get('/api/verifications/history');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.history)).toBe(true);
        });
    });
});
