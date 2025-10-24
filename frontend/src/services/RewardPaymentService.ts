import { NexusSDK, SUPPORTED_CHAINS_IDS, NEXUS_EVENTS, ProgressStep } from '@avail-project/nexus-core';

export interface PaymentProgress {
    step: 'approval' | 'bridge' | 'completed' | 'failed';
    message: string;
    txHash?: string;
    explorerUrl?: string;
    error?: string;
}

export interface PaymentResult {
    success: boolean;
    approvalTxHash?: string;
    bridgeTxHash?: string;
    bridgeExplorerUrl?: string;
    bridgeSkipped?: boolean;
    error?: string;
    message: string;
}

export class RewardPaymentService {
    private sdk: NexusSDK;
    private provider: any = null;
    private isInitialized: boolean = false;
    private progressCallback?: (progress: PaymentProgress) => void;
    private eventUnsubscribers: (() => void)[] = [];

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
                            step: 'approval',
                            message: 'Approving USDC for bridge'
                        });
                        break;
                    case 'TS': // Transaction Submitted
                    case 'IS': // Intent Submitted
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
                    case 'IC': // Intent Confirmed
                        this.progressCallback?.({
                            step: 'bridge',
                            message: 'Bridge transaction confirmed'
                        });
                        break;
                    case 'ER': // Execute Ready/Complete
                    case 'EC': // Execute Confirmed
                        this.progressCallback?.({
                            step: 'completed',
                            message: 'USDC delivered successfully',
                            txHash: step.data && 'transactionHash' in step.data ? step.data.transactionHash as string : undefined,
                            explorerUrl: step.data && 'explorerURL' in step.data ? step.data.explorerURL as string : undefined
                        });
                        break;
                }
            }
        );

        this.eventUnsubscribers.push(
            () => this.sdk.nexusEvents.removeAllListeners(NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS),
            () => this.sdk.nexusEvents.removeAllListeners(NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS)
        );
    }

    /**
     * Get unified USDC balances across Sepolia and Arbitrum Sepolia
     */
    async getUnifiedBalances() {
        await this.ensureInitialized();

        try {
            const balances = await this.sdk.getUnifiedBalances();
            console.log('📊 All balances:', balances);
            return balances;
        } catch (error: any) {
            console.error('Failed to get balances:', error);
            throw error;
        }
    }

    /**
     * Transfer USDC cross-chain between supported networks
     * @param amount - Amount of USDC to transfer (in USDC units, e.g., "100" for 100 USDC)
     * @param recipient - Recipient address on destination chain
     * @param sourceChainId - Source chain ID (where USDC will be taken from)
     * @param destChainId - Destination chain ID (where USDC will be sent)
     */
    async transferUSDC(
        amount: string,
        recipient: string,
        sourceChainId: number,
        destChainId: number
    ): Promise<PaymentResult> {
        console.log(`🚀 Starting USDC transfer from chain ${sourceChainId} to chain ${destChainId}...`);
        console.log(`Amount: ${amount} USDC, Recipient: ${recipient}`);

        await this.ensureInitialized();

        // Validate chain IDs
        const supportedChains = [11155111, 421614];
        if (!supportedChains.includes(sourceChainId) || !supportedChains.includes(destChainId)) {
            throw new Error('Unsupported chain ID. Only Sepolia (11155111) and Arbitrum Sepolia (421614) are supported.');
        }

        if (sourceChainId === destChainId) {
            throw new Error('Source and destination chains must be different');
        }

        const getChainName = (chainId: number) => {
            return chainId === 11155111 ? 'Sepolia' : chainId === 421614 ? 'Arbitrum Sepolia' : `Chain ${chainId}`;
        };

        try {
            console.log('🌉 Transferring USDC to recipient...');
            this.progressCallback?.({
                step: 'bridge',
                message: `Initiating USDC transfer from ${getChainName(sourceChainId)} to ${getChainName(destChainId)}...`
            });

            // Transfer USDC from source chain to recipient on destination chain
            const transferResult = await this.sdk.transfer({
                token: 'USDC',
                amount: amount,
                chainId: destChainId as SUPPORTED_CHAINS_IDS,
                recipient: recipient as `0x${string}`,
                sourceChains: [sourceChainId as SUPPORTED_CHAINS_IDS],
            });

            console.log('🎉 Transfer complete!', transferResult);

            return {
                success: transferResult.success,
                bridgeTxHash: transferResult.success ? transferResult.transactionHash : undefined,
                bridgeExplorerUrl: transferResult.success ? transferResult.explorerUrl : undefined,
                message: transferResult.success
                    ? `✅ ${amount} USDC delivered successfully to ${recipient} on ${getChainName(destChainId)}`
                    : '❌ USDC transfer failed'
            };

        } catch (error: any) {
            console.error('❌ Transfer failed:', error);

            let errorMessage = 'Transfer failed';

            if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
                errorMessage = `Insufficient USDC balance on ${getChainName(sourceChainId)}`;
            } else if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Transaction rejected';
            }

            this.progressCallback?.({
                step: 'failed',
                message: errorMessage,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: errorMessage
            };
        }
    }

    cleanup() {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
        this.isInitialized = false;
    }
}