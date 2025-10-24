import { 
    mintCrossChainRewardNFT, 
    CrossChainNFTParams
} from './CrossChainNFTService';

// Simple function to call mintCrossChainRewardNFT
async function callMintCrossChainRewardNFT(
    amount: string,
    walletAddress: string,
    toChainId: number,
    sourceChains: number[],
    reponame: string,
    contributorname: string
) {
    try {
        // Configure your parameters here (use passed-in arguments, with fallbacks)
        const params: CrossChainNFTParams = { 
            amount: amount ?? '0.0001',                                       // Amount in USDC (as string)
            walletAddress: walletAddress ?? '0xF41E4fB4e7F1F6E484033c878f078A2DF57dB854', // Recipient address
            toChainId: toChainId as any,                                      // Use passed toChainId
            sourceChains: sourceChains as any,                               // Use passed sourceChains  
            reponame: reponame ?? 'Cross-Chain Reward',                      // Repo name (as string)
            contributorname: contributorname ?? 'Cross-Chain Contributor',   // Contributor name (as string)
        };


        
        console.log('🚀 Calling mintCrossChainRewardNFT...');
        console.log('Parameters:');
        console.log('- Amount:', params.amount, 'USDC');
        console.log('- Wallet Address:', params.walletAddress);
        console.log('- To Chain ID:', params.toChainId);
        console.log('- Source Chain IDs:', params.sourceChains);
        console.log('- Repo Name:', params.reponame);
        console.log('- Contributor Name:', params.contributorname);

        // Call the function
        const result = await mintCrossChainRewardNFT(params);

        console.log('✅ Success! NFT minting completed');
        console.log('Result:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Error calling mintCrossChainRewardNFT:', error);
        throw error;
    }
}

// Export the function
export { callMintCrossChainRewardNFT };


