# Transaction Flow Visualization

## How the Transaction Explorer Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ENTERS TX HASH                          │
│                  (e.g., from Avail SDK payment)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKSCOUT API REQUEST                        │
│                  GET /transactions/{hash}                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MAIN TRANSACTION DATA                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ✓ Hash: 0xabc123...                                      │  │
│  │  ✓ Status: Success                                        │  │
│  │  ✓ From: 0x1234... → To: 0x5678...                       │  │
│  │  ✓ Value: 0.5 ETH                                         │  │
│  │  ✓ Block: #12345678                                       │  │
│  │  ✓ Timestamp: 2025-10-22 10:30:45                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │  GET BLOCK TXS        │   │  GET INTERNAL TXS     │
    │  /blocks/{num}/txs    │   │  /transactions/{hash} │
    │                       │   │  /internal-txs        │
    └───────────────────────┘   └───────────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FILTER RELATED TXS                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Filter by:                                               │  │
│  │  • Same from/to addresses                                 │  │
│  │  • Internal contract calls                                │  │
│  │  • Same block number                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DISPLAY RESULTS                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MAIN TRANSACTION                                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ✅ Success | 0x1234... → 0x5678... | 0.5 ETH      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  RELATED TRANSACTIONS (3)                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ✅ Token Approval | 0x1234... → 0xABCD...         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ✅ Token Transfer | 0xABCD... → 0x5678...         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ✅ Internal Transfer | Contract call              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Example: Avail SDK Payment Flow

```
SCENARIO: User makes a payment via Avail SDK
         Payment involves 4 transactions

┌────────────────────────────────────────────────────────────────┐
│ Transaction 1: APPROVE USDC                                    │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ User → USDC Contract                                       │ │
│ │ Method: approve(spender, amount)                           │ │
│ │ Status: ✅ Success                                         │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ Transaction 2: BRIDGE TRANSFER                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ User → Bridge Contract                                     │ │
│ │ Method: deposit(token, amount, recipient)                  │ │
│ │ Status: ✅ Success                                         │ │
│ └────────────────────────────────────────────────────────────┘ │
│   Internal Transactions:                                       │
│   • Bridge → USDC (transferFrom)                              │
│   • Bridge → Recipient (emit events)                          │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ Transaction 3: FINALIZE ON DESTINATION                         │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Bridge → Recipient                                         │ │
│ │ Method: finalizeDeposit()                                  │ │
│ │ Status: ✅ Success                                         │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ Transaction 4: ACTUAL PAYMENT TO CONTRIBUTOR                   │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Contract → Contributor Address                             │ │  ← ENTER THIS HASH
│ │ Method: transfer(recipient, amount)                        │ │     IN EXPLORER
│ │ Status: ✅ Success                                         │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

ALL 4 TRANSACTIONS DISPLAYED TOGETHER IN THE EXPLORER! 🎉
```

## Visual Indicators in UI

```
┌──────────────────────────────────────────────────────────┐
│ Status Icons:                                            │
│ ✅  Success (Green)                                      │
│ ⏱️  Pending (Yellow)                                     │
│ ❌  Failed (Red)                                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Direction Icons:                                         │
│ 🔴 ↗  Outgoing transaction (red arrow up-right)         │
│ 🟢 ↙  Incoming transaction (green arrow down-left)      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Transaction Card Example:                                │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✅ Transfer                    [🔗 View on Explorer] │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ From:  0x1234...5678  🔴↗                           │ │
│ │ To:    0xabcd...efgh  🟢↙                           │ │
│ │ Value: 0.500000 ETH                                 │ │
│ │ Fee:   0.002156 ETH                                 │ │
│ │ Block: #12345678                                    │ │
│ │ Time:  2025-10-22 10:30:45                         │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSACTION EXPLORER                      │
│                     (React Component)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ useState hooks
                            │ - txHash
                            │ - loading
                            │ - error
                            │ - transactionData
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌──────────────────────┐
│  User Input           │       │  Fetch Functions     │
│  - Text field         │       │  - fetchMainTx()     │
│  - Search button      │──────>│  - fetchRelatedTxs() │
│  - Enter key          │       │  - fetchInternalTxs()│
└───────────────────────┘       └──────────────────────┘
                                            │
                                            │ fetch API
                                            │
                        ┌───────────────────┴──────────────────┐
                        ▼                                      ▼
            ┌──────────────────────┐           ┌─────────────────────┐
            │  Blockscout API      │           │  Data Processing    │
            │  - GET /transactions │           │  - Format values    │
            │  - GET /blocks       │───────────>│  - Parse addresses  │
            │  - GET /internal-txs │           │  - Filter related   │
            └──────────────────────┘           └─────────────────────┘
                                                           │
                                                           │
                                                           ▼
                                            ┌──────────────────────┐
                                            │  Display Components  │
                                            │  - Main TX Card      │
                                            │  - Related TX List   │
                                            │  - Status Indicators │
                                            └──────────────────────┘
```

## Network Request Timeline

```
Time (ms)    Action
─────────────────────────────────────────────────────────────
0            User clicks "Search"
             ├─ Set loading = true
             └─ Clear previous errors

50           Request 1: Fetch main transaction
             GET /api/v2/transactions/{hash}

200          Response 1: Main transaction data received
             ├─ Parse transaction details
             ├─ Extract block number
             └─ Set mainTransaction state

250          Request 2a: Fetch block transactions
             GET /api/v2/blocks/{blockNum}/transactions
             
             Request 2b: Fetch internal transactions
             GET /api/v2/transactions/{hash}/internal-transactions

500          Response 2a & 2b: Related data received
             ├─ Filter related transactions
             ├─ Parse internal transactions
             └─ Combine results

550          Render complete view
             ├─ Set loading = false
             ├─ Display main transaction
             └─ Display related transactions (with animations)

─────────────────────────────────────────────────────────────
Total Time: ~550ms (typical)
```

## Error Handling Flow

```
┌─────────────────┐
│ User enters TX  │
│ hash            │
└────────┬────────┘
         │
         ▼
    ┌────────────────┐
    │ Validate input │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐    ┌─────────────┐
│ Valid    │    │ Invalid     │
│          │    │ - Empty     │
│          │    │ - Wrong fmt │
└────┬─────┘    └──────┬──────┘
     │                 │
     │                 ▼
     │          ┌──────────────┐
     │          │ Show error   │
     │          │ message      │
     │          └──────────────┘
     │
     ▼
┌────────────┐
│ Fetch data │
└─────┬──────┘
      │
┌─────┴──────┐
│            │
▼            ▼
┌─────┐  ┌────────┐
│ OK  │  │ Error  │
│     │  │ - 404  │
│     │  │ - 500  │
│     │  │ - Net  │
└──┬──┘  └────┬───┘
   │          │
   │          ▼
   │    ┌───────────┐
   │    │ Display   │
   │    │ error     │
   │    │ message   │
   │    └───────────┘
   │
   ▼
┌─────────────┐
│ Display     │
│ results     │
└─────────────┘
```
