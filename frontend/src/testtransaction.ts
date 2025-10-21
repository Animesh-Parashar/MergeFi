import { RewardPaymentService } from './services/RewardPaymentService';

// Chain constants for easy reference
export const CHAINS = {
    SEPOLIA: 11155111,
    ARBITRUM_SEPOLIA: 421614
};

/**
 * Test cross-chain payment with configurable parameters
 */
export async function testCrossChainPayment(
    amount: string = '0.0001', // Back to original amount
    sourceChain: number = CHAINS.ARBITRUM_SEPOLIA,
    destChain: number = CHAINS.SEPOLIA,
    recipient: string = '0xF41E4fB4e7F1F6E484033c878f078A2DF57dB854'
) {
    const paymentService = new RewardPaymentService();
    
    try {
        console.log('🧪 Starting test with parameters:', {
            amount,
            sourceChain,
            destChain,
            recipient
        });

        // Initialize with MetaMask
        await paymentService.initNexus(window.ethereum);
        
        // Execute cross-chain payment
        const result = await paymentService.payCrossChainPYUSD(
            amount,
            sourceChain,
            destChain,
            recipient
        );
        
        console.log('✅ Payment result:', result);
        paymentService.cleanup();
        
        return result;
        
    } catch (error) {
        console.error('❌ Payment failed:', error);
        paymentService.cleanup();
        throw error;
    }
}

/**
 * Predefined test scenarios
 */
// export const testScenarios = {
//     // Sepolia to Arbitrum Sepolia
//     sepoliaToArbitrum: () => testCrossChainPayment('0.0001', CHAINS.SEPOLIA, CHAINS.ARBITRUM_SEPOLIA),
    
//     // Arbitrum Sepolia to Sepolia  
//     arbitrumToSepolia: () => testCrossChainPayment('0.0001', CHAINS.ARBITRUM_SEPOLIA, CHAINS.SEPOLIA),
    
//     // Larger amount test
//     largeAmount: () => testCrossChainPayment('1.0', CHAINS.SEPOLIA, CHAINS.ARBITRUM_SEPOLIA),
    
//     // Custom recipient
//     customRecipient: (recipient: string) => testCrossChainPayment('0.0001', CHAINS.SEPOLIA, CHAINS.ARBITRUM_SEPOLIA, recipient)
// };

// Run test
// testCrossChainPayment();