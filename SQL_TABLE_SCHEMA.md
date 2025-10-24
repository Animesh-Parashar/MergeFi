# Supabase Database Schema for Transactions

## Table: `transactions`

This table stores minimal transaction data (only hash and chain ID). All other transaction details (from address, to address, value, token, status, etc.) are fetched on-demand from the Blockscout API.

### SQL Query to Create Table

```sql
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
```

### Column Details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `tx_hash` | VARCHAR(66) | NOT NULL, UNIQUE | Transaction hash (starts with 0x, 66 characters total) |
| `chain_id` | INTEGER | NOT NULL | Blockchain network identifier |
| `description` | TEXT | NULLABLE | Optional human-readable description |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Auto-set timestamp in UTC |

### Supported Chain IDs

- **11155111** - Ethereum Sepolia (Testnet)
- **421614** - Arbitrum Sepolia (Testnet)
- **1** - Ethereum Mainnet
- **42161** - Arbitrum One (Mainnet)

### Example Queries

#### Insert a new transaction
```sql
INSERT INTO transactions (tx_hash, chain_id, description)
VALUES ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 11155111, 'Reward for PR #234');
```

#### Get all transactions (latest first)
```sql
SELECT * FROM transactions
ORDER BY created_at DESC;
```

#### Get transactions for a specific chain
```sql
SELECT * FROM transactions
WHERE chain_id = 11155111
ORDER BY created_at DESC;
```

#### Get a specific transaction by hash
```sql
SELECT * FROM transactions
WHERE tx_hash = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
```

#### Delete old transactions (older than 30 days)
```sql
DELETE FROM transactions
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Row Level Security (RLS) - Optional

If you want to enable RLS for security:

```sql
-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON transactions
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON transactions
    FOR DELETE
    USING (auth.role() = 'authenticated');
```

### Migration from Old Schema

If you have an old `transactions` table with additional columns (from_address, to_address, value, token, status, type), you can migrate:

```sql
-- Option 1: Drop old table and create new one (WARNING: This deletes all data)
DROP TABLE IF EXISTS transactions CASCADE;
-- Then run the CREATE TABLE query above

-- Option 2: Create new table with different name, migrate data
CREATE TABLE transactions_new (
    id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Copy relevant data from old table
INSERT INTO transactions_new (tx_hash, chain_id, description, created_at)
SELECT tx_hash, chain_id, description, created_at
FROM transactions;

-- Rename tables
ALTER TABLE transactions RENAME TO transactions_old;
ALTER TABLE transactions_new RENAME TO transactions;

-- Drop old table when safe
DROP TABLE transactions_old CASCADE;
```

### Integration with Backend

The backend controller (`backend/controllers/transaction.controller.js`) interacts with this table:

- **POST /api/transactions** - Stores new transaction (tx_hash, chain_id, description)
- **GET /api/transactions** - Retrieves all transactions (optional chain_id filter)
- **GET /api/transactions/:hash** - Gets specific transaction by hash
- **DELETE /api/transactions/:hash** - Removes transaction from database

### Integration with Frontend

The frontend (`frontend/src/pages/Transactions.tsx`):

1. Fetches transaction hashes from backend API
2. For each hash, calls Blockscout API to get full details:
   - from_address
   - to_address
   - value
   - token symbol
   - block number
   - confirmations
   - gas fees
   - timestamp
   - status (success/pending/failed)
3. Displays enriched transaction data in UI

### Benefits of Minimal Storage Approach

1. **Reduced Database Size** - Only 2-3 columns vs 10+ columns
2. **Always Fresh Data** - Transaction details fetched live from blockchain
3. **No Data Duplication** - Blockchain is the source of truth
4. **Simpler Schema** - Easier to maintain and migrate
5. **Lower Storage Costs** - Significantly less data stored in Supabase
6. **Flexibility** - Can change what data to display without schema changes

### Performance Considerations

- Indexes on `chain_id`, `created_at`, and `tx_hash` ensure fast queries
- Frontend caching can reduce Blockscout API calls
- Consider implementing rate limiting for Blockscout API calls
- For high-volume applications, consider caching enriched data client-side

### Data Retention Policy

Consider implementing automated cleanup:

```sql
-- Create a function to delete old transactions
CREATE OR REPLACE FUNCTION cleanup_old_transactions()
RETURNS void AS $$
BEGIN
    DELETE FROM transactions
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule it (requires pg_cron extension)
SELECT cron.schedule('cleanup-transactions', '0 0 * * *', 'SELECT cleanup_old_transactions()');
```

