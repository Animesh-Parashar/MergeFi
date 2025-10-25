import {
    NexusSDK,
    SUPPORTED_CHAINS_IDS,
    BridgeAndExecuteResult,
    BridgeAndExecuteParams,
    BridgeAndExecuteSimulationResult,
    TOKEN_METADATA
} from '@avail-project/nexus-core';
import axios from 'axios';
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
    const sourceChainId = currentChainIdDecimal;

    console.log('=== Cross-Chain NFT Minting ===');
    console.log('Source Chain:', getChainName(sourceChainId));
    console.log('Destination Chain:', getChainName(toChainId));
    console.log('Amount:', amount, 'USDC');
    console.log('Contributor:', walletAddress);
    console.log('===============================');

    console.log('\n📋 Process Overview:');
    console.log('1. Check and set USDC allowance on source chain for Nexus bridge');
    console.log('2. Execute bridge transaction (bridges USDC + mints NFT on destination)');
    console.log('You will be prompted for wallet confirmations.\n');

    // Initialize Nexus SDK
    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(ethProvider);

    const actualSourceChains = [currentChainIdDecimal];

    // STEP 1: Check current allowance on source chain
    console.log('\n🔍 Checking USDC allowance on source chain...');
    try {
        const allowances = await sdk.getAllowance(sourceChainId, ['USDC']);
        const currentAllowance = allowances.find(a => a.token === 'USDC');

        console.log('Current allowance:', currentAllowance?.allowance || '0');

        // Convert amount to BigInt (USDC has 6 decimals)
        const amountWei = parseUnits(amount, 6);

        // Check if we need to set allowance
        const needsAllowance = !currentAllowance ||
            BigInt(currentAllowance.allowance) < amountWei;

        if (needsAllowance) {
            console.log('📝 Setting USDC allowance on source chain...');
            console.log(`Approving ${amount} USDC for Nexus bridge...`);

            // Set allowance for the bridge contract on source chain
            await sdk.setAllowance(sourceChainId, ['USDC'], amountWei);

            console.log('✅ USDC allowance set successfully!');
        } else {
            console.log('✅ Sufficient allowance already exists');
        }
    } catch (allowanceError: any) {
        console.error('❌ Failed to check/set allowance:', allowanceError);
        throw new Error(`Allowance setup failed: ${allowanceError.message}`);
    }

    // STEP 2: Execute bridge and mint
    console.log('\n🌉 Executing bridge and NFT minting...');
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
        },
        waitForReceipt: true,
    } as BridgeAndExecuteParams);

    console.log('✅ Cross-chain NFT minting completed!');
    console.log('Transaction result:', bridgeAndExecuteResult);

    // STEP 3: Store transaction in database
    try {
        const txHash = bridgeAndExecuteResult.executeTransactionHash 
            // bridgeAndExecuteResult.bridgeTransactionHash ||
            // bridgeAndExecuteResult.approvalTransactionHash;
        const toChainIdDecimal = bridgeAndExecuteResult.toChainId;
        if (txHash) {
            await storeTransactionInDB(txHash, currentChainIdDecimal, toChainIdDecimal);
        } else {
            console.warn('⚠️ No transaction hash found in result');
        }
    } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
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

        // const response = await fetch('https://mergefi.onrender.com/api/transactions/saveTx', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         tx_hash: txHash,
        //         from_chain_id: fromChainId,
        //         to_chain_id: toChainId,
        //     }),
        // });
        console.log({ tx_hash: txHash,
            from_chain_id: fromChainId,
            to_chain_id: toChainId,});
        const response = await axios.post('https://mergefi.onrender.com/api/transactions/saveTx', {
            tx_hash: txHash,
            from_chain_id: fromChainId,
            to_chain_id: toChainId,
        }, {
            withCredentials: true, // Add credentials if needed
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result =  response.data;
        console.log('Response from server:', result);

        if ( result.message !== 'Transaction stored successfully') {
            throw new Error(result.error || 'Failed to store transaction');
        }

        //console.log('✅ Transaction stored in database:', result.transaction.id);
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

// Network switching helper function with user confirmation
export async function switchToNetwork(chainId: number, reason?: string): Promise<void> {
    const ethereum = window.ethereum as any;
    if (!ethereum) {
        throw new Error('MetaMask not found');
    }

    // Check if already on the correct network
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    const currentChainIdDecimal = parseInt(currentChainId, 16);

    if (currentChainIdDecimal === chainId) {
        console.log(`✅ Already on ${getChainName(chainId)}`);
        return;
    }

    const reasonText = reason ? `\n\nReason: ${reason}` : '';
    const confirmed = confirm(
        `🔄 Network Switch Required\n\n` +
        `Please switch from ${getChainName(currentChainIdDecimal)} to ${getChainName(chainId)}${reasonText}\n\n` +
        `Click OK to proceed with the network switch.`
    );

    if (!confirmed) {
        throw new Error('Network switch cancelled by user');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;
    console.log(`🔄 Switching to ${getChainName(chainId)} (${chainIdHex})...`);

    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
        });
        console.log(`✅ Successfully switched to ${getChainName(chainId)}`);
    } catch (switchError: any) {
        // If the chain is not added to MetaMask, add it
        if (switchError.code === 4902) {
            console.log(`Adding ${getChainName(chainId)} to MetaMask...`);
            const chainConfig = getChainConfig(chainId);
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [chainConfig],
            });
            console.log(`✅ Added and switched to ${getChainName(chainId)}`);
        } else if (switchError.code === 4001) {
            throw new Error('Network switch rejected by user');
        } else {
            throw new Error(`Failed to switch to ${getChainName(chainId)}: ${switchError.message}`);
        }
    }

    // Wait a bit for the switch to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify the switch was successful
    const newChainId = await ethereum.request({ method: 'eth_chainId' });
    const newChainIdDecimal = parseInt(newChainId, 16);

    if (newChainIdDecimal !== chainId) {
        throw new Error(`Network switch failed. Expected ${getChainName(chainId)}, but got ${getChainName(newChainIdDecimal)}`);
    }
}

// Get chain configuration for adding to MetaMask
function getChainConfig(chainId: number) {
    const configs: Record<number, any> = {
        11155111: {
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
        },
        11155420: {
            chainId: '0xaa37dc',
            chainName: 'Optimism Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.optimism.io'],
            blockExplorerUrls: ['https://sepolia-optimism.etherscan.io/'],
        },
        421614: {
            chainId: '0x66eee',
            chainName: 'Arbitrum Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
        },
        84532: {
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia-explorer.base.org/'],
        },
        80002: {
            chainId: '0x13882',
            chainName: 'Polygon Amoy',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
        },
        10143: {
            chainId: '0x279f',
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
        },
    };

    return configs[chainId] || {
        chainId: `0x${chainId.toString(16)}`,
        chainName: `Chain ${chainId}`,
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: [''],
        blockExplorerUrls: [''],
    };
}