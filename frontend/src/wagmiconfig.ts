// wagmiConfig.ts
import { createConfig, http } from 'wagmi'
import { sepolia, arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Create config for wagmi v2
export const config = createConfig({
  chains: [sepolia, arbitrumSepolia],
  connectors: [
    injected()
  ],
  transports: {
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})

