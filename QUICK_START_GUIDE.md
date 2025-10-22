# 🚀 Quick Start Guide - Transaction Tracking

## Step 1: Create Database Table (5 minutes)

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `create_transactions_table.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: ✅ "Success. No rows returned"

## Step 2: Verify Table Creation (2 minutes)

1. In Supabase Dashboard, go to **Table Editor**
2. You should see a new table called `transactions`
3. It should have these columns:
   - ✅ id (int8)
   - ✅ tx_hash (varchar)
   - ✅ chain_id (int4)
   - ✅ description (text)
   - ✅ created_at (timestamptz)

## Step 3: Test API Endpoints (5 minutes)

### Start your backend server
```bash
cd backend
npm install  # if you haven't already
node server.js
```

### Test storing a transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "tx_hash": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "chain_id": 11155111,
    "description": "Test transaction - Reward for PR #234"
  }'
```

Expected response: `{ "success": true, "data": { ... } }`

### Test fetching all transactions
```bash
curl http://localhost:3000/api/transactions
```

Expected response: Array of transactions

### Test fetching by hash
```bash
curl http://localhost:3000/api/transactions/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

### Test deleting a transaction
```bash
curl -X DELETE http://localhost:3000/api/transactions/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

## Step 4: Test Frontend (5 minutes)

### Start your frontend
```bash
cd frontend
npm install  # if you haven't already
npm run dev
```

### View the Transactions page
1. Open browser to your frontend URL (usually http://localhost:5173)
2. Navigate to `/transactions` route
3. You should see the transactions page with demo data
4. Check the stats dashboard showing:
   - Total Transactions
   - Successful
   - Pending
   - Total Volume

## Step 5: Switch from Demo to Real Data (10 minutes)

Open `frontend/src/pages/Transactions.tsx` and find this line (around line 103):

```typescript
const USE_DEMO_DATA = true; // Change to false for real data
```

Change it to:

```typescript
const USE_DEMO_DATA = false; // Now using real API
```

### Implement Blockscout Enrichment

Find the enrichment section (around line 130) and replace with:

```typescript
// Enrich with Blockscout data
const enrichedTxs: TransactionWithDetails[] = await Promise.all(
  storedTxs.map(async (tx) => {
    const networkConfig = getNetworkByChainId(tx.chain_id);
    if (!networkConfig) {
      console.warn(`Network config not found for chain ${tx.chain_id}`);
      return null;
    }

    try {
      const response = await fetch(
        `${networkConfig.apiUrl}/transactions/${tx.tx_hash}`
      );
      
      if (!response.ok) {
        console.error(`Blockscout API error for ${tx.tx_hash}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return {
        ...tx,
        from_address: data.from?.hash || '0x0000000000000000000000000000000000000000',
        to_address: data.to?.hash || '0x0000000000000000000000000000000000000000',
        value: data.value || '0',
        token: data.token?.symbol || 'ETH',
        blockNumber: data.block?.toString() || '0',
        confirmations: data.confirmations || 0,
        fee: data.fee?.value || '0',
        method: data.method || 'Transfer',
        timestamp: data.timestamp || tx.created_at,
        status: data.status || 'pending',
      } as TransactionWithDetails;
    } catch (error) {
      console.error(`Failed to fetch transaction ${tx.tx_hash}:`, error);
      return null;
    }
  })
);

// Filter out failed fetches
const validTransactions = enrichedTxs.filter(
  (tx): tx is TransactionWithDetails => tx !== null
);

setTransactions(validTransactions);
```

## Step 6: Integrate with Payment Flow (15 minutes)

### Option A: Using the utility function

In your payment component (e.g., `Contributor.tsx` or `RewardPayment.ts`):

```typescript
import { storeTransaction } from '../utils/transactionStore';

// After successful payment
const handlePayment = async (amount: string, recipient: string, prNumber: string) => {
  try {
    // Your existing payment logic
    const txHash = await sendPaymentViaAvail(...);
    
    // Store transaction hash
    await storeTransaction({
      tx_hash: txHash,
      chain_id: currentChainId, // e.g., 11155111 for Sepolia
      description: `Reward for PR #${prNumber}`,
    });
    
    console.log('Transaction stored:', txHash);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### Option B: Direct API call

```typescript
const handlePayment = async (amount: string, recipient: string, prNumber: string) => {
  try {
    const txHash = await sendPaymentViaAvail(...);
    
    // Store via API
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_hash: txHash,
        chain_id: currentChainId,
        description: `Reward for PR #${prNumber}`,
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to store transaction');
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## Step 7: Test End-to-End (10 minutes)

1. Make a real payment through your platform
2. Check that transaction appears in database:
   - Go to Supabase → Table Editor → transactions
   - Your transaction should be there with the hash
3. Navigate to Transactions page
4. Transaction should appear with full details from Blockscout
5. Verify all fields are populated correctly

## Troubleshooting

### ❌ "Table does not exist"
- Run the SQL script in Supabase again
- Check you're in the correct project

### ❌ "Network error" when fetching transactions
- Make sure backend server is running
- Check CORS settings if frontend/backend on different ports
- Verify Supabase credentials in `.env`

### ❌ Transaction shows but details are missing
- Check if transaction hash is valid
- Verify transaction exists on Blockscout (manually visit the explorer)
- Check browser console for Blockscout API errors
- Ensure network configuration is correct for the chain_id

### ❌ "Cannot read property 'hash' of undefined"
- Blockscout API response format may differ
- Add error handling and logging
- Check Blockscout API documentation for your specific network

## Optional Enhancements

### Add Loading States
```typescript
const [loading, setLoading] = useState(false);

const fetchLatestTransactions = async () => {
  setLoading(true);
  try {
    // ... fetch logic
  } finally {
    setLoading(false);
  }
};

// In JSX
{loading ? <div>Loading transactions...</div> : <TransactionList />}
```

### Add Error States
```typescript
const [error, setError] = useState<string | null>(null);

const fetchLatestTransactions = async () => {
  setError(null);
  try {
    // ... fetch logic
  } catch (err) {
    setError(err.message);
  }
};

// In JSX
{error && <div className="error">{error}</div>}
```

### Add Caching
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const txCache = new Map<string, { data: TransactionWithDetails, timestamp: number }>();

const getCachedOrFetch = async (tx: StoredTransaction) => {
  const cached = txCache.get(tx.tx_hash);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const enriched = await fetchFromBlockscout(tx);
  txCache.set(tx.tx_hash, { data: enriched, timestamp: Date.now() });
  return enriched;
};
```

## Success Checklist

- [ ] Database table created in Supabase
- [ ] Backend API tested (POST, GET, DELETE)
- [ ] Frontend displays demo data
- [ ] Switched to real data mode
- [ ] Blockscout enrichment implemented
- [ ] Payment flow stores transaction hashes
- [ ] End-to-end test successful
- [ ] Error handling added
- [ ] Loading states implemented (optional)
- [ ] Caching implemented (optional)

## Documentation Reference

- **Full Documentation**: `TRANSACTION_IMPLEMENTATION_SUMMARY.md`
- **SQL Schema Details**: `SQL_TABLE_SCHEMA.md`
- **SQL Script**: `create_transactions_table.sql`
- **This Guide**: `QUICK_START_GUIDE.md`

---

🎉 **Congratulations!** Your transaction tracking system is now live!

