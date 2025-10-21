import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  GitBranch,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
  GitPullRequest,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import ContributorsModal from '../components/ContributorsModal';
import { CrossChainPayment } from '../components/CrossChainPayment';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  private: boolean;
  created_at: string;
  updated_at: string;
  stats: {
    contributors_count: number;
    open_issues_count: number;
    open_prs_count: number;
  };
  isOpenToContributions?: boolean;
  poolAmount?: number;
}

interface User {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
  company: string;
  location: string;
  bio: string;
}

interface MaintainerStats {
  total_owned_repos: number;
  total_stars: number;
  total_forks: number;
  total_contributors: number;
  total_open_issues: number;
  total_open_prs: number;
  most_popular_repo: Repository | null;
}

interface MaintainerData {
  user: User;
  repositories: Repository[];
  stats: MaintainerStats;
}

export function Maintainer() {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [backendStats, setBackendStats] = useState<MaintainerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contributorsModal, setContributorsModal] = useState({
    isOpen: false,
    owner: '',
    repo: ''
  });
  const [showCrossChainModal, setShowCrossChainModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const reposPerPage = 3;

  useEffect(() => {
    fetchMaintainerData();
  }, []);

  const fetchMaintainerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<MaintainerData>('http://localhost:5000/api/maintainer', {
        withCredentials: true,
      });

      const { user, repositories, stats } = response.data;
      console.log(response);

      // Add default status for repositories (in a real app, this would come from your database)
      const reposWithStatus = repositories.map((repo: Repository) => ({
        ...repo,
        isOpenToContributions: false, // Default to closed
        poolAmount: 0, // Default pool amount
      }));

      setUser(user);
      setRepositories(reposWithStatus);
      setBackendStats(stats);

    } catch (error) {
      console.error('Error fetching maintainer data:', error);
      setError('Failed to fetch repository data');

      // Fallback data for development/demo
      setRepositories([
        {
          id: 1,
          name: 'awesome-blockchain',
          full_name: 'user/awesome-blockchain',
          description: 'A comprehensive blockchain development toolkit',
          html_url: 'https://github.com/user/awesome-blockchain',
          stargazers_count: 1250,
          forks_count: 340,
          language: 'TypeScript',
          private: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          stats: { contributors_count: 15, open_issues_count: 8, open_prs_count: 3 },
          isOpenToContributions: true,
          poolAmount: 5000,
        },
        {
          id: 2,
          name: 'defi-toolkit',
          full_name: 'user/defi-toolkit',
          description: 'DeFi development utilities and smart contracts',
          html_url: 'https://github.com/user/defi-toolkit',
          stargazers_count: 890,
          forks_count: 210,
          language: 'Solidity',
          private: false,
          created_at: '2023-02-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z',
          stats: { contributors_count: 8, open_issues_count: 12, open_prs_count: 5 },
          isOpenToContributions: true,
          poolAmount: 3200,
        },
        {
          id: 3,
          name: 'web3-starter',
          full_name: 'user/web3-starter',
          description: 'Starter template for Web3 applications',
          html_url: 'https://github.com/user/web3-starter',
          stargazers_count: 560,
          forks_count: 120,
          language: 'JavaScript',
          private: false,
          created_at: '2023-03-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z',
          stats: { contributors_count: 5, open_issues_count: 4, open_prs_count: 2 },
          isOpenToContributions: false,
          poolAmount: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleContributionStatus = async (repoId: number) => {
    // In a real app, this would make an API call to update the database
    setRepositories(prev =>
      prev.map(repo =>
        repo.id === repoId
          ? { ...repo, isOpenToContributions: !repo.isOpenToContributions }
          : repo
      )
    );

    // TODO: Make API call to update repository status
    // try {
    //   await axios.patch(`http://localhost:5000/api/repository/${repoId}/contribution-status`, {
    //     isOpenToContributions: !repositories.find(r => r.id === repoId)?.isOpenToContributions
    //   }, { withCredentials: true });
    // } catch (error) {
    //   console.error('Error updating contribution status:', error);
    // }
  };

  const handleAddFunds = (repo: Repository) => {
    setSelectedRepo(repo);
    setFundAmount('');
    setShowRewardModal(true);
  };

  const submitFunds = async () => {
    if (!selectedRepo || !fundAmount || parseFloat(fundAmount) <= 0) return;

    try {
      // TODO: Make API call to add funds to repository pool
      // await axios.post(`http://localhost:5000/api/repository/${selectedRepo.id}/add-funds`, {
      //   amount: parseFloat(fundAmount)
      // }, { withCredentials: true });

      // Update local state
      setRepositories(prev =>
        prev.map(repo =>
          repo.id === selectedRepo.id
            ? { ...repo, poolAmount: (repo.poolAmount || 0) + parseFloat(fundAmount) }
            : repo
        )
      );

      setShowRewardModal(false);
      setFundAmount('');
      setSelectedRepo(null);
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const handleCrossChainPayment = (transaction: any) => {
    if (isProcessingPayment) return; // Prevent multiple clicks

    setSelectedTransaction(transaction);
    setShowCrossChainModal(true);
    setIsProcessingPayment(true);
  };

  const handlePaymentComplete = (result: any) => {
    console.log('Payment completed:', result);
    setIsProcessingPayment(false);
    // You might want to call an API to update the transaction status
  };

  const handleCrossChainModalClose = () => {
    setShowCrossChainModal(false);
    setIsProcessingPayment(false);
    setSelectedTransaction(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(repositories.length / reposPerPage);
  const startIndex = (currentPage - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const currentRepos = repositories.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Calculate frontend stats
  const openRepos = repositories.filter(repo => repo.isOpenToContributions).length;
  const totalPoolValue = repositories.reduce((sum, repo) => sum + (repo.poolAmount || 0), 0);

  // Mock pending transactions (in a real app, this would come from the backend)
  const pendingTransactions = [
    {
      id: 1,
      contributor: '0xF41E4fB4e7F1F6E484033c878f078A2DF57dB854',
      pr: '#234',
      repo: repositories[0]?.name || 'awesome-blockchain',
      amount: 250,
      aiSuggestion: 275,
    },
    {
      id: 2,
      contributor: 'bob.dev',
      pr: '#189',
      repo: repositories[1]?.name || 'defi-toolkit',
      amount: 180,
      aiSuggestion: 180,
    },
    {
      id: 3,
      contributor: 'charlie.code',
      pr: '#156',
      repo: repositories[0]?.name || 'awesome-blockchain',
      amount: 320,
      aiSuggestion: 350,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header with user info */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold">
                {user?.name || 'Maintainer'} Dashboard
              </h1>
              <p className="text-gray-400 text-lg">
                @{user?.login} • {user?.company && `${user.company} • `}
                Manage repositories, reward pools, and approve transactions
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Pool Value</div>
                <div className="text-3xl font-bold">${totalPoolValue.toLocaleString()}</div>
                <div className="text-green-400 text-sm mt-1">PyUSD</div>
              </div>
              <DollarSign className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Open Repositories</div>
                <div className="text-3xl font-bold">{openRepos}</div>
                <div className="text-gray-500 text-sm mt-1">
                  {repositories.length - openRepos} closed
                </div>
              </div>
              <Users className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Stars</div>
                <div className="text-3xl font-bold">
                  {backendStats?.total_stars.toLocaleString() || repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0).toLocaleString()}
                </div>
                <div className="text-yellow-400 text-sm mt-1">GitHub Stars</div>
              </div>
              <Star className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Pending Approvals</div>
                <div className="text-3xl font-bold">{pendingTransactions.length}</div>
                <div className="text-yellow-400 text-sm mt-1">Needs review</div>
              </div>
              <Clock className="w-12 h-12 text-gray-700" />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Repository Status */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Repository Status</h2>
              <div className="text-sm text-gray-400">
                {repositories.length} repositories
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-3 bg-gray-800 rounded mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {currentRepos.map((repo, index) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <GitBranch className="w-5 h-5 text-gray-400" />
                                <span className="font-bold">{repo.name}</span>
                                {repo.private && (
                                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">Private</span>
                                )}
                                <a
                                  href={repo.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-white"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <GitPullRequest className="w-4 h-4" />
                                  <span>{repo.stats.open_prs_count} PRs</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{repo.stats.contributors_count}</span>
                                </div>
                              </div>

                              {repo.description && (
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                  {repo.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Language: {repo.language || 'N/A'}</span>
                                <span>Updated: {formatDate(repo.updated_at)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {repo.isOpenToContributions ? (
                                <div className="flex items-center gap-2 text-green-400">
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="text-sm">Open</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <XCircle className="w-5 h-5" />
                                  <span className="text-sm">Closed</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                            <div>
                              <div className="text-sm text-gray-400">
                                Pool: ${repo.poolAmount?.toLocaleString() || 0} PyUSD
                              </div>
                              <div className="text-xs text-gray-500">
                                {repo.stats.open_issues_count} open issues
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setContributorsModal({
                                  isOpen: true,
                                  owner: repo.full_name.split('/')[0],
                                  repo: repo.full_name.split('/')[1]
                                })}
                              >
                                Contributors ({repo.stats.contributors_count})
                              </Button>
                              <Button
                                size="sm"
                                variant={repo.isOpenToContributions ? "secondary" : "outline"}
                                onClick={() => toggleContributionStatus(repo.id)}
                              >
                                {repo.isOpenToContributions ? 'Close' : 'Open to Contributions'}
                              </Button>
                              {repo.isOpenToContributions && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddFunds(repo)}
                                >
                                  Add Funds
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, repositories.length)} of {repositories.length} repositories
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-400 px-3">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AI Reward Suggestions */}
          <div>
            <h2 className="text-2xl font-bold mb-6">AI Reward Suggestions</h2>
            <Card className="h-full">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-bold mb-2">Contribution Analysis</div>
                    <div className="text-sm text-gray-400 space-y-2">
                      <p>• PR #234: High complexity, suggests +$25 from base amount</p>
                      <p>• PR #156: Critical bug fix, suggests +$30 for impact</p>
                      <p>• Average reward: $235 PyUSD per merged PR</p>
                    </div>
                  </div>
                </div>

                {backendStats && (
                  <div className="pt-4 border-t border-gray-800">
                    <div className="text-sm text-gray-500 mb-2">Repository Overview:</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Total repositories: {backendStats.total_owned_repos}</div>
                      <div>• Total contributors: {backendStats.total_contributors}</div>
                      <div>• Open issues: {backendStats.total_open_issues}</div>
                      <div>• Open PRs: {backendStats.total_open_prs}</div>
                      {backendStats.most_popular_repo && (
                        <div>• Most popular: {backendStats.most_popular_repo.name}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-500">AI recommendations based on:</div>
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

        {/* Pending Transactions */}
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
                  <div className="grid md:grid-cols-6 gap-4 items-center">
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
                    <div className="md:col-span-2 flex gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowApproveModal(true)}
                        className="flex-1 min-w-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCrossChainPayment(tx)}
                        disabled={isProcessingPayment}
                        className="flex-1 min-w-0 whitespace-nowrap"
                      >
                        {isProcessingPayment ? 'Processing...' : 'Cross-Chain Pay'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Add Funds Modal */}
      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Add Funds to Pool"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Repository</label>
            <div className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded">
              {selectedRepo?.name || 'Select Repository'}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount (PyUSD)</label>
            <input
              type="number"
              placeholder="1000"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
            />
          </div>
          <div className="text-sm text-gray-400">
            Current pool: ${selectedRepo?.poolAmount?.toLocaleString() || 0} PyUSD
          </div>
          <Button
            className="w-full"
            onClick={submitFunds}
            disabled={!fundAmount || parseFloat(fundAmount) <= 0}
          >
            Add ${fundAmount || '0'} to Pool
          </Button>
        </div>
      </Modal>

      {/* Approve Transaction Modal */}
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
            <Button className="flex-1" onClick={() => setShowApproveModal(false)}>
              Approve $250
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowApproveModal(false)}>
              Use AI Amount
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contributors Modal */}
      <ContributorsModal
        isOpen={contributorsModal.isOpen}
        onClose={() => setContributorsModal({ isOpen: false, owner: '', repo: '' })}
        owner={contributorsModal.owner}
        repo={contributorsModal.repo}
      />

      {/* Cross-Chain Payment Modal - Updated */}
      <CrossChainPayment
        isOpen={showCrossChainModal}
        onClose={handleCrossChainModalClose}
        recipient={selectedTransaction?.contributor || ''}
        suggestedAmount={selectedTransaction?.amount || 0}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
