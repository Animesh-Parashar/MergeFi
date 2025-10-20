import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useSwitchChain } from 'wagmi';
import { RewardPaymentService, PaymentProgress, PaymentResult } from '../services/RewardPaymentService';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';
import { useWalletStore } from '../store/walletStore';

interface CrossChainPaymentProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: string;
    suggestedAmount?: number;
    transactionId?: string;
    onPaymentComplete?: (result: PaymentResult) => void;
}

const SUPPORTED_CHAINS = [
    { id: 11155111, name: 'Ethereum Sepolia', icon: '⚡', color: 'blue' },
    { id: 421614, name: 'Arbitrum Sepolia', icon: '🔷', color: 'orange' },
] as const;

const PROGRESS_STEPS = [
    { key: 'approval', label: 'Approve PYUSD', description: 'Approving token spending' },
    { key: 'swap', label: 'Swap PYUSD → USDC', description: 'Converting tokens on source chain' },
    { key: 'bridge', label: 'Bridge USDC', description: 'Transferring across chains' },
    { key: 'execute', label: 'Execute Swap', description: 'Converting USDC → PYUSD on destination' },
    { key: 'completed', label: 'Completed', description: 'Payment successful' }
];

export function CrossChainPayment({
    isOpen,
    onClose,
    recipient,
    suggestedAmount = 0,
    onPaymentComplete
}: CrossChainPaymentProps) {
    const [amount, setAmount] = useState(suggestedAmount.toString());
    const [destChain, setDestChain] = useState(421614);
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [currentProgress, setCurrentProgress] = useState<PaymentProgress | null>(null);
    const [paymentService, setPaymentService] = useState<RewardPaymentService | null>(null);
    const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const { isConnected, chainId } = useWalletStore();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (paymentService) {
                paymentService.cleanup();
            }
        };
    }, [paymentService]);

    // Initialize service only when modal opens and wallet is connected
    const initializePaymentService = async () => {
        if (paymentService) {
            console.log('Service already initialized');
            return paymentService;
        }

        if (!window.ethereum) {
            throw new Error('No Ethereum provider found');
        }

        if (!isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log('Creating new payment service...');
            const service = new RewardPaymentService();

            console.log('Initializing Nexus (without connection prompt)...');
            await service.initNexus(); // No provider parameter needed

            service.setProgressCallback(setCurrentProgress);
            setPaymentService(service);

            console.log('✅ Payment service initialized');
            return service;
        } catch (error: any) {
            console.error('Failed to initialize payment service:', error);
            throw new Error(`Failed to initialize: ${error.message}`);
        }
    };

    const getCurrentStepIndex = () => {
        if (!currentProgress) return -1;
        return PROGRESS_STEPS.findIndex(step => step.key === currentProgress.step);
    };

    const handlePay = async () => {
        console.log('=== PAY BUTTON CLICKED ===');
        console.log('Amount:', amount);
        console.log('Connected:', isConnected);
        console.log('Current Chain ID:', chainId);
        console.log('Destination Chain:', destChain);

        if (!amount || parseFloat(amount) <= 0) {
            console.error('Invalid amount');
            return;
        }

        if (!isConnected || !chainId) {
            console.error('Wallet not connected');
            alert('Please connect your wallet first');
            return;
        }

        if (isPaymentInitiated) {
            console.error('Payment already in progress');
            return;
        }

        // Validate source chain
        if (chainId !== 11155111 && chainId !== 421614) {
            alert('Please switch to either Ethereum Sepolia or Arbitrum Sepolia');
            return;
        }

        // Validate destination chain
        if (chainId === destChain) {
            alert('Source and destination chains cannot be the same');
            return;
        }

        setIsPaymentInitiated(true);
        setLoading(true);
        setCurrentProgress(null);
        setPaymentResult(null);

        try {
            console.log('Step 1: Initializing payment service...');
            const service = await initializePaymentService();

            if (!service) {
                throw new Error('Failed to initialize payment service');
            }

            console.log('Step 2: Initiating payment...');
            setCurrentProgress({
                step: 'approval',
                message: 'Starting cross-chain payment...'
            });

            // Pass current chainId as source
            const result = await service.payCrossChainPYUSD(
                amount,
                destChain,
                recipient,
                chainId // Pass source chain ID
            );

            console.log('Payment completed:', result);
            setPaymentResult(result);
            onPaymentComplete?.(result);

        } catch (error: any) {
            console.error('Payment error:', error);

            // Handle rate limiting
            if (error.message?.includes('rate limited') || error.message?.includes('429')) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);

                if (newRetryCount < 3) {
                    console.log(`Retrying... (${newRetryCount}/3)`);
                    setCurrentProgress({
                        step: 'bridge',
                        message: `Retrying in ${2 * newRetryCount}s... (${newRetryCount}/3)`
                    });

                    setTimeout(() => {
                        setIsPaymentInitiated(false);
                        handlePay();
                    }, 2000 * newRetryCount);
                    return;
                }
            }

            const errorResult: PaymentResult = {
                success: false,
                error: error.message || 'Payment failed',
                message: error.message?.includes('rate limited')
                    ? 'Network is congested. Please try again in a few minutes.'
                    : error.message || 'Cross-chain payment failed'
            };

            setCurrentProgress({
                step: 'failed',
                message: errorResult.message,
                error: error.message
            });

            setPaymentResult(errorResult);
        } finally {
            setLoading(false);
            setIsPaymentInitiated(false);
            setRetryCount(0);
        }
    };

    const resetForm = () => {
        setAmount(suggestedAmount.toString());
        setDestChain(421614);
        setPaymentResult(null);
        setCurrentProgress(null);
        setLoading(false);
        setIsPaymentInitiated(false);
        setRetryCount(0);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    useEffect(() => {
        if (suggestedAmount > 0) {
            setAmount(suggestedAmount.toString());
        }
    }, [suggestedAmount]);

    const getCurrentChain = () => {
        return SUPPORTED_CHAINS.find(c => c.id === chainId);
    };

    const getDestChain = () => {
        return SUPPORTED_CHAINS.find(c => c.id === destChain);
    };

    // Auto-switch destination when source changes
    useEffect(() => {
        if (chainId === destChain) {
            const otherChain = SUPPORTED_CHAINS.find(c => c.id !== chainId);
            if (otherChain) {
                setDestChain(otherChain.id);
            }
        }
    }, [chainId, destChain]);

    const handleSwitchChain = async (targetChainId: number) => {
        try {
            console.log('Switching to chain:', targetChainId);
            await switchChain({ chainId: targetChainId as 11155111 | 421614 });
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to switch chain:', error);
        }
    };

    const currentChain = getCurrentChain();
    const destinationChain = getDestChain();

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cross-Chain PYUSD Payment">
            <div className="space-y-6">
                {!loading && !paymentResult ? (
                    <>
                        {/* Important Notice - Updated */}
                        <Card className="bg-yellow-900/20 border-yellow-600">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-black text-sm font-bold">!</span>
                                </div>
                                <div>
                                    <div className="text-yellow-400 font-medium text-sm mb-1">Payment Process</div>
                                    <div className="text-yellow-200 text-xs">
                                        Payments work in both directions: Sepolia ↔ Arbitrum Sepolia.
                                        Make sure you're on the correct source network.
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Current Network Display */}
                        <Card className="bg-gray-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${chainId === 11155111 ? 'bg-blue-500' :
                                        chainId === 421614 ? 'bg-orange-500' : 'bg-gray-500'
                                        }`}></div>
                                    <div>
                                        <div className="text-sm text-gray-400">Connected Network</div>
                                        <div className="text-white font-mono">
                                            {currentChain ? `${currentChain.icon} ${currentChain.name}` : `Chain ${chainId}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Network Switch Buttons */}
                                <div className="flex items-center gap-2">
                                    {SUPPORTED_CHAINS.map((chain) => (
                                        <Button
                                            key={chain.id}
                                            size="sm"
                                            variant={chainId === chain.id ? "secondary" : "outline"}
                                            onClick={() => handleSwitchChain(chain.id)}
                                            disabled={isSwitching || chainId === chain.id}
                                            className="flex items-center gap-2"
                                        >
                                            {isSwitching ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <span>{chain.icon}</span>
                                            )}
                                            <span className="hidden sm:inline">{chain.name.replace(' Sepolia', '')}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Payment Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Recipient</label>
                                <div className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded font-mono text-sm break-all">
                                    {recipient}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Amount (PYUSD)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="100"
                                    className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Destination Chain</label>
                                <select
                                    value={destChain}
                                    onChange={(e) => setDestChain(Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
                                    disabled={loading}
                                >
                                    {SUPPORTED_CHAINS.filter(c => c.id !== chainId).map((chain) => (
                                        <option key={chain.id} value={chain.id}>
                                            {chain.icon} {chain.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cross-chain route indicator - Updated */}
                            <Card className="bg-gray-900/50">
                                <div className="flex items-center gap-3">
                                    <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                                    <div className="text-sm text-gray-400">
                                        <span className={chainId === 11155111 ? "text-blue-400" : "text-orange-400"}>
                                            {currentChain?.name || `Chain ${chainId}`}
                                        </span>
                                        {' → '}
                                        <span className={destChain === 11155111 ? "text-blue-400" : "text-orange-400"}>
                                            {destinationChain?.name || `Chain ${destChain}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Payment will be processed via Avail Nexus cross-chain bridge
                                </div>
                            </Card>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePay}
                                disabled={!amount || parseFloat(amount) <= 0 || !isConnected || isPaymentInitiated || isSwitching || loading || chainId === destChain}
                                className="flex-1"
                            >
                                {isPaymentInitiated || loading ? 'Processing...' : `Pay ${amount} PYUSD`}
                            </Button>
                        </div>
                    </>
                ) : loading ? (
                    /* Progress Tracking */
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
                            <p className="text-gray-400">Please wait while we process your cross-chain payment</p>
                            <div className="text-sm text-gray-500 mt-2">
                                <span className={chainId === 11155111 ? "text-blue-400" : "text-orange-400"}>
                                    {currentChain?.name || `Chain ${chainId}`}
                                </span>
                                {' → '}
                                <span className={destChain === 11155111 ? "text-blue-400" : "text-orange-400"}>
                                    {destinationChain?.name || `Chain ${destChain}`}
                                </span>
                            </div>
                            {retryCount > 0 && (
                                <div className="text-xs text-yellow-400 mt-2">
                                    Retrying due to network congestion... (attempt {retryCount}/3)
                                </div>
                            )}
                        </div>

                        {/* Progress Steps */}
                        <div className="space-y-4">
                            {PROGRESS_STEPS.map((step, index) => {
                                const currentIndex = getCurrentStepIndex();
                                const isActive = index === currentIndex;
                                const isCompleted = index < currentIndex;
                                const isFailed = currentProgress?.step === 'failed' && index === currentIndex;

                                return (
                                    <motion.div
                                        key={step.key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center gap-4 p-4 rounded-lg border ${isActive
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : isCompleted
                                                ? 'border-green-500 bg-green-500/10'
                                                : isFailed
                                                    ? 'border-red-500 bg-red-500/10'
                                                    : 'border-gray-700 bg-gray-900/50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isActive
                                                ? 'bg-blue-500 text-white'
                                                : isFailed
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : isActive ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : isFailed ? (
                                                <XCircle className="w-5 h-5" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className={`font-medium ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-gray-400'
                                                }`}>
                                                {step.label}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {isActive && currentProgress?.message ? currentProgress.message : step.description}
                                            </div>

                                            {/* Show transaction links */}
                                            {currentProgress?.txHash && isActive && currentProgress?.explorerUrl && (
                                                <div className="mt-2">
                                                    <a
                                                        href={currentProgress.explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View Transaction
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Current Progress Message */}
                        <AnimatePresence>
                            {currentProgress && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center p-4 bg-gray-900/50 rounded-lg"
                                >
                                    <p className="text-sm text-gray-400">{currentProgress.message}</p>
                                    {currentProgress.error && (
                                        <p className="text-sm text-red-400 mt-1">{currentProgress.error}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Payment Result */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        {paymentResult?.success ? (
                            <>
                                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                                <h3 className="text-xl font-bold text-green-400">Payment Completed!</h3>
                                <p className="text-gray-400">{paymentResult.message}</p>

                                {/* Transaction Links */}
                                <div className="space-y-2">
                                    {paymentResult.executeExplorerUrl && (
                                        <a
                                            href={paymentResult.executeExplorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View Final Transaction
                                        </a>
                                    )}
                                    {paymentResult.bridgeExplorerUrl && (
                                        <div>
                                            <a
                                                href={paymentResult.bridgeExplorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View Bridge Transaction
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                                <h3 className="text-xl font-bold text-red-400">Payment Failed</h3>
                                <p className="text-gray-400">{paymentResult?.message}</p>
                                {paymentResult?.error && (
                                    <p className="text-sm text-red-400 font-mono bg-red-900/20 p-2 rounded">
                                        {paymentResult.error}
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Close
                            </Button>
                            {!paymentResult?.success && (
                                <Button onClick={resetForm} className="flex-1">
                                    Try Again
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </Modal>
    );
}