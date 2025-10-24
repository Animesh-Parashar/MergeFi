import {
    NexusSDK,
    SUPPORTED_CHAINS_IDS,
    BridgeAndExecuteResult,
    BridgeAndExecuteParams,
    BridgeAndExecuteSimulationResult,
    TOKEN_METADATA
} from '@avail-project/nexus-core';
import { parseUnits } from 'ethers';

// Supported chain IDs for cross-chain NFT minting
export const SUPPORTED_CHAIN_IDS = {
    OPTIMISM_SEPOLIA: 11155420,
    POLYGON_AMOY: 80002,
    ARBITRUM_SEPOLIA: 421614,
    BASE_SEPOLIA: 84532,
    SEPOLIA: 11155111,
    MONAD_TESTNET: 10143,
} as const;

// Hardcoded NFT Contract Address (deployed on target chain)
// TODO: Replace with your actual deployed ContributorNFT contract address
const NFT_CONTRACT_ADDRESS = '';

// Chain names for display
export const CHAIN_NAMES: Record<number, string> = {
    11155420: 'Optimism Sepolia',
    80002: 'Polygon Amoy',
    421614: 'Arbitrum Sepolia',
    84532: 'Base Sepolia',
    11155111: 'Sepolia',
    10143: 'Monad Testnet',
};

// Contributor data structure
export interface Contributor {
    address: string;
    amount: number;
    name: string;
    chainId?: number;
}

// NFT Minting parameters
export interface NFTMintParams {
    contributors: Contributor[];
    repoName: string;
    totalAmount: string;
    toChainId: SUPPORTED_CHAINS_IDS;
    sourceChains: SUPPORTED_CHAINS_IDS[];
}

// Result from NFT minting transaction
export interface NFTMintResult {
    bridgeAndExecuteResult: BridgeAndExecuteResult;
    simulation: BridgeAndExecuteSimulationResult;
    contributorsCount: number;
}

/**
 * ContributorNFT Contract ABI (only the functions we need)
 */
const CONTRIBUTOR_NFT_ABI = [
    {
        inputs: [
            { internalType: 'address[]', name: 'contributors', type: 'address[]' },
            { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
            { internalType: 'string[]', name: 'contributorNames', type: 'string[]' },
            { internalType: 'string', name: 'repoName', type: 'string' },
        ],
        name: 'batchMintRewardNFTs',
        outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
        type: 'function' as const,
    },
] as const;

/**
 * Mint NFTs for contributors across chains using Avail Nexus SDK
 * Bridges USDC tokens and executes batch NFT minting on the target chain
 * 
 * @param params - NFT minting parameters including contributors, repo name, and chain details
 * @returns Promise with transaction result and simulation data
 */
export const mintContributorNFTsCrossChain = async (
    params: NFTMintParams
): Promise<NFTMintResult> => {
    const {
        contributors,
        repoName,
        totalAmount,
        toChainId,
        sourceChains,
    } = params;

    // Validate inputs
    if (contributors.length === 0) {
        throw new Error('No contributors provided');
    }
    if (!repoName || repoName.trim() === '') {
        throw new Error('Repository name is required');
    }

    // Log contributor wallet addresses and chain IDs for debugging
    console.log('=== Payout Modal Data ===');
    console.log('Repository:', repoName);
    console.log('Total Amount:', totalAmount);
    console.log('Target Chain ID:', toChainId);
    console.log('Contributors with Wallet Data:');
    contributors.forEach((contributor, index) => {
        console.log(`  ${index + 1}. ${contributor.name} (@${contributor.address})`);
        console.log(`     - Wallet Address: ${contributor.address}`);
        console.log(`     - Chain ID: ${contributor.chainId || 'Not specified'}`);
        console.log(`     - Payout Amount: ${contributor.amount} USDC`);
    });
    console.log('========================');

    // Get Ethereum provider from browser
    const ethProvider = (window.ethereum as any);
    if (!ethProvider) {
        throw new Error('Ethereum provider not found. Please install MetaMask or another Web3 wallet.');
    }

    // Initialize Nexus SDK
    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    // Prepare contributor data arrays for batch minting
    const contributorAddresses = contributors.map(c => c.address);
    const contributorAmounts = contributors.map(c => {
        const decimals = TOKEN_METADATA['USDC'].decimals;
        return parseUnits(c.amount.toString(), decimals);
    });
    const contributorNames = contributors.map(c => c.name);

    // Build bridge and execute parameters
    const bridgeParams: BridgeAndExecuteParams = {
        token: 'USDC',
        amount: totalAmount,
        toChainId: toChainId,
        sourceChains: sourceChains,
        execute: {
            contractAddress: NFT_CONTRACT_ADDRESS,
            contractAbi: CONTRIBUTOR_NFT_ABI,
            functionName: 'batchMintRewardNFTs',
            buildFunctionParams: () => {
                // Return the function parameters for batch minting
                return {
                    functionParams: [
                        contributorAddresses,
                        contributorAmounts,
                        contributorNames,
                        repoName,
                    ],
                };
            },
            tokenApproval: {
                token: 'USDC',
                amount: totalAmount,
            },
        },
        waitForReceipt: true,
    };

    // Simulate the transaction first
    console.log('Simulating cross-chain NFT minting...');
    const simulation: BridgeAndExecuteSimulationResult = await sdk.simulateBridgeAndExecute(bridgeParams);

    console.log('Simulation Results:');
    console.log('- Steps:', simulation.steps);
    console.log('- Total estimated cost:', simulation.totalEstimatedCost);
    console.log('- Approval required:', simulation.metadata?.approvalRequired);
    console.log('- Bridge receive amount:', simulation.metadata?.bridgeReceiveAmount);

    // Execute the bridge and mint transaction
    console.log('Executing cross-chain NFT minting...');
    const bridgeAndExecuteResult: BridgeAndExecuteResult = await sdk.bridgeAndExecute(bridgeParams);

    console.log('NFT minting transaction completed!');
    console.log('Transaction result:', bridgeAndExecuteResult);

    return {
        bridgeAndExecuteResult,
        simulation,
        contributorsCount: contributors.length,
    };
};

/**
 * Simulate NFT minting without executing the transaction
 * Useful for displaying gas estimates and validating parameters
 * 
 * @param params - NFT minting parameters
 * @returns Promise with simulation results
 */
export const simulateNFTMinting = async (
    params: NFTMintParams
): Promise<BridgeAndExecuteSimulationResult> => {
    const {
        contributors,
        repoName,
        totalAmount,
        toChainId,
        sourceChains,
    } = params;

    const ethProvider = (window.ethereum as any);
    if (!ethProvider) {
        throw new Error('Ethereum provider not found');
    }

    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    const contributorAddresses = contributors.map(c => c.address);
    const contributorAmounts = contributors.map(c => {
        const decimals = TOKEN_METADATA['USDC'].decimals;
        return parseUnits(c.amount.toString(), decimals);
    });
    const contributorNames = contributors.map(c => c.name);

    const bridgeParams: BridgeAndExecuteParams = {
        token: 'USDC',
        amount: totalAmount,
        toChainId: toChainId,
        sourceChains: sourceChains,
        execute: {
            contractAddress: NFT_CONTRACT_ADDRESS,
            contractAbi: CONTRIBUTOR_NFT_ABI,
            functionName: 'batchMintRewardNFTs',
            buildFunctionParams: () => ({
                functionParams: [
                    contributorAddresses,
                    contributorAmounts,
                    contributorNames,
                    repoName,
                ],
            }),
            tokenApproval: {
                token: 'USDC',
                amount: totalAmount,
            },
        },
        waitForReceipt: false,
    };

    return await sdk.simulateBridgeAndExecute(bridgeParams);
};

/**
 * Get chain name by chain ID
 */
export const getChainName = (chainId: number): string => {
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

/**
 * Validate if a chain ID is supported
 */
export const isSupportedChain = (chainId: number): boolean => {
    return Object.values(SUPPORTED_CHAIN_IDS).includes(chainId as any);
};
