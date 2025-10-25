import {
    NexusSDK,
    SUPPORTED_CHAINS_IDS,
    BridgeAndExecuteResult,
    BridgeAndExecuteParams,
    BridgeAndExecuteSimulationResult,
    TOKEN_METADATA
} from '@avail-project/nexus-core';
import { parseUnits, ethers, BrowserProvider, Contract } from 'ethers';

// Supported chain IDs for cross-chain NFT minting
export const SUPPORTED_CHAIN_IDS = {
    OPTIMISM_SEPOLIA: 11155420,
    POLYGON_AMOY: 80002,
    ARBITRUM_SEPOLIA: 421614,
    BASE_SEPOLIA: 84532,
    SEPOLIA: 11155111,
    MONAD_TESTNET: 10143,
} as const;


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
    11155420: "0x8c920A7cd5862f3c2ec8269EC1baB3071F51788C",
    //80002: "0xFd1feBA71394E0AF5F97ea6365fe86870B36c112", // Added placeholder - update with actual address
    421614: "0x673eC263392486Aa19621c4B12D90A39f0ce72d0",
    84532: "0x8c920A7cd5862f3c2ec8269EC1baB3071F51788C",
    11155111: "0xCA112fDC81d36dA813F4B6D734aCaf9F4906947b",
    //10143: "0xFd1feBA71394E0AF5F97ea6365fe86870B36c112",
};


// USDC Token Addresses on Testnets
const USDC_ADDRESSES: Record<number, string> = {
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
    11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // Optimism Sepolia
    421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",   // Arbitrum Sepolia
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",    // Base Sepolia
    80002: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97",    // Polygon Amoy
};

// ERC20 ABI for approve function
const ERC20_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;


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
 * Approve USDC spending for the contract on destination chain
 */
async function approveUSDCForContract(
    provider: any,
    contractAddress: string,
    amount: string,
    chainId: number
): Promise<string> {
    console.log('📝 Approving USDC for contract...');

    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) {
        throw new Error(`USDC address not configured for chain ${chainId}`);
    }

    const ethersProvider = new BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const userAddress = await signer.getAddress();

    const usdcContract = new Contract(usdcAddress, ERC20_ABI, signer);

    // Parse amount to wei
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    // Check current balance
    const balance = await usdcContract.balanceOf(userAddress);
    console.log('💰 USDC Balance:', ethers.formatUnits(balance, 6), 'USDC');

    if (balance < amountWei) {
        throw new Error(
            `Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)} USDC, Need: ${amount} USDC`
        );
    }

    // Check current allowance
    const currentAllowance = await usdcContract.allowance(userAddress, contractAddress);
    console.log('Current Allowance:', ethers.formatUnits(currentAllowance, 6), 'USDC');

    // If allowance is sufficient, skip approval
    if (currentAllowance >= amountWei) {
        console.log('✅ Sufficient allowance already exists');
        return 'sufficient_allowance';
    }

    // Approve the contract to spend USDC
    console.log(`Approving ${amount} USDC for contract ${contractAddress}...`);
    const approveTx = await usdcContract.approve(contractAddress, amountWei);

    console.log('⏳ Waiting for approval transaction:', approveTx.hash);
    const receipt = await approveTx.wait();

    console.log('✅ USDC approved! Transaction hash:', receipt.hash);
    return receipt.hash;
}

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
    if (!contractaddress_mapping[toChainId]) {
        throw new Error(`No contract address configured for chain ID ${toChainId}`);
    }
    if (!sourceChains || sourceChains.length === 0) {
        throw new Error('Source chains array cannot be empty');
    }

    const ethProvider = (window.ethereum as any);
    if (!ethProvider) {
        throw new Error('Ethereum provider not found. Please install MetaMask or another Web3 wallet.');
    }

    const currentChainId = await ethProvider.request({ method: 'eth_chainId' });
    const currentChainIdDecimal = parseInt(currentChainId, 16);

    console.log('=== Cross-Chain NFT Minting ===');
    console.log('Current Chain:', getChainName(currentChainIdDecimal));
    console.log('Destination Chain:', getChainName(toChainId));
    console.log('Amount:', amount, 'USDC');
    console.log('Contributor:', walletAddress);
    console.log('===============================');

    // Initialize Nexus SDK
    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    const actualSourceChains = [currentChainIdDecimal];

    // STEP 1: Manually approve USDC for the contract on destination chain
    try {
        console.log('\n🔐 Step 1: Approving USDC for contract on destination chain...');
        const approvalTxHash = await approveUSDCForContract(
            ethProvider,
            contractaddress_mapping[toChainId],
            amount,
            toChainId
        );
        console.log('Approval Transaction:', approvalTxHash);
    } catch (approvalError: any) {
        console.error('❌ USDC Approval failed:', approvalError);
        throw new Error(`Failed to approve USDC: ${approvalError.message}`);
    }

    // STEP 2: Execute bridge and contract call
    console.log('\n🌉 Step 2: Executing bridge and NFT minting...');
    const bridgeAndExecuteResult: BridgeAndExecuteResult = await sdk.bridgeAndExecute({
        token: 'USDC',
        amount: amount,
        toChainId: toChainId,
        sourceChains: actualSourceChains,
        execute: {
            contractAddress: contractaddress_mapping[toChainId],
            contractAbi: CONTRIBUTOR_NFT_ABI,
            functionName: 'mintRewardNFT',
            buildFunctionParams: (token, amt, _chainId, _userAddress) => {
                const decimals = TOKEN_METADATA[token].decimals;
                const amountWei = parseUnits(amt, decimals);

                console.log('Building function params:');
                console.log('  - Contributor:', walletAddress);
                console.log('  - Amount:', amt, 'USDC');
                console.log('  - Repo:', reponame);
                console.log('  - Name:', contributorname);

                return {
                    functionParams: [
                        walletAddress,
                        amountWei,
                        reponame,
                        contributorname,
                    ],
                };
            },
            // ✅ No tokenApproval here - we did it manually above
        },
        waitForReceipt: true,
    } as BridgeAndExecuteParams);

    console.log('✅ Cross-chain NFT minting completed!');
    console.log('Transaction result:', bridgeAndExecuteResult);

     // STEP 3: Store transaction in database
    try {
        // Extract transaction hash from result
        const txHash = bridgeAndExecuteResult.executeTransactionHash || 
                       bridgeAndExecuteResult.bridgeTransactionHash || 
                       bridgeAndExecuteResult.approvalTransactionHash;
        const toChainIdDecimal = bridgeAndExecuteResult.toChainId;
        if (txHash) {
            // Store initial transaction
            await storeTransactionInDB(txHash, currentChainIdDecimal, toChainIdDecimal);
        } else {
            console.warn('⚠️ No transaction hash found in result');
        }
    } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        // Don't throw - transaction was successful
    }

    return bridgeAndExecuteResult;
};

async function storeTransactionInDB(
    txHash: string,
    fromChainId: number,
    toChainId: number
): Promise<void> {
    try {
        console.log('💾 Storing transaction in database...');

        const response = await fetch('http://localhost:5000/api/transactions/saveTx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tx_hash: txHash,
                from_chain_id: fromChainId,
                to_chain_id: toChainId,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to store transaction');
        }

        console.log('✅ Transaction stored in database:', result.transaction.id);
    } catch (error) {
        console.error('❌ Failed to store transaction in database:', error);
        // Don't throw - transaction was successful even if DB storage failed
    }
}

export const getChainName = (chainId: number): string => {
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

export const isSupportedChain = (chainId: number): boolean => {
    return Object.values(SUPPORTED_CHAIN_IDS).includes(chainId as any);
};
