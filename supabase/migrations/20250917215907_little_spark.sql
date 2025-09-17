-- Pi Shield Database Schema
-- This extends your existing Supabase schema for the backend services

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_created_at ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_analysis_id ON analysis_reports(analysis_id);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add password_hash column to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
    
    -- Add role column to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    -- Add finished_at column to analyses table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'analyses' AND column_name = 'finished_at') THEN
        ALTER TABLE analyses ADD COLUMN finished_at TIMESTAMP;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default admin user (for development only)
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@pishield.dev',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- password: admin123
    'Admin User',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create materialized view for analytics (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS analysis_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    input_type,
    status,
    COUNT(*) as count,
    AVG(CASE WHEN ar.credibility_score IS NOT NULL THEN ar.credibility_score END) as avg_credibility_score
FROM analyses a
LEFT JOIN analysis_reports ar ON a.id = ar.analysis_id
GROUP BY DATE_TRUNC('day', created_at), input_type, status;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_stats_unique 
ON analysis_stats(date, input_type, status);

-- Function to refresh stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_analysis_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analysis_stats;
END;
$$ LANGUAGE plpgsql;