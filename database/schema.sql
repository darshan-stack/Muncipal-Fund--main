-- Municipal Fund Database Schema
-- PostgreSQL 12+

-- Drop existing tables if they exist
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Contractors table
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    registration_number VARCHAR(100),
    pan_number VARCHAR(20),
    gst_number VARCHAR(20),
    bank_account VARCHAR(50),
    bank_ifsc VARCHAR(20),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin', 'supervisor', 'oracle'
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenders table
CREATE TABLE tenders (
    id SERIAL PRIMARY KEY,
    blockchain_tender_id INTEGER UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    project_location VARCHAR(255),
    gps_coordinates VARCHAR(100),
    commitment_hash VARCHAR(66) NOT NULL,
    contractor_address VARCHAR(42),
    contractor_id INTEGER REFERENCES contractors(id),
    budget_amount DECIMAL(20, 2) NOT NULL,
    released_amount DECIMAL(20, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL, -- 'Pending', 'Approved', 'Rejected', 'InProgress', 'Completed'
    submission_time TIMESTAMP NOT NULL,
    approval_time TIMESTAMP,
    completion_time TIMESTAMP,
    ipfs_doc_hash VARCHAR(100),
    is_anonymous BOOLEAN DEFAULT TRUE,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestones table
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    blockchain_milestone_id INTEGER UNIQUE NOT NULL,
    tender_id INTEGER REFERENCES tenders(blockchain_tender_id),
    milestone_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    fund_amount DECIMAL(20, 2) NOT NULL,
    percentage_complete INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'NotStarted', 'Submitted', 'UnderVerification', 'Verified', 'Rejected', 'FundsReleased'
    submission_time TIMESTAMP NOT NULL,
    verification_time TIMESTAMP,
    fund_release_time TIMESTAMP,
    proof_ipfs_hash VARCHAR(100),
    gps_coordinates VARCHAR(100),
    quality_score INTEGER,
    verified_by VARCHAR(42),
    rejection_reason TEXT,
    contractor_notes TEXT,
    oracle_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifications table
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER REFERENCES milestones(blockchain_milestone_id),
    tender_id INTEGER REFERENCES tenders(blockchain_tender_id),
    
    -- GPS Verification
    gps_verified BOOLEAN DEFAULT FALSE,
    gps_submitted VARCHAR(100),
    gps_expected VARCHAR(100),
    gps_distance_km DECIMAL(10, 2),
    
    -- Timestamp Verification
    timestamp_verified BOOLEAN DEFAULT FALSE,
    submission_timestamp BIGINT,
    blockchain_timestamp BIGINT,
    time_diff_seconds INTEGER,
    
    -- IPFS Verification
    ipfs_verified BOOLEAN DEFAULT FALSE,
    ipfs_hash VARCHAR(100),
    ipfs_accessible BOOLEAN DEFAULT FALSE,
    
    -- Duplicate Check
    duplicate_check_passed BOOLEAN DEFAULT FALSE,
    duplicate_count INTEGER DEFAULT 0,
    
    -- AI Quality Verification
    ai_quality_score INTEGER,
    ai_analysis JSONB,
    ai_sharpness_score DECIMAL(5, 2),
    ai_brightness_score DECIMAL(5, 2),
    ai_contrast_score DECIMAL(5, 2),
    ai_construction_detected BOOLEAN DEFAULT FALSE,
    ai_edge_density DECIMAL(5, 2),
    
    -- Overall Status
    verification_status VARCHAR(50), -- 'PENDING', 'APPROVED', 'REJECTED'
    overall_score INTEGER,
    passed_checks INTEGER DEFAULT 0,
    total_checks INTEGER DEFAULT 6,
    
    -- Metadata
    verified_by VARCHAR(42),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    rejection_reason TEXT
);

-- Transaction logs table (for audit trail)
CREATE TABLE transaction_logs (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    contract_address VARCHAR(42),
    method_name VARCHAR(100),
    event_name VARCHAR(100),
    event_data JSONB,
    gas_used BIGINT,
    gas_price DECIMAL(30, 0),
    status VARCHAR(20),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity feed table
CREATE TABLE activity_feed (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL, -- 'tender_submitted', 'tender_approved', 'milestone_verified', 'funds_released'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    related_tender_id INTEGER,
    related_milestone_id INTEGER,
    related_contractor VARCHAR(42),
    icon VARCHAR(10),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_tenders_contractor ON tenders(contractor_address);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_blockchain_id ON tenders(blockchain_tender_id);

CREATE INDEX idx_milestones_tender ON milestones(tender_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_blockchain_id ON milestones(blockchain_milestone_id);

CREATE INDEX idx_verifications_milestone ON verifications(milestone_id);
CREATE INDEX idx_verifications_status ON verifications(verification_status);
CREATE INDEX idx_verifications_date ON verifications(verified_at);

CREATE INDEX idx_contractors_address ON contractors(address);
CREATE INDEX idx_contractors_active ON contractors(is_active);

CREATE INDEX idx_activity_feed_timestamp ON activity_feed(timestamp DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin/oracle accounts
INSERT INTO admins (address, name, role, email, department) VALUES
('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 'Admin User', 'admin', 'admin@municipal.gov', 'Administration'),
('0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb2', 'Oracle Service', 'oracle', 'oracle@municipal.gov', 'Verification'),
('0x456d35Cc6634C0532925a3b844Bc9e7595f0bEb3', 'Supervisor User', 'supervisor', 'supervisor@municipal.gov', 'Supervision');

-- Insert sample contractor
INSERT INTO contractors (address, name, email, phone, registration_number, rating) VALUES
('0x789d35Cc6634C0532925a3b844Bc9e7595f0bEb4', 'ABC Construction Ltd', 'contact@abcconstruction.com', '+91-9876543210', 'REG-2024-001', 4.5);

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Success message
SELECT 'Database schema created successfully!' AS status;
