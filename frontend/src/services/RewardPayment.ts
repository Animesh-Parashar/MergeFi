import { NexusSDK, SUPPORTED_CHAINS_IDS, NEXUS_EVENTS, ProgressStep } from '@avail-project/nexus-core';
import { ethers } from 'ethers';

const ROUTER_ABI = [
    {
        "type": "function",
        "name": "swapForBridge",
        "inputs": [{ "name": "pyusdAmt", "type": "uint256" }],
        "outputs": [{ "name": "usdcAmt", "type": "uint256" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "swapFromBridge",
        "inputs": [
            { "name": "usdcAmt", "type": "uint256" },
            { "name": "recipient", "type": "address" }
        ],
        "outputs": [{ "name": "pyusdAmt", "type": "uint256" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getBalances",
        "inputs": [],
        "outputs": [
            { "name": "pyusdBalance", "type": "uint256" },
            { "name": "usdcBalance", "type": "uint256" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "addLiquidity",
        "inputs": [
            { "name": "pyusdAmount", "type": "uint256" },
            { "name": "usdcAmount", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;

// Add ERC20 ABI for token approvals
const ERC20_ABI = [
    {
        "type": "function",
        "name": "approve",
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "allowance",
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    }
] as const;

interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrls: string[];
    routerAddress: string;
    pyusdAddress: string;
    usdcAddress: string;
}

const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    11155111: {
        chainId: 11155111,
        name: 'Sepolia',
        rpcUrls: [
            'https://eth-sepolia.g.alchemy.com/v2/klloPedupe3EmhcjwvrMm',
        ],
        routerAddress: '0xB4345e4fb5c91017357284311C0E8b3C787DAeDC',
        pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
        usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    },
    421614: {
        chainId: 421614,
        name: 'Arbitrum Sepolia',
        rpcUrls: [
            'https://arb-sepolia.g.alchemy.com/v2/G3cXmIqjdRfdYTrWB7To2',
            'https://arb-sepolia.g.alchemy.com/v2/klloPedupe3EmhcjwvrMm'
        ],
        routerAddress: '0x109c3870587220F9dee003B7089E3cb33218D8FB',
        pyusdAddress: '0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1',
        usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
    }
};

export interface PaymentProgress {
    step: 'approval' | 'swap' | 'bridge' | 'execute' | 'completed' | 'failed';
    message: string;
    txHash?: string;
    explorerUrl?: string;
    error?: string;
}

export interface PaymentResult {
    success: boolean;
    approvalTxHash?: string;
    swapTxHash?: string;
    executeTxHash?: string;
    executeExplorerUrl?: string;
    bridgeTxHash?: string;
    bridgeExplorerUrl?: string;
    bridgeSkipped?: boolean;
    error?: string;
    message: string;
}

export class RewardPaymentService {
    private sdk: NexusSDK;
    private signer: ethers.Signer | null = null;
    private eventUnsubscribers: (() => void)[] = [];
    private progressCallback?: (progress: PaymentProgress) => void;
    private provider: any = null;
    private isInitialized: boolean = false;

    constructor() {
        this.sdk = new NexusSDK({ network: 'testnet' });
    }

    async initNexus() {
        if (this.isInitialized) {
            console.log('SDK already initialized');
            return;
        }

        try {
            console.log('Initializing Nexus SDK...');

            if (!window.ethereum) {
                throw new Error('No Ethereum provider found');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('Wallet not connected');
            }

            this.provider = window.ethereum;
            const ethersProvider = new ethers.BrowserProvider(this.provider);
            this.signer = await ethersProvider.getSigner();
            console.log('Signer obtained:', await this.signer.getAddress());

            await this.sdk.initialize(this.provider);
            this.isInitialized = true;

            this.setupEventListeners();
            console.log('✅ Nexus SDK initialized successfully');
        } catch (error: any) {
            console.error('Failed to initialize Nexus SDK:', error);
            this.isInitialized = false;
            throw new Error(`SDK initialization failed: ${error.message}`);
        }
    }

    private async ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('SDK not initialized. Call initNexus first.');
        }
    }

    private async refreshSigner() {
        if (this.provider) {
            const ethersProvider = new ethers.BrowserProvider(this.provider);
            this.signer = await ethersProvider.getSigner();
            console.log('Signer refreshed:', await this.signer.getAddress());
        }
    }

    setProgressCallback(callback: (progress: PaymentProgress) => void) {
        this.progressCallback = callback;
    }

    private setupEventListeners() {
        // Listen for expected steps
        this.sdk.nexusEvents.on(
            NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS,
            (steps: ProgressStep[]) => {
                console.log('🔄 Expected steps:', steps.map(s => s.typeID));
                this.progressCallback?.({
                    step: 'bridge',
                    message: `Bridge process started with ${steps.length} steps`
                });
            }
        );

        // Listen for completed steps
        this.sdk.nexusEvents.on(
            NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS,
            (step: ProgressStep) => {
                console.log('✅ Completed step:', step.typeID);

                switch (step.typeID) {
                    case 'AP': // Approval
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Token approval for bridge'
                        });
                        break;
                    case 'TS': // Transaction Submitted
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Bridge transaction submitted',
                            txHash: step.data && 'transactionHash' in step.data ? step.data.transactionHash as string : undefined,
                            explorerUrl: step.data && 'explorerURL' in step.data ? step.data.explorerURL as string : undefined
                        });
                        break;
                    case 'RR': // Relayer Received
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Transaction received by relayer'
                        });
                        break;
                    case 'CN': // Confirmed
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Bridge transaction confirmed'
                        });
                        break;
                    case 'EX': // Execute Started
                        this.progressCallback?.({
                            step: 'execute',
                            message: 'Executing swap on destination chain'
                        });
                        break;
                    case 'ER': // Execute Ready/Complete
                        this.progressCallback?.({
                            step: 'completed',
                            message: 'Cross-chain payment completed successfully'
                        });
                        break;
                    case 'IS': // Intent Submitted
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Bridge transaction submitted',
                            txHash: step.data && 'transactionHash' in step.data ? step.data.transactionHash as string : undefined,
                            explorerUrl: step.data && 'explorerURL' in step.data ? step.data.explorerURL as string : undefined
                        });
                        break;
                    case 'IC': // Intent Confirmed
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Bridge transaction confirmed'
                        });
                        break;
                    case 'ES': // Execute Submitted
                        this.progressCallback?.({
                            step: 'execute',
                            message: 'Executing swap on destination chain',
                            txHash: step.data && 'transactionHash' in step.data ? step.data.transactionHash as string : undefined,
                            explorerUrl: step.data && 'explorerURL' in step.data ? step.data.explorerURL as string : undefined
                        });
                        break;
                    case 'EC': // Execute Confirmed
                        this.progressCallback?.({
                            step: 'completed',
                            message: 'Cross-chain payment completed successfully',
                            txHash: step.data && 'transactionHash' in step.data ? step.data.transactionHash as string : undefined,
                            explorerUrl: step.data && 'explorerURL' in step.data ? step.data.explorerURL as string : undefined
                        });
                        break;
                }
            }
        );

        // Store cleanup functions
        this.eventUnsubscribers.push(
            () => this.sdk.nexusEvents.removeAllListeners(NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS),
            () => this.sdk.nexusEvents.removeAllListeners(NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS)
        );
    }

    /**
     * Creates a resilient provider that falls back to other RPCs in case of failure or rate limiting.
     */
    private getFallbackProvider(chainId: number): ethers.FallbackProvider {
        const config = CHAIN_CONFIGS[chainId];
        if (!config || !config.rpcUrls || config.rpcUrls.length === 0) {
            throw new Error(`No RPC URLs configured for chainId: ${chainId}`);
        }

        // Create a configuration for each RPC URL
        const providerConfigs = config.rpcUrls.map((url, index) => ({
            provider: new ethers.JsonRpcProvider(url),
            priority: index,
            stallTimeout: 2000,
        }));

        return new ethers.FallbackProvider(providerConfigs);
    }

    /**
     * Check and approve token spending if needed.
     * CORRECTED: Accepts a provider for reads and a signer for writes.
     */
    private async ensureTokenApproval(
        tokenAddress: string,
        spenderAddress: string,
        amountWei: bigint,
        tokenSymbol: string,
        provider: ethers.Provider, // For resilient read operations
        signer: ethers.Signer      // For write transactions
    ): Promise<string | null> {
        if (!signer || !provider) throw new Error('Signer or Provider not available');

        console.log(`🔍 Checking ${tokenSymbol} approval...`);

        try {
            const userAddress = await signer.getAddress();

            // Use the FallbackProvider for read-only calls to avoid rate limits
            const readOnlyContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const currentAllowance = await readOnlyContract.allowance(userAddress, spenderAddress);

            if (currentAllowance < amountWei) {
                console.log(`🔓 Approving ${tokenSymbol} spending...`);
                this.progressCallback?.({
                    step: 'approval',
                    message: `Approving ${tokenSymbol} spending`
                });

                // Use the signer for the write transaction
                const writeContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
                const approveTx = await writeContract.approve(spenderAddress, amountWei);
                await approveTx.wait();

                console.log(`✅ ${tokenSymbol} approval complete:`, approveTx.hash);
                this.progressCallback?.({
                    step: 'approval',
                    message: `${tokenSymbol} approval completed`,
                    txHash: approveTx.hash
                });

                return approveTx.hash;
            }

            console.log(`✅ ${tokenSymbol} already approved`);
            return null;

        } catch (error: any) {
            console.error(`❌ Token approval process failed for ${tokenSymbol}:`, error);
            throw error;
        }
    }

    private getSourceChainConfig(currentChainId: number): ChainConfig {
        const config = CHAIN_CONFIGS[currentChainId];
        if (!config) {
            throw new Error(`Unsupported source chain: ${currentChainId}`);
        }
        return config;
    }

    async payCrossChainPYUSD(
        amount: string,
        destChainId: number,
        recipient: string,
        sourceChainId: number
    ): Promise<PaymentResult> {
        console.log('🚀 Starting cross-chain payment...');
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        await this.ensureInitialized();

        const srcConfig = this.getSourceChainConfig(sourceChainId);
        const destConfig = CHAIN_CONFIGS[destChainId];
        if (!destConfig) {
            throw new Error(`Unsupported destination chain: ${destChainId}`);
        }

        const amountWei = ethers.parseUnits(amount, 6);
        let approvalTxHash: string | undefined;

        try {
            await this.refreshSigner();
            const signer = this.signer!;

            // CORRECTED LOGIC: Separate Provider and Signer
            // 1. Create the FallbackProvider for resilient read calls
            const sourceProvider = this.getFallbackProvider(sourceChainId);

            // 2. The main contract for sending transactions uses the original signer
            const routerSrc = new ethers.Contract(srcConfig.routerAddress, ROUTER_ABI, signer);

            // Step 0: Ensure PYUSD approval on source chain
            const approvalHash = await this.ensureTokenApproval(
                srcConfig.pyusdAddress,
                srcConfig.routerAddress,
                amountWei,
                'PYUSD',
                sourceProvider, // Pass the FallbackProvider for reading allowance
                signer          // Pass the signer for sending the approval tx
            );

            if (approvalHash) {
                approvalTxHash = approvalHash;
            }

            console.log('💰 Step 1/4: Swapping PYUSD → USDC on source chain...');
            this.progressCallback?.({
                step: 'swap',
                message: 'Swapping PYUSD to USDC on source chain'
            });

            const swapTx = await routerSrc.swapForBridge(amountWei);
            const swapReceipt = await swapTx.wait();

            console.log('✅ Swap complete:', swapTx.hash);
            console.log('Swap receipt:', swapReceipt);
            this.progressCallback?.({
                step: 'swap',
                message: 'Swap completed successfully',
                txHash: swapTx.hash
            });

            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log('🌉 Step 2/4: Bridging USDC via Avail Nexus...');
            this.progressCallback?.({
                step: 'bridge',
                message: 'Initiating bridge transaction...'
            });

            // Bridge with retry logic
            let bridgeResult;
            let retries = 0;
            const maxRetries = 5;

            while (retries < maxRetries) {
                try {
                    bridgeResult = await this.sdk.bridgeAndExecute({
                        token: 'USDC',
                        amount: amount,
                        toChainId: destChainId as SUPPORTED_CHAINS_IDS,
                        execute: {
                            contractAddress: destConfig.routerAddress,
                            contractAbi: ROUTER_ABI,
                            functionName: 'swapFromBridge',
                            buildFunctionParams: () => ({
                                functionParams: [amountWei, recipient]
                            }),
                        }
                    });
                    break;
                } catch (error: any) {
                    retries++;

                    const isRateLimited = error.message?.includes('rate limit') ||
                        error.message?.includes('429') ||
                        error.message?.includes('too many requests');

                    const isApprovalError = error.message?.toLowerCase().includes('approval') ||
                        error.message?.toLowerCase().includes('allowance');

                    console.error(`Attempt ${retries}/${maxRetries} failed:`, error.message);

                    if (isRateLimited || isApprovalError) {
                        if (retries < maxRetries) {
                            const delay = 10000 * Math.pow(2, retries - 1);
                            console.log(`${isApprovalError ? 'Handling approval' : 'Network congested'}, retrying in ${delay / 1000}s... (${retries}/${maxRetries})`);

                            this.progressCallback?.({
                                step: 'bridge',
                                message: `${isApprovalError ? 'Handling approval' : 'Network congested'}, waiting ${delay / 1000}s... (${retries}/${maxRetries})`
                            });

                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            throw new Error('Network is heavily congested. Please try again in a few minutes.');
                        }
                    } else {
                        throw error;
                    }
                }
            }

            if (!bridgeResult) {
                throw new Error('Bridge operation failed after retries');
            }

            console.log('🎉 Bridge result:', bridgeResult);

            return {
                success: bridgeResult.success,
                approvalTxHash,
                swapTxHash: swapTx.hash,
                executeTxHash: bridgeResult.executeTransactionHash,
                executeExplorerUrl: bridgeResult.executeExplorerUrl,
                bridgeTxHash: bridgeResult.bridgeTransactionHash,
                bridgeExplorerUrl: bridgeResult.bridgeExplorerUrl,
                bridgeSkipped: bridgeResult.bridgeSkipped,
                message: bridgeResult.success
                    ? 'Cross-chain PYUSD payment completed successfully'
                    : 'Cross-chain PYUSD payment failed'
            };

        } catch (error: any) {
            console.error('❌ Cross-chain payment failed:', error);

            let errorMessage = 'Cross-chain payment failed';
            if (error.message?.includes('user rejected')) {
                errorMessage = 'Transaction was rejected by user';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction';
            } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
                errorMessage = 'Network is congested. Please try again in a few minutes.';
            } else if (error.message?.toLowerCase().includes('approval')) {
                errorMessage = 'Token approval failed. Please try again.';
            } else if (error.message?.includes('network')) {
                errorMessage = 'Network error occurred during transaction';
            }

            this.progressCallback?.({
                step: 'failed',
                message: errorMessage,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: errorMessage,
                approvalTxHash
            };
        }
    }

    cleanup() {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
    }
}