-- ============================================
-- MergeFi Transactions Table - Quick Setup
-- ============================================
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Create the transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_chain_id ON transactions(chain_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Stores transaction hashes from MergeFi platform. Full transaction details are fetched from Blockscout API.';
COMMENT ON COLUMN transactions.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN transactions.tx_hash IS 'Unique transaction hash (0x...)';
COMMENT ON COLUMN transactions.chain_id IS 'Chain ID (11155111 = Ethereum Sepolia, 421614 = Arbitrum Sepolia, 1 = Ethereum Mainnet, 42161 = Arbitrum One)';
COMMENT ON COLUMN transactions.description IS 'Human-readable description of the transaction (e.g., "Reward for PR #234")';
COMMENT ON COLUMN transactions.created_at IS 'Timestamp when the transaction was stored in database (UTC)';

-- ============================================
-- Optional: Enable Row Level Security (RLS)
-- ============================================
-- Uncomment below if you want to enable security policies

-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow public read access" ON transactions
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Allow authenticated insert" ON transactions
--     FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated delete" ON transactions
--     FOR DELETE
--     USING (auth.role() = 'authenticated');

-- ============================================
-- Test queries
-- ============================================

-- Insert sample transaction
-- INSERT INTO transactions (tx_hash, chain_id, description)
-- VALUES ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 11155111, 'Test transaction - Reward for PR #234');

-- Query all transactions
-- SELECT * FROM transactions ORDER BY created_at DESC;

-- Query transactions for specific chain
-- SELECT * FROM transactions WHERE chain_id = 11155111 ORDER BY created_at DESC;

-- Delete a transaction
-- DELETE FROM transactions WHERE tx_hash = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

-- ============================================
-- Done! Your table is ready to use.
-- ============================================
