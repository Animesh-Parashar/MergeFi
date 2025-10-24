# Transaction Explorer - Documentation

## Overview

The Transaction Explorer page is a new feature in MergeFi that allows users to track and explore blockchain transactions and their related activity using the Blockscout API. This is particularly useful for understanding complex payment flows where multiple transactions occur together (e.g., Avail SDK payments that involve 3-4 related transactions).

## Features

### 1. **Transaction Search**
- Input a transaction hash to fetch detailed information
- Real-time data fetched from Blockscout API
- Support for Ethereum Sepolia testnet (can be configured for other networks)

### 2. **Main Transaction Details**
Displays comprehensive information about the queried transaction:
- Transaction hash
- Transaction status (Success/Pending/Failed)
- Method called
- From/To addresses
- Value transferred (in ETH)
- Transaction fee
- Block number
- Timestamp
- Number of confirmations

### 3. **Related Transactions**
Automatically fetches and displays related transactions:
- **Block-level transactions**: Other transactions in the same block from/to the same addresses
- **Internal transactions**: Contract-to-contract or contract-to-address transfers
- Visual indicators for incoming/outgoing transactions
- Complete transaction flow visualization

### 4. **Explorer Integration**
- Direct links to view transactions on Blockscout explorer
- External link icons for easy navigation
- Full transaction hash display

## Technical Implementation

### API Integration

The page uses the **Blockscout API v2** to fetch transaction data:

```typescript
const BLOCKSCOUT_API_BASE = 'https://eth-sepolia.blockscout.com/api/v2';
const BLOCKSCOUT_EXPLORER = 'https://eth-sepolia.blockscout.com';
```

### Key API Endpoints Used

1. **Get Transaction Details**
   ```
   GET /api/v2/transactions/{hash}
   ```

2. **Get Block Transactions**
   ```
   GET /api/v2/blocks/{block_number}/transactions
   ```

3. **Get Internal Transactions**
   ```
   GET /api/v2/transactions/{hash}/internal-transactions
   ```

### Data Flow

1. User enters a transaction hash
2. Fetch main transaction details from Blockscout
3. Fetch related transactions from the same block
4. Fetch internal transactions (contract calls)
5. Filter and display transactions related to the main transaction
6. Format and present data with visual indicators

## Configuration

### Network Configuration

To use with different networks, update the API base URL:

```typescript
// For Ethereum Mainnet
const BLOCKSCOUT_API_BASE = 'https://eth.blockscout.com/api/v2';

// For Arbitrum One
const BLOCKSCOUT_API_BASE = 'https://arbitrum.blockscout.com/api/v2';

// For Optimism
const BLOCKSCOUT_API_BASE = 'https://optimism.blockscout.com/api/v2';

// For other networks, check: https://docs.blockscout.com/about/features/supported-networks
```

### Supported Networks

Blockscout supports many EVM-compatible networks. Refer to the [Blockscout documentation](https://docs.blockscout.com/devs/apis) for a complete list.

## UI/UX Features

### Visual Design
- Matches the existing MergeFi design system
- Dark theme with minimal, monospace fonts
- Smooth animations using Framer Motion
- Responsive layout for mobile and desktop

### Status Indicators
- ✅ **Green**: Successful transactions
- ⏱️ **Yellow**: Pending transactions
- ❌ **Red**: Failed transactions

### Transaction Type Indicators
- 🔴 **Red Arrow (↗)**: Outgoing transactions
- 🟢 **Green Arrow (↙)**: Incoming transactions

## Usage Example

### For Avail SDK Payment Flow

When a complete payment happens through Avail SDK with 3-4 transactions:

1. Enter the initial transaction hash in the search box
2. View the main payment transaction details
3. See all related transactions including:
   - Token approvals
   - Token transfers
   - Bridge transactions
   - Internal contract calls
4. Track the complete flow from start to finish

### Example Transaction Hash (Sepolia Testnet)
```
0x... (enter any valid transaction hash from Sepolia testnet)
```

## File Structure

```
frontend/src/pages/Transactions.tsx    # Main transaction explorer component
frontend/src/App.tsx                   # Route configuration
frontend/src/components/Navbar.tsx     # Navigation with Transactions link
```

## API Response Handling

### Error Handling
- Transaction not found
- Network errors
- Invalid transaction hash
- API rate limiting

### Data Parsing
- Converts wei to ETH for display
- Formats timestamps to local time
- Shortens addresses for display
- Handles missing data gracefully

## Future Enhancements

1. **Multi-chain Support**: Add dropdown to select different networks
2. **Transaction Filtering**: Filter by type, value, or time range
3. **Export Feature**: Export transaction data as CSV/JSON
4. **Gas Analytics**: Show gas usage and optimization suggestions
5. **Token Transfers**: Display ERC20/ERC721 token transfers
6. **Transaction Timeline**: Visual timeline of related transactions
7. **Real-time Updates**: WebSocket integration for live transaction updates

## Dependencies

- `lucide-react`: Icons
- `framer-motion`: Animations
- `react-router-dom`: Routing
- Blockscout API: Transaction data

## Navigation

Access the Transactions page:
- URL: `/transactions`
- Navigation: Click "Transactions" in the main navbar

## Support

For issues or questions:
- Blockscout API Docs: https://docs.blockscout.com/devs/apis
- Blockscout GitHub: https://github.com/blockscout/blockscout
