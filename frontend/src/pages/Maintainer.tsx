import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  GitBranch,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export function Maintainer() {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const repos = [
    { name: 'awesome-blockchain', status: 'verified', pool: 5000 },
    { name: 'defi-toolkit', status: 'verified', pool: 3200 },
    { name: 'web3-starter', status: 'pending', pool: 0 },
  ];

  const pendingTransactions = [
    {
      id: 1,
      contributor: 'alice.eth',
      pr: '#234',
      repo: 'awesome-blockchain',
      amount: 250,
      aiSuggestion: 275,
    },
    {
      id: 2,
      contributor: 'bob.dev',
      pr: '#189',
      repo: 'defi-toolkit',
      amount: 180,
      aiSuggestion: 180,
    },
    {
      id: 3,
      contributor: 'charlie.code',
      pr: '#156',
      repo: 'awesome-blockchain',
      amount: 320,
      aiSuggestion: 350,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Maintainer Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Manage repositories, reward pools, and approve transactions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Pool Value</div>
                <div className="text-3xl font-bold">$8,200</div>
                <div className="text-green-400 text-sm mt-1">PyUSD</div>
              </div>
              <DollarSign className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Verified Repos</div>
                <div className="text-3xl font-bold">2</div>
                <div className="text-gray-500 text-sm mt-1">1 pending</div>
              </div>
              <CheckCircle className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Pending Approvals</div>
                <div className="text-3xl font-bold">3</div>
                <div className="text-yellow-400 text-sm mt-1">Needs review</div>
              </div>
              <Clock className="w-12 h-12 text-gray-700" />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Repository Status</h2>
            <div className="space-y-4">
              {repos.map((repo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-gray-400" />
                        <span className="font-bold">{repo.name}</span>
                      </div>
                      {repo.status === 'verified' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400">
                          Status:{' '}
                          <span
                            className={
                              repo.status === 'verified'
                                ? 'text-green-400'
                                : 'text-yellow-400'
                            }
                          >
                            {repo.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Pool: ${repo.pool} PyUSD
                        </div>
                      </div>
                      {repo.status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRewardModal(true)}
                        >
                          Add Funds
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">AI Reward Suggestions</h2>
            <Card className="h-full">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-bold mb-2">Contribution Analysis</div>
                    <div className="text-sm text-gray-400 space-y-2">
                      <p>
                        • PR #234: High complexity, suggests +$25 from base amount
                      </p>
                      <p>
                        • PR #156: Critical bug fix, suggests +$30 for impact
                      </p>
                      <p>• Average reward: $235 PyUSD per merged PR</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-500">
                    AI recommendations based on:
                  </div>
                  <div className="text-sm text-gray-400 mt-2 space-y-1">
                    <div>• Lines of code changed</div>
                    <div>• Complexity analysis</div>
                    <div>• Issue priority</div>
                    <div>• Historical data</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Pending Transactions</h2>
          <div className="space-y-4">
            {pendingTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    <div>
                      <div className="text-sm text-gray-400">Contributor</div>
                      <div className="font-bold">{tx.contributor}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Repository</div>
                      <div className="text-sm">{tx.repo}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">PR</div>
                      <div className="text-sm">{tx.pr}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Amount</div>
                      <div className="font-bold">${tx.amount} PyUSD</div>
                      {tx.aiSuggestion !== tx.amount && (
                        <div className="text-xs text-yellow-400">
                          AI suggests: ${tx.aiSuggestion}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowApproveModal(true)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Create Reward Pool"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Repository
            </label>
            <select className="w-full bg-gray-900 border border-gray-700 p-3 text-white">
              <option>awesome-blockchain</option>
              <option>defi-toolkit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount (PyUSD)
            </label>
            <input
              type="number"
              placeholder="1000"
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white"
            />
          </div>
          <Button className="w-full">Add to Pool</Button>
        </div>
      </Modal>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Transaction"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Contributor</span>
              <span className="font-bold">alice.eth</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Pull Request</span>
              <span className="font-bold">#234</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Amount</span>
              <span className="font-bold">$250 PyUSD</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">AI Suggestion</span>
              <span className="font-bold text-yellow-400">$275 PyUSD</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button className="flex-1">Approve $250</Button>
            <Button variant="outline" className="flex-1">
              Use AI Amount
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
