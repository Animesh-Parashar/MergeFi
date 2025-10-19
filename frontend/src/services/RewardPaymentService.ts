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
    rpcUrls: string[];
    routerAddress: string;
    pyusdAddress: string;
    usdcAddress: string;
}

const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    11155111: {
        chainId: 11155111,
        rpcUrls: [
            'https://eth-sepolia.g.alchemy.com/v2/klloPedupe3EmhcjwvrMm',
        ],
        routerAddress: '0xB4345e4fb5c91017357284311C0E8b3C787DAeDC',
        pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
        usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    },
    421614: {
        chainId: 421614,
        rpcUrls: [
            'https://sepolia-rollup.arbitrum.io/rpc', // Official public RPC
            'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
            'https://arbitrum-sepolia-rpc.publicnode.com',
            'https://arbitrum-sepolia.gateway.tenderly.co',
            'https://arb-sepolia.g.alchemy.com/v2/G3cXmIqjdRfdYTrWB7To2', // Keep as fallback
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

    async initNexus(provider: any) {
        if (this.isInitialized) {
            console.log('SDK already initialized');
            return;
        }

        try {
            console.log('Initializing Nexus SDK...');
            this.provider = provider;

            // Get signer first
            const ethersProvider = new ethers.BrowserProvider(provider);
            this.signer = await ethersProvider.getSigner();
            console.log('Signer obtained:', await this.signer.getAddress());

            // Initialize SDK
            await this.sdk.initialize(provider);
            this.isInitialized = true;

            this.setupEventListeners();
            console.log('✅ Nexus SDK initialized successfully');
        } catch (error: any) {
            console.error('Failed to initialize Nexus SDK:', error);
            this.isInitialized = false;
            // Throw error so caller knows initialization failed
            throw new Error(`SDK initialization failed: ${error.message}`);
        }
    }

    /**
     * Ensure SDK is initialized before use
     */
    private async ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('SDK not initialized. Call initNexus first.');
        }
    }

    /**
     * Refresh signer after chain switch
     */
    private async refreshSigner() {
        if (this.provider) {
            const ethersProvider = new ethers.BrowserProvider(this.provider);
            this.signer = await ethersProvider.getSigner();
            console.log('Signer refreshed:', await this.signer.getAddress());
        }
    }

    /**
     * Set progress callback for real-time updates
     */
    setProgressCallback(callback: (progress: PaymentProgress) => void) {
        this.progressCallback = callback;
    }

    /**
     * Set up event listeners for transaction tracking
     */
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
     * Check and approve PYUSD spending if needed
     */
    private async ensurePYUSDApproval(amountWei: bigint, routerAddress: string, pyusdAddress: string): Promise<string | null> {
        if (!this.signer) throw new Error('Signer not available');

        const pyusdContract = new ethers.Contract(pyusdAddress, ERC20_ABI, this.signer);
        const userAddress = await this.signer.getAddress();

        // Check current allowance
        const currentAllowance = await pyusdContract.allowance(userAddress, routerAddress);

        if (currentAllowance < amountWei) {
            console.log('🔓 Approving PYUSD spending...');
            this.progressCallback?.({
                step: 'approval',
                message: 'Approving PYUSD spending'
            });

            // Approve the router to spend PYUSD
            const approveTx = await pyusdContract.approve(routerAddress, amountWei);
            await approveTx.wait();

            console.log('✅ PYUSD approval complete:', approveTx.hash);
            this.progressCallback?.({
                step: 'approval',
                message: 'PYUSD approval completed',
                txHash: approveTx.hash
            });

            return approveTx.hash;
        }

        return null; // No approval needed
    }

    async payCrossChainPYUSD(
        amount: string,
        destChainId: number,
        recipient: string
    ): Promise<PaymentResult> {
        console.log('🚀 Starting cross-chain payment...');
        console.log('Amount:', amount, 'PYUSD');
        console.log('Destination Chain:', destChainId);
        console.log('Recipient:', recipient);

        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        await this.ensureInitialized();

        const srcConfig = CHAIN_CONFIGS[11155111];
        const destConfig = CHAIN_CONFIGS[destChainId];

        if (!destConfig) {
            throw new Error(`Unsupported destination chain: ${destChainId}`);
        }

        const amountWei = ethers.parseUnits(amount, 6);
        let approvalTxHash: string | undefined;

        try {
            await this.refreshSigner();
            const routerSrc = new ethers.Contract(srcConfig.routerAddress, ROUTER_ABI, this.signer);

            // Step 0: Ensure PYUSD approval
            const approvalHash = await this.ensurePYUSDApproval(
                amountWei,
                srcConfig.routerAddress,
                srcConfig.pyusdAddress
            );

            if (approvalHash) {
                approvalTxHash = approvalHash;
            }

            console.log('💰 Step 1/3: Swapping PYUSD → USDC on source chain...');
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

            console.log('🌉 Step 2/3: Bridging USDC via Avail Nexus...');
            this.progressCallback?.({
                step: 'bridge',
                message: 'Initiating bridge transaction...'
            });

            // Increased delay
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Bridge with retry logic
            let bridgeResult;
            let retries = 0;
            const maxRetries = 3;

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
                            // tokenApproval: {
                            //     token: 'USDC',
                            //     amount
                            // }
                        }
                    });
                    break;
                } catch (error: any) {
                    retries++;
                    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
                        if (retries < maxRetries) {
                            const delay = 3000 * retries;
                            console.log(`Rate limited, retrying in ${delay / 1000}s... (${retries}/${maxRetries})`);
                            this.progressCallback?.({
                                step: 'bridge',
                                message: `Network congested, retrying in ${delay / 1000}s... (${retries}/${maxRetries})`
                            });
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            throw new Error('Network is congested. Please try again in a few minutes.');
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

    /**
     * Clean up event listeners
     */
    cleanup() {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
    }
}