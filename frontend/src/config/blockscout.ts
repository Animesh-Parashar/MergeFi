// Blockscout Network Configuration
// This file contains configuration for Ethereum and Arbitrum networks with token support

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
}

export interface NetworkConfig {
  id: string;
  name: string;
  apiBase: string;
  explorerBase: string;
  chainId: number;
  currency: string;
  tokens: {
    usdc?: TokenConfig;
    usdt?: TokenConfig;
  };
}

export const BLOCKSCOUT_NETWORKS: Record<string, NetworkConfig> = {
  // Ethereum Networks
  'eth-mainnet': {
    id: 'eth-mainnet',
    name: 'Ethereum Mainnet',
    apiBase: 'https://eth.blockscout.com/api/v2',
    explorerBase: 'https://eth.blockscout.com',
    chainId: 1,
    currency: 'ETH',
    tokens: {
      usdc: {
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
      },
      usdt: {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
      },
    },
  },
  'eth-sepolia': {
    id: 'eth-sepolia',
    name: 'Ethereum Sepolia',
    apiBase: 'https://eth-sepolia.blockscout.com/api/v2',
    explorerBase: 'https://eth-sepolia.blockscout.com',
    chainId: 11155111,
    currency: 'ETH',
    tokens: {
      usdc: {
        symbol: 'USDC',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
      },
      usdt: {
        symbol: 'USDT',
        address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
        decimals: 6,
      },
    },
  },

  // Arbitrum Networks
  'arbitrum': {
    id: 'arbitrum',
    name: 'Arbitrum One',
    apiBase: 'https://arbitrum.blockscout.com/api/v2',
    explorerBase: 'https://arbitrum.blockscout.com',
    chainId: 42161,
    currency: 'ETH',
    tokens: {
      usdc: {
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
      },
      usdt: {
        symbol: 'USDT',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
      },
    },
  },
  'arbitrum-sepolia': {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    apiBase: 'https://arbitrum-sepolia.blockscout.com/api/v2',
    explorerBase: 'https://arbitrum-sepolia.blockscout.com',
    chainId: 421614,
    currency: 'ETH',
    tokens: {
      usdc: {
        symbol: 'USDC',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        decimals: 6,
      },
      usdt: {
        symbol: 'USDT',
        address: '0xf7949729015c9326119b85f5c4b802b3e6e226df',
        decimals: 6,
      },
    },
  },
};

// Default network to use
export const DEFAULT_NETWORK = 'eth-sepolia';

// Get network config by ID
export const getNetworkConfig = (networkId: string): NetworkConfig => {
  return BLOCKSCOUT_NETWORKS[networkId] || BLOCKSCOUT_NETWORKS[DEFAULT_NETWORK];
};

// Get network config by chain ID
export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return Object.values(BLOCKSCOUT_NETWORKS).find(
    (network) => network.chainId === chainId
  );
};

// Get all available networks
export const getAllNetworks = (): NetworkConfig[] => {
  return Object.values(BLOCKSCOUT_NETWORKS);
};

// Format value based on network currency
export const formatValue = (value: string, currency: string = 'ETH'): string => {
  if (!value || value === '0') return `0 ${currency}`;
  const numericValue = parseFloat(value) / 1e18;
  return `${numericValue.toFixed(6)} ${currency}`;
};

// Format token value (6 decimals for USDC/USDT)
export const formatTokenValue = (value: string, decimals: number = 6, symbol: string = 'USDC'): string => {
  if (!value || value === '0') return `0 ${symbol}`;
  const numericValue = parseFloat(value) / Math.pow(10, decimals);
  return `${numericValue.toFixed(2)} ${symbol}`;
};

// Get token config for a network
export const getTokenConfig = (networkId: string, tokenSymbol: 'usdc' | 'usdt'): TokenConfig | undefined => {
  const network = getNetworkConfig(networkId);
  return network.tokens[tokenSymbol];
};

// Get all tokens for a network
export const getNetworkTokens = (networkId: string): TokenConfig[] => {
  const network = getNetworkConfig(networkId);
  return Object.values(network.tokens).filter(Boolean) as TokenConfig[];
};
