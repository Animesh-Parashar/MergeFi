import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface Contributor {
    id: number;
    login: string;
    name: string;
    avatar_url: string;
    contributions: number;
    weight?: number;
    walletAddress?: string;
    chainId?: number;
}

interface Repository {
    id: number;
    name: string;
    poolAmount?: number;
}

interface PayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRepo: Repository | null;
    contributors: Contributor[];
    fundAmount: string;
    error: string | null;
    onFundAmountChange: (amount: string) => void;
    onWeightChange: (contributorId: number, weight: number) => void;
    onConfirmPayout: () => void;
}

const PayoutModal: React.FC<PayoutModalProps> = ({
    isOpen,
    onClose,
    selectedRepo,
    contributors,
    fundAmount,
    error,
    onFundAmountChange,
    onWeightChange,
    onConfirmPayout,
}) => {
    const handleClose = () => {
        onClose();
    };

    // Calculate payout amount for each contributor
    const calculatePayoutAmount = (contributor: Contributor): number => {
        const fundAmountNum = parseFloat(fundAmount) || 0;
        if (fundAmountNum === 0 || contributors.length === 0) return 0;

        // Calculate total weighted contributions: Σ(contributions × weight)
        const totalWeightedContributions = contributors.reduce((sum, c) =>
            sum + (c.contributions * (c.weight || 0)), 0
        );

        if (totalWeightedContributions === 0) return 0;

        // Calculate individual payout: (contributions × weight) / Σ(contributions × weight) × totalPool
        const weightedContribution = contributor.contributions * (contributor.weight || 0);
        return (weightedContribution / totalWeightedContributions) * fundAmountNum;
    };

    // Calculate percentage for each contributor
    const calculatePayoutPercentage = (contributor: Contributor): number => {
        const totalWeightedContributions = contributors.reduce((sum, c) =>
            sum + (c.contributions * (c.weight || 0)), 0
        );

        if (totalWeightedContributions === 0) return 0;

        const weightedContribution = contributor.contributions * (contributor.weight || 0);
        return (weightedContribution / totalWeightedContributions) * 100;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Payout Contributors - ${selectedRepo?.name}`}
        >
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Contributors</h3>
                    <div className="space-y-3">
                        {contributors.length > 0 ? (
                            contributors.map((contributor) => {
                                const payoutAmount = calculatePayoutAmount(contributor);
                                const payoutPercentage = calculatePayoutPercentage(contributor);

                                return (
                                    <div key={contributor.id} className="bg-gray-800 p-4 rounded border border-gray-700">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={contributor.avatar_url}
                                                        alt={contributor.name}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <div>
                                                        <div className="text-white font-medium">{contributor.name}</div>
                                                        <div className="text-gray-400 text-sm">@{contributor.login}</div>
                                                        <div className="text-gray-500 text-xs">{contributor.contributions} contributions</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-gray-400 text-sm">Weight:</label>
                                                    <select
                                                        value={contributor.weight || 5}
                                                        onChange={(e) => onWeightChange(contributor.id, parseInt(e.target.value))}
                                                        className="bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded text-sm w-16"
                                                    >
                                                        {[...Array(10)].map((_, i) => (
                                                            <option key={i + 1} value={i + 1}>
                                                                {i + 1}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Payout calculation display */}
                                            {fundAmount && parseFloat(fundAmount) > 0 && (
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                                                    <div className="text-sm text-gray-400">
                                                        Weighted Score: {contributor.contributions} × {contributor.weight || 0} = {contributor.contributions * (contributor.weight || 0)}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-semibold">
                                                            ${payoutAmount.toFixed(2)} USDC
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {payoutPercentage.toFixed(2)}% of total
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-gray-400 text-center py-4">
                                No contributors found for this repository.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Total Fund Amount (USDC)</label>
                    <input
                        type="number"
                        placeholder="1000"
                        value={fundAmount}
                        onChange={(e) => onFundAmountChange(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
                    />
                    {selectedRepo?.poolAmount !== undefined && selectedRepo.poolAmount > 0 && (
                        <div className="text-sm text-gray-400 mt-1">
                            Available in pool: ${selectedRepo.poolAmount.toLocaleString()} USDC
                        </div>
                    )}
                </div>

                {/* Payout Summary */}
                {fundAmount && parseFloat(fundAmount) > 0 && contributors.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-white mb-3">Payout Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Contributors:</span>
                                <span className="text-white font-medium">{contributors.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Weighted Score:</span>
                                <span className="text-white font-medium">
                                    {contributors.reduce((sum, c) => sum + (c.contributions * (c.weight || 0)), 0)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                                <span className="text-gray-400">Total Distribution:</span>
                                <span className="text-green-400 font-bold">${parseFloat(fundAmount).toFixed(2)} USDC</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Formula: Payout = (Contributions × Weight) / Σ(Contributions × Weight) × Total Pool
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <Button
                        className="flex-1"
                        onClick={onConfirmPayout}
                        disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                    >
                        Confirm Payout
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PayoutModal;
