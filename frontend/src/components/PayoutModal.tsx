import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

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
  full_name: string;
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
  maintainerLogin?: string;
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
  maintainerLogin,
}) => {
  const [loadingWeightFor, setLoadingWeightFor] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, number | null>>({});

  const handleClose = () => {
    onClose();
    setAiSuggestions({});
  };

  const handleGetWeight = async (contributor: Contributor) => {
    if (!selectedRepo) return;

    setLoadingWeightFor(contributor.id);
    const [owner, repo] = selectedRepo.full_name.split('/');

    try {
      const response = await axios.post(
        'https://mergefi.onrender.com/api/ai/calculate-contributor-weight',
        {
          owner,
          repo,
          username: contributor.login,
          totalContributions: contributor.contributions,
        },
        { withCredentials: true }
      );

      const { contribution_weight } = response.data;

      setAiSuggestions((prev) => ({
        ...prev,
        [contributor.id]: contribution_weight,
      }));
    } catch (err) {
      console.error('Error getting AI weight:', err);
      setAiSuggestions((prev) => ({
        ...prev,
        [contributor.id]: null,
      }));
    } finally {
      setLoadingWeightFor(null);
    }
  };

  const contributorsExcludingMaintainer = contributors.filter(
    (contributor) => contributor.login !== maintainerLogin
  );

  const calculatePayoutAmount = (contributor: Contributor): number => {
    if (contributor.login === maintainerLogin) return 0;

    const fundAmountNum = parseFloat(fundAmount) || 0;
    if (fundAmountNum <= 0 || contributorsExcludingMaintainer.length === 0) return 0;

    const totalWeightedContributions = contributorsExcludingMaintainer.reduce(
      (sum, c) => sum + c.contributions * (c.weight || 0),
      0
    );

    if (totalWeightedContributions === 0) return 0;

    const weightedContribution = contributor.contributions * (contributor.weight || 0);
    return (weightedContribution / totalWeightedContributions) * fundAmountNum;
  };

  const calculatePayoutPercentage = (contributor: Contributor): number => {
    if (contributor.login === maintainerLogin) return 0;

    const totalWeightedContributions = contributorsExcludingMaintainer.reduce(
      (sum, c) => sum + c.contributions * (c.weight || 0),
      0
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

        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded text-sm">
          ℹ️ Maintainer (@{maintainerLogin}) will be excluded from payouts.
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Contributors</h3>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {contributors.length > 0 ? (
              contributors.map((contributor) => {
                const payoutAmount = calculatePayoutAmount(contributor);
                const payoutPercentage = calculatePayoutPercentage(contributor);
                const isMaintainer = contributor.login === maintainerLogin;
                const aiSuggestion = aiSuggestions[contributor.id];

                return (
                  <div
                    key={contributor.id}
                    className={`bg-gray-800 p-4 rounded border ${
                      isMaintainer ? 'border-yellow-500/30 opacity-60' : 'border-gray-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={contributor.avatar_url}
                            alt={contributor.name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div className="text-white font-medium flex items-center gap-2 truncate">
                              {contributor.name || contributor.login}
                              {isMaintainer && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded flex-shrink-0">
                                  Maintainer (Excluded)
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm truncate">
                              @{contributor.login}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {contributor.contributions} contributions
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <label className="text-gray-400 text-sm">Weight:</label>
                            <select
                              value={isMaintainer ? 0 : contributor.weight || 5}
                              onChange={(e) =>
                                onWeightChange(contributor.id, parseInt(e.target.value))
                              }
                              disabled={isMaintainer || loadingWeightFor === contributor.id}
                              className="bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded text-sm w-16 disabled:opacity-50"
                            >
                              {isMaintainer ? (
                                <option value={0}>0</option>
                              ) : (
                                [...Array(10)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          {!isMaintainer && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-[130px]"
                              onClick={() => handleGetWeight(contributor)}
                              disabled={loadingWeightFor === contributor.id}
                            >
                              {loadingWeightFor === contributor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Get AI Suggestion'
                              )}
                            </Button>
                          )}

                          {aiSuggestion !== undefined && aiSuggestion !== null && (
                            <div className="text-blue-400 text-xs text-right w-full mt-1">
                              AI Suggests: {aiSuggestion}
                            </div>
                          )}
                        </div>
                      </div>

                      {fundAmount && parseFloat(fundAmount) > 0 && !isMaintainer && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700 mt-3">
                          <div className="text-sm text-gray-400">
                            Weighted Score: {contributor.contributions} ×{' '}
                            {contributor.weight || 0} ={' '}
                            {contributor.contributions * (contributor.weight || 0)}
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

                      {isMaintainer && (
                        <div className="pt-2 border-t border-gray-700 text-sm text-yellow-400 mt-3">
                          ⚠️ Will not receive payout (maintainer)
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
          <label className="block text-sm text-gray-400 mb-2">
            Total Fund Amount (USDC)
          </label>
          <input
            type="number"
            placeholder="e.g., 1000"
            value={fundAmount}
            onChange={(e) => onFundAmountChange(e.target.value)}
            min="0"
            className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
          />
          {selectedRepo?.poolAmount !== undefined && selectedRepo.poolAmount > 0 && (
            <div className="text-sm text-gray-400 mt-1">
              Available in pool: ${selectedRepo.poolAmount.toLocaleString()} USDC
            </div>
          )}
        </div>

        {fundAmount && parseFloat(fundAmount) > 0 && contributors.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Payout Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Contributors:</span>
                <span className="text-white font-medium">{contributors.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Eligible for Payout:</span>
                <span className="text-white font-medium">
                  {contributorsExcludingMaintainer.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Weighted Score:</span>
                <span className="text-white font-medium">
                  {contributorsExcludingMaintainer.reduce(
                    (sum, c) => sum + c.contributions * (c.weight || 0),
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Total Distribution:</span>
                <span className="text-green-400 font-bold">
                  ${(parseFloat(fundAmount) || 0).toFixed(2)} USDC
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Formula: Payout = (Contributions × Weight) / Σ(Contributions × Weight) ×
                Total Pool
              </div>
              <div className="text-xs text-yellow-400 mt-1">
                * Maintainer excluded from payout distribution
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
