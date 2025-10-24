# Transaction Explorer - Quick Start Guide

## What's New

A new **Transactions** page has been added to MergeFi that automatically displays the latest blockchain transactions using the Blockscout API.

## How to Use

1. **Navigate to the Transactions page**
   - Click "Transactions" in the navbar, or
   - Go to `http://localhost:5173/transactions`

2. **View live transactions**
   - Transactions load automatically when you visit the page
   - Auto-refreshes every 30 seconds
   - Click the "Refresh" button for manual updates

3. **Explore transaction details**
   - View transaction status, method, addresses, value, and fees
   - Click "View Details" to see full information on Blockscout
   - See comprehensive stats at the top (volume, count, success rate, avg fee)

## Key Features

✅ **Auto-Loading** - No search required! Latest 20 transactions load automatically
✅ **Live Stats Dashboard** - Real-time metrics displayed at the top
✅ **Auto-Refresh** - Updates every 30 seconds automatically
✅ **Manual Refresh** - Click refresh button anytime for instant updates

## Example Use Case: Avail SDK Payments

When payments happen through Avail SDK, you can monitor them in real-time:

1. Visit the Transactions page
2. Watch as new transactions appear automatically
3. Identify your payment transactions by:
   - Method name (e.g., "Transfer", "Deposit")
   - Address (your wallet or recipient)
   - Value transferred
4. Click "View Details" to see complete transaction information on Blockscout

## Live Stats Display

The dashboard shows real-time statistics:

📊 **Total Volume** - Sum of all ETH transferred in recent transactions
📈 **Total Transactions** - Count of last 20 transactions displayed
✅ **Successful** - Number and percentage of successful transactions
⚡ **Avg Fee** - Average transaction fee across all recent transactions

## Network Configuration

Currently configured for **Ethereum Sepolia Testnet**. The API endpoints are:
- API: `https://eth-sepolia.blockscout.com/api/v2`
- Explorer: `https://eth-sepolia.blockscout.com`

## Features

✅ **Auto-Loading Transactions**
- Latest 20 transactions from Ethereum Sepolia
- Loads automatically on page visit
- No manual search required

✅ **Live Dashboard Statistics**
- Total volume (ETH)
- Transaction count
- Success rate percentage
- Average transaction fee

✅ **Auto-Refresh**
- Updates every 30 seconds automatically
- Manual refresh button available
- Loading indicator shows refresh status

✅ **Transaction Cards** - Each transaction shows:
- Transaction hash and status
- Method/function called
- From/To addresses with visual indicators
- Value transferred in ETH
- Transaction fee
- Block number and confirmations
- Timestamp

✅ **Explorer Integration**
- Direct links to Blockscout explorer
- View full transaction details on Blockscout
- External link icons for easy navigation

✅ **Modern UI**
- Matches existing MergeFi design
- Dark theme with monospace fonts
- Smooth animations
- Responsive layout

## UI Elements

- **Status Icons**:
  - ✅ Green check: Success
  - ⏱️ Yellow clock: Pending
  - ❌ Red alert: Failed

- **Direction Indicators**:
  - 🔴 Red arrow up-right (↗): Outgoing
  - 🟢 Green arrow down-left (↙): Incoming

## Files Modified/Created

1. **Created**: `/frontend/src/pages/Transactions.tsx` - Main transaction explorer component
2. **Modified**: `/frontend/src/App.tsx` - Added route for transactions page
3. **Modified**: `/frontend/src/components/Navbar.tsx` - Added Transactions link to navbar
4. **Created**: `/TRANSACTIONS_PAGE.md` - Full documentation

## Testing

To test the page:

1. Start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173/transactions`

3. You should see:
   - Stats dashboard at the top
   - Latest 20 transactions from Sepolia testnet
   - Automatic updates every 30 seconds
   - Ability to manually refresh

## Next Steps

Potential enhancements:
- [ ] Multi-chain support (dropdown to select network)
- [ ] Transaction filtering and sorting
- [ ] Export transaction data
- [ ] Token transfer details (ERC20/ERC721)
- [ ] Visual transaction timeline
- [ ] Real-time updates via WebSocket

## Support

- Blockscout API Docs: https://docs.blockscout.com/devs/apis
- Blockscout Supported Networks: https://docs.blockscout.com/about/features/supported-networks
