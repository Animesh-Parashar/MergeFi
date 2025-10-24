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

const contractaddress_mapping: Record<number, string> = {
    11155420: "0xFd1feBA71394E0AF5F97ea6365fe86870B36c112",
    80002: '0x',
    421614: "0x317Dfb49E7a0864536102E5644b60297854a2AF7",
    84532: "0xFd1feBA71394E0AF5F97ea6365fe86870B36c112",
    11155111: "0x5627f1EdD6332f321B0a8B7e5D62C2A903B02FC5",
    10143: "0xFd1feBA71394E0AF5F97ea6365fe86870B36c112",
};

/**
 * ContributorNFT Contract ABI (only the functions we need)
 */
const CONTRIBUTOR_NFT_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'contributor', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'string', name: 'repoName', type: 'string' },
            { internalType: 'string', name: 'contributorName', type: 'string' },
        ],
        name: 'mintRewardNFT',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function' as const,
    },
] as const;

/**
 * Mint NFTs for contributors across chains using Avail Nexus SDK
 * Uses individual mintRewardNFT calls for each contributor
 * 
 * @param params - NFT minting parameters including contributors, repo name, and chain details
 * @returns Promise with transaction result and simulation data
 */

// Cross-chain NFT minting parameters
export interface CrossChainNFTParams {
    amount: string;
    walletAddress: string;
    toChainId: SUPPORTED_CHAINS_IDS;
    sourceChains: SUPPORTED_CHAINS_IDS[];
    reponame: string;
    contributorname: string;
}

/**
 * Mint cross-chain reward NFT with source/destination chain info
 * 
 * @param params - Cross-chain NFT minting parameters
 * @returns Promise with transaction result
 */
export const mintCrossChainRewardNFT = async (
    params: CrossChainNFTParams
): Promise<BridgeAndExecuteResult> => {
    const {
        amount,
        walletAddress,
        toChainId,
        sourceChains,
        reponame,
        contributorname,
    } = params;

    // Validate inputs
    if (!walletAddress || walletAddress.trim() === '') {
        throw new Error('Wallet address is required');
    }
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    // Get chain names from chain IDs
    const sourceChain = getChainName(sourceChains[0]);
    const destinationChain = getChainName(toChainId);

    console.log('=== Cross-Chain NFT Minting ===');
    console.log('Source Chain:', sourceChain);
    console.log('Destination Chain:', destinationChain);
    console.log('Amount:', amount, 'USDC');
    console.log('Wallet Address:', walletAddress);
    console.log('Target Chain ID:', toChainId);
    console.log('===============================');

    // Get Ethereum provider from browser
    const ethProvider = (window.ethereum as any);
    if (!ethProvider) {
        throw new Error('Ethereum provider not found. Please install MetaMask or another Web3 wallet.');
    }

    // Initialize Nexus SDK
    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    const amountWei = parseUnits(amount, TOKEN_METADATA['USDC'].decimals);

    // Build bridge and execute parameters for cross-chain minting
    const bridgeParams: BridgeAndExecuteParams = {
        token: 'USDC',
        amount: amount,
        toChainId: toChainId,
        sourceChains: sourceChains,
        execute: {
            contractAddress: contractaddress_mapping[toChainId],
            contractAbi: CONTRIBUTOR_NFT_ABI,
            functionName: 'mintRewardNFT',
            buildFunctionParams: () => {
                return {
                    functionParams: [
                        walletAddress,                              // contributor (address)
                        amountWei,                                  // amount (uint256)
                       reponame,         // repoName (string)
                        contributorname,      // contributorName (string)
                    ],
                };
            },
            tokenApproval: {
                token: 'USDC',
                amount: amount,
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

    // Execute the bridge and mint transaction
    console.log('Executing cross-chain NFT minting...');
    const bridgeAndExecuteResult: BridgeAndExecuteResult = await sdk.bridgeAndExecute(bridgeParams);

    console.log('Cross-chain NFT minting completed!');
    console.log('Transaction result:', bridgeAndExecuteResult);

    return bridgeAndExecuteResult;
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
        toChainId,
        sourceChains,
    } = params;

    const ethProvider = (window.ethereum as any);
    if (!ethProvider) {
        throw new Error('Ethereum provider not found');
    }

    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    // Simulate for the first contributor as a representative example
    const firstContributor = contributors[0];
    const contributorAmount = parseUnits(firstContributor.amount.toString(), TOKEN_METADATA['USDC'].decimals);

    const bridgeParams: BridgeAndExecuteParams = {
        token: 'USDC',
        amount: firstContributor.amount.toString(),
        toChainId: toChainId,
        sourceChains: sourceChains,
        execute: {
            contractAddress: NFT_CONTRACT_ADDRESS,
            contractAbi: CONTRIBUTOR_NFT_ABI,
            functionName: 'mintRewardNFT',
            buildFunctionParams: () => ({
                functionParams: [
                    firstContributor.address,
                    contributorAmount,
                    repoName,
                    firstContributor.name,
                ],
            }),
            tokenApproval: {
                token: 'USDC',
                amount: firstContributor.amount.toString(),
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
