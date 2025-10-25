-- Municipal Fund Tracker Database Schema
-- PostgreSQL Database

-- Create database
CREATE DATABASE municipal_fund_tracker;

\c municipal_fund_tracker;

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==================== PROJECTS TABLE ====================
CREATE TABLE projects (
    project_id INTEGER PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    budget NUMERIC(30, 0) NOT NULL,
    status INTEGER NOT NULL,
    location VARCHAR(255),
    pincode VARCHAR(6),
    geom GEOMETRY(Point, 4326),  -- GPS coordinates for spatial queries
    admin_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_pincode ON projects(pincode);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_geom ON projects USING GIST(geom);

-- ==================== MILESTONES TABLE ====================
CREATE TABLE milestones (
    milestone_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    tender_id INTEGER,
    percentage_complete INTEGER CHECK (percentage_complete IN (20, 40, 60, 80, 100)),
    proof_images_ipfs TEXT,
    gps_coordinates VARCHAR(50),
    architecture_docs_ipfs TEXT,
    quality_hash VARCHAR(64),
    status VARCHAR(20),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT
);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);

-- ==================== CITIZEN OPINIONS TABLE ====================
CREATE TABLE citizen_opinions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    opinion_text TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    ip_address VARCHAR(45),  -- For preventing spam
    user_agent TEXT
);

CREATE INDEX idx_opinions_project ON citizen_opinions(project_id);
CREATE INDEX idx_opinions_submitted ON citizen_opinions(submitted_at DESC);

-- ==================== PINCODES TABLE (for geospatial queries) ====================
CREATE TABLE pincodes (
    pincode VARCHAR(6) PRIMARY KEY,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    geom GEOMETRY(Point, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

CREATE INDEX idx_pincodes_geom ON pincodes USING GIST(geom);

-- ==================== TENDERS TABLE ====================
CREATE TABLE tenders (
    tender_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    contractor_commitment VARCHAR(66),  -- Hash commitment
    encrypted_contractor_data_ipfs TEXT,
    tender_document_ipfs TEXT,
    quality_report_ipfs TEXT,
    status VARCHAR(20),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

CREATE INDEX idx_tenders_project ON tenders(project_id);
CREATE INDEX idx_tenders_status ON tenders(status);

-- ==================== BLOCKCHAIN TRANSACTIONS TABLE ====================
CREATE TABLE blockchain_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    event_type VARCHAR(50),
    project_id INTEGER,
    milestone_id INTEGER,
    tender_id INTEGER,
    amount NUMERIC(30, 0),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_txns_hash ON blockchain_transactions(tx_hash);
CREATE INDEX idx_txns_project ON blockchain_transactions(project_id);
CREATE INDEX idx_txns_event ON blockchain_transactions(event_type);

-- ==================== SAMPLE DATA ====================

-- Insert sample pincodes (Delhi area)
INSERT INTO pincodes (pincode, city, district, state, latitude, longitude, geom) VALUES
('110001', 'New Delhi', 'Central Delhi', 'Delhi', 28.6139, 77.2090, ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)),
('110002', 'Delhi', 'Central Delhi', 'Delhi', 28.6600, 77.2300, ST_SetSRID(ST_MakePoint(77.2300, 28.6600), 4326)),
('110003', 'Delhi', 'North Delhi', 'Delhi', 28.6700, 77.2250, ST_SetSRID(ST_MakePoint(77.2250, 28.6700), 4326)),
('400001', 'Mumbai', 'Mumbai City', 'Maharashtra', 18.9388, 72.8354, ST_SetSRID(ST_MakePoint(72.8354, 18.9388), 4326)),
('560001', 'Bangalore', 'Bangalore Urban', 'Karnataka', 12.9716, 77.5946, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326));

-- Insert sample project (for demo)
INSERT INTO projects (project_id, project_name, budget, status, location, pincode, geom, admin_address) VALUES
(1, 'Road Widening - Connaught Place', 15000000000000000000, 2, 'Connaught Place, Delhi', '110001', 
 ST_SetSRID(ST_MakePoint(77.2167, 28.6328), 4326), '0x0000000000000000000000000000000000000000');

-- Insert sample milestones
INSERT INTO milestones (project_id, tender_id, percentage_complete, proof_images_ipfs, gps_coordinates, status, submitted_at, approved_at) VALUES
(1, 1, 20, 'QmSampleHash1', '28.6328,77.2167', 'Approved', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
(1, 1, 40, 'QmSampleHash2', '28.6328,77.2167', 'Approved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days'),
(1, 1, 60, 'QmSampleHash3', '28.6328,77.2167', 'Submitted', NOW() - INTERVAL '1 day', NULL);

-- Insert sample opinions
INSERT INTO citizen_opinions (project_id, opinion_text, rating, submitted_at) VALUES
(1, 'Great progress! Quality of work is visible and roads are improving.', 5, NOW() - INTERVAL '5 days'),
(1, 'Work is progressing slowly but quality seems good.', 3, NOW() - INTERVAL '3 days'),
(1, 'Excellent transparency in fund usage. Very happy with this project!', 5, NOW() - INTERVAL '1 day');

-- ==================== VIEWS FOR ANALYTICS ====================

-- Project summary view
CREATE VIEW project_summary AS
SELECT 
    p.project_id,
    p.project_name,
    p.budget,
    p.status,
    p.location,
    COUNT(DISTINCT m.milestone_id) as total_milestones,
    COUNT(DISTINCT CASE WHEN m.status = 'Approved' THEN m.milestone_id END) as approved_milestones,
    COUNT(DISTINCT t.tender_id) as total_tenders,
    COALESCE(AVG(co.rating), 0) as avg_rating,
    COUNT(co.id) as total_opinions
FROM projects p
LEFT JOIN milestones m ON p.project_id = m.project_id
LEFT JOIN tenders t ON p.project_id = t.project_id
LEFT JOIN citizen_opinions co ON p.project_id = co.project_id
GROUP BY p.project_id, p.project_name, p.budget, p.status, p.location;

-- Milestone progress view
CREATE VIEW milestone_progress AS
SELECT 
    p.project_id,
    p.project_name,
    m.milestone_id,
    m.percentage_complete,
    m.status,
    m.submitted_at,
    m.approved_at,
    EXTRACT(EPOCH FROM (m.approved_at - m.submitted_at)) / 3600 as approval_time_hours
FROM projects p
JOIN milestones m ON p.project_id = m.project_id
ORDER BY p.project_id, m.percentage_complete;

-- ==================== FUNCTIONS ====================

-- Function to get projects near a location
CREATE OR REPLACE FUNCTION get_nearby_projects(
    input_pincode VARCHAR(6),
    radius_meters INTEGER DEFAULT 20000
)
RETURNS TABLE (
    project_id INTEGER,
    project_name VARCHAR(255),
    budget NUMERIC,
    status INTEGER,
    location VARCHAR(255),
    distance_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.project_id,
        p.project_name,
        p.budget,
        p.status,
        p.location,
        ST_Distance(
            p.geom::geography,
            (SELECT geom::geography FROM pincodes WHERE pincode = input_pincode)
        ) as distance_meters
    FROM projects p
    WHERE ST_DWithin(
        p.geom::geography,
        (SELECT geom::geography FROM pincodes WHERE pincode = input_pincode),
        radius_meters
    )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate project completion percentage
CREATE OR REPLACE FUNCTION get_project_completion(input_project_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    max_milestone INTEGER;
BEGIN
    SELECT COALESCE(MAX(percentage_complete), 0)
    INTO max_milestone
    FROM milestones
    WHERE project_id = input_project_id
    AND status = 'Approved';
    
    RETURN max_milestone;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Update timestamp on project update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==================== GRANTS ====================

-- Grant permissions (adjust as needed for production)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- ==================== NOTES ====================

-- To use this schema:
-- 1. Install PostgreSQL and PostGIS
-- 2. Run: psql -U postgres -f database_schema.sql
-- 3. Update .env file with database credentials
-- 4. Run backend server: node backend/opinionAPI.js

-- For production:
-- - Add proper user authentication
-- - Implement rate limiting on opinions
-- - Add data encryption for sensitive information
-- - Set up regular backups
-- - Configure replication for high availability
