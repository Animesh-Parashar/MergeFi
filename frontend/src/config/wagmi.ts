import { http, createConfig } from 'wagmi'
import { sepolia, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// If you want to use WalletConnect, get your project ID from https://cloud.walletconnect.com
// For now, we'll make it optional
const projectId = "8221face28eccac5e9f3a036f7636a20"

export const config = createConfig({
    chains: [sepolia, arbitrumSepolia],
    connectors: [
        injected(),
        metaMask(),
        // Only include WalletConnect if you have a project ID
        ...(projectId !== '8221face28eccac5e9f3a036f7636a20' ? [walletConnect({ projectId })] : []),
    ],
    transports: {
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/klloPedupe3EmhcjwvrMm'),
        [arbitrumSepolia.id]: http('https://arb-sepolia.g.alchemy.com/v2/klloPedupe3EmhcjwvrMm'),
    },
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}