# Blockscout Configuration - Network & Token Support

## Supported Networks

### Ethereum
- **Mainnet** (Chain ID: 1)
  - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
  - USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

- **Sepolia Testnet** (Chain ID: 11155111) - Default
  - USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
  - USDT: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`

### Arbitrum
- **Arbitrum One** (Chain ID: 42161)
  - USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
  - USDT: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`

- **Arbitrum Sepolia** (Chain ID: 421614)
  - USDC: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
  - USDT: `0xf7949729015c9326119b85f5c4b802b3e6e226df`

## Usage Examples

### Get Network Configuration
```typescript
import { getNetworkConfig } from '@/config/blockscout';

const sepoliaConfig = getNetworkConfig('eth-sepolia');
// Returns full network config including tokens
```

### Get Network by Chain ID
```typescript
import { getNetworkByChainId } from '@/config/blockscout';

const network = getNetworkByChainId(11155111);
// Returns Ethereum Sepolia config
```

### Get Token Configuration
```typescript
import { getTokenConfig } from '@/config/blockscout';

const usdcConfig = getTokenConfig('eth-sepolia', 'usdc');
// Returns: { symbol: 'USDC', address: '0x1c7D...', decimals: 6 }

const usdtConfig = getTokenConfig('arbitrum', 'usdt');
// Returns: { symbol: 'USDT', address: '0xFd08...', decimals: 6 }
```

### Get All Tokens for a Network
```typescript
import { getNetworkTokens } from '@/config/blockscout';

const tokens = getNetworkTokens('eth-sepolia');
// Returns: [{ USDC config }, { USDT config }]
```

### Format Values
```typescript
import { formatValue, formatTokenValue } from '@/config/blockscout';

// Format ETH
const ethAmount = formatValue('1000000000000000000', 'ETH');
// Returns: "1.000000 ETH"

// Format USDC/USDT (6 decimals)
const usdcAmount = formatTokenValue('1000000', 6, 'USDC');
// Returns: "1.00 USDC"

const usdtAmount = formatTokenValue('5000000', 6, 'USDT');
// Returns: "5.00 USDT"
```

## Network IDs

Use these IDs when calling functions:
- `'eth-mainnet'` - Ethereum Mainnet
- `'eth-sepolia'` - Ethereum Sepolia (default)
- `'arbitrum'` - Arbitrum One
- `'arbitrum-sepolia'` - Arbitrum Sepolia

## Token Symbols

Supported tokens:
- `'usdc'` - USD Coin (6 decimals)
- `'usdt'` - Tether USD (6 decimals)

## API Endpoints

### Ethereum Sepolia (Default)
- API: `https://eth-sepolia.blockscout.com/api/v2`
- Explorer: `https://eth-sepolia.blockscout.com`

### Arbitrum Sepolia
- API: `https://arbitrum-sepolia.blockscout.com/api/v2`
- Explorer: `https://arbitrum-sepolia.blockscout.com`

## Features

✅ **4 Networks** - Ethereum Mainnet/Sepolia, Arbitrum One/Sepolia
✅ **2 Tokens per Network** - USDC and USDT support
✅ **Type-Safe** - Full TypeScript interfaces
✅ **Helper Functions** - Easy network and token lookups
✅ **Value Formatting** - ETH and token formatting utilities

## Removed Networks

The following networks were removed to simplify the configuration:
- ❌ Optimism (Mainnet & Sepolia)
- ❌ Polygon PoS
- ❌ Base (Mainnet & Sepolia)
- ❌ Gnosis Chain
- ❌ zkSync Era

Only Ethereum and Arbitrum networks are now supported.
