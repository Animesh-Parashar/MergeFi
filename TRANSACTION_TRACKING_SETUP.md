# Transaction Tracking System - Setup Guide

## Overview

The new transaction tracking system allows MergeFi to store and display only the transactions that happen through your platform, not all blockchain transactions. This provides a clean, relevant transaction history for your users.

## System Architecture

```
┌─────────────────┐
│  User Action    │ (Payment, Swap, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  - Execute Tx   │
│  - Get Tx Hash  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store in DB    │ ← storeTransaction()
│  (Supabase)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Transactions   │
│  Page Fetches   │
│  & Enriches     │
│  with Blockscout│
└─────────────────┘
```

## Database Setup

### 1. Create Supabase Table

Run this SQL in your Supabase SQL editor:

\`\`\`sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'ETH',
  chain_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'payment',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_chain_id ON transactions(chain_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON transactions
  FOR SELECT USING (true);

-- Create policy to allow authenticated insert
CREATE POLICY "Allow public insert" ON transactions
  FOR INSERT WITH CHECK (true);

-- Create policy to allow update
CREATE POLICY "Allow public update" ON transactions
  FOR UPDATE USING (true);
\`\`\`

## Backend API Endpoints

The following endpoints are now available:

### Store Transaction
\`\`\`
POST /api/transactions
Body: {
  tx_hash: string
  from_address: string
  to_address: string
  value: string
  token: string
  chain_id: number
  status?: string (pending/success/failed)
  type?: string (payment/swap/bridge)
  description?: string
}
\`\`\`

### Get All Transactions
\`\`\`
GET /api/transactions?chain_id=11155111&limit=50
\`\`\`

### Get Transaction by Hash
\`\`\`
GET /api/transactions/:hash
\`\`\`

### Update Transaction Status
\`\`\`
PATCH /api/transactions/:hash/status
Body: { status: "success" | "failed" | "pending" }
\`\`\`

## Frontend Usage

### 1. Import the utility
\`\`\`typescript
import { storeTransaction, updateTransactionStatus } from '@/utils/transactionStore';
\`\`\`

### 2. Store transaction after execution

Example in `RewardPayment.ts`:

\`\`\`typescript
// After getting transaction receipt
const receipt = await tx.wait();

// Store in database
await storeTransaction({
  tx_hash: receipt.hash,
  from_address: await signer.getAddress(),
  to_address: contributorAddress,
  value: amount.toString(),
  token: 'USDC',
  chain_id: currentChainId,
  status: 'success',
  type: 'payment',
  description: \`Payment to contributor \${contributorAddress}\`
});
\`\`\`

### 3. Update status when transaction completes

\`\`\`typescript
// If transaction succeeds
await updateTransactionStatus(txHash, 'success');

// If transaction fails
await updateTransactionStatus(txHash, 'failed');
\`\`\`

## Example Implementation

Here's how to integrate it into your payment flow:

\`\`\`typescript
async function payContributor(
  contributorAddress: string,
  amount: string,
  chainId: number
) {
  try {
    // 1. Execute the transaction
    const tx = await contract.transfer(contributorAddress, amount);
    
    // 2. Store immediately with pending status
    await storeTransaction({
      tx_hash: tx.hash,
      from_address: await signer.getAddress(),
      to_address: contributorAddress,
      value: amount,
      token: 'USDC',
      chain_id: chainId,
      status: 'pending',
      type: 'contributor_payment',
      description: \`Payment to \${contributorAddress}\`
    });
    
    // 3. Wait for confirmation
    const receipt = await tx.wait();
    
    // 4. Update to success
    await updateTransactionStatus(tx.hash, 'success');
    
    return receipt;
  } catch (error) {
    // Update to failed if we have the tx hash
    if (error.transaction?.hash) {
      await updateTransactionStatus(error.transaction.hash, 'failed');
    }
    throw error;
  }
}
\`\`\`

## Transactions Page Features

The Transactions page now:

✅ **Fetches only your app's transactions** from the database
✅ **Enriches with Blockscout data** (confirmations, fees, timestamps)
✅ **Shows real-time stats** (volume, success rate, pending count)
✅ **Auto-refreshes** every 30 seconds
✅ **Supports multiple networks** (Ethereum & Arbitrum)
✅ **Shows token types** (ETH, USDC, USDT, etc.)

## Testing

1. **Start backend:**
   \`\`\`bash
   cd backend
   npm start
   \`\`\`

2. **Make a test transaction** (or manually insert):
   \`\`\`bash
   curl -X POST http://localhost:5000/api/transactions \\
     -H "Content-Type: application/json" \\
     -d '{
       "tx_hash": "0x...",
       "from_address": "0x...",
       "to_address": "0x...",
       "value": "100",
       "token": "USDC",
       "chain_id": 11155111,
       "status": "success",
       "type": "payment",
       "description": "Test payment"
     }'
   \`\`\`

3. **View transactions:**
   - Navigate to `/transactions`
   - Should see your stored transaction
   - Auto-enriched with Blockscout data

## Transaction Types

Use these standard types for consistency:

- `payment` - Direct payment to contributor
- `reward` - Reward distribution
- `swap` - Token swap operation
- `bridge` - Cross-chain bridge
- `approval` - Token approval
- `deposit` - Pool deposit
- `withdrawal` - Pool withdrawal

## Status Values

- `pending` - Transaction submitted, waiting for confirmation
- `success` - Transaction confirmed successfully
- `failed` - Transaction failed or reverted

## Next Steps

1. ✅ Database table created
2. ✅ Backend API implemented
3. ✅ Frontend utility created
4. ⏳ Integrate into payment flows
5. ⏳ Add error handling
6. ⏳ Add loading states

## Benefits

✅ **Relevant Data** - Only show transactions from your platform
✅ **Better UX** - Users see their own transactions, not random blockchain activity
✅ **Faster Loading** - No need to filter through thousands of transactions
✅ **Rich Context** - Add descriptions and metadata to each transaction
✅ **Cross-Chain** - Track transactions across Ethereum and Arbitrum
✅ **Audit Trail** - Complete history of all platform transactions
