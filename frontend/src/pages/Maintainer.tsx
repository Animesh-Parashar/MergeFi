import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  CheckCircle,
  XCircle,
  GitBranch,
  Users,
  Star,
  GitPullRequest,
  ExternalLink,
  GitFork,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import ContributorsModal from '../components/ContributorsModal';


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

interface Contributor {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  contributions: number;
  weight?: number;
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
  const [showPayoutModal, setShowPayoutModal] = useState(false);
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
  const [payoutContributors, setPayoutContributors] = useState<Contributor[]>([]);
  const [payoutFundAmount, setPayoutFundAmount] = useState('');
  const [loadingRepoId, setLoadingRepoId] = useState<number | null>(null);
  const [showCrossChainModal, setShowCrossChainModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [totalForkedRepos, setTotalForkedRepos] = useState(0);
  const [listingRepoId, setListingRepoId] = useState<number | null>(null);
  const reposPerPage = 6; // Changed from 3 to 6

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

      // Fetch which repos are listed from Supabase
      const listedReposResponse = await axios.get('http://localhost:5000/api/repos/listed', {
        withCredentials: true,
      });

      const listedRepoIds = new Set(listedReposResponse.data.repos.map((r: any) => r.github_repo_id));

      // Add status for repositories
      const reposWithStatus = repositories.map((repo: Repository) => ({
        ...repo,
        isOpenToContributions: listedRepoIds.has(repo.id),
        poolAmount: 0,
      }));

      setUser(user);
      setRepositories(reposWithStatus);
      setBackendStats(stats);
      setTotalForkedRepos(stats.total_forks || 0);

    } catch (error) {
      console.error('Error fetching maintainer data:', error);
      setError('Failed to fetch repository data');
    } finally {
      setLoading(false);
    }
  };

  const handleListRepo = async (repo: Repository) => {
    try {
      setListingRepoId(repo.id);
      setError(null);

      const [owner, repoName] = repo.full_name.split('/');

      // Call backend to list the repository
      await axios.post(
        'http://localhost:5000/api/repos/list',
        {
          github_repo_id: repo.id,
          owner: owner,
          repo: repoName,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
        },
        { withCredentials: true }
      );

      // Update local state
      setRepositories(prev =>
        prev.map(r =>
          r.id === repo.id
            ? { ...r, isOpenToContributions: true }
            : r
        )
      );

      alert(`${repo.name} is now open for contributions!`);
    } catch (error: any) {
      console.error('Error listing repository:', error);
      setError(error.response?.data?.error || 'Failed to list repository');
    } finally {
      setListingRepoId(null);
    }
  };

  const handleUnlistRepo = async (repo: Repository) => {
    try {
      setListingRepoId(repo.id);
      setError(null);

      await axios.post(
        'http://localhost:5000/api/repos/unlist',
        { github_repo_id: repo.id },
        { withCredentials: true }
      );

      // Update local state
      setRepositories(prev =>
        prev.map(r =>
          r.id === repo.id
            ? { ...r, isOpenToContributions: false }
            : r
        )
      );

      alert(`${repo.name} is no longer open for contributions.`);
    } catch (error: any) {
      console.error('Error unlisting repository:', error);
      setError(error.response?.data?.error || 'Failed to unlist repository');
    } finally {
      setListingRepoId(null);
    }
  };

  const handlePayout = async (repo: Repository) => {
    // Fetch contributors for this repository from the API
    try {
      setError(null);
      setLoadingRepoId(repo.id);
      const [owner, repoName] = repo.full_name.split('/');

      const response = await axios.get(
        `http://localhost:5000/api/maintainer/${owner}/${repoName}/contributors`,
        { withCredentials: true }
      );

      // Map API response to our Contributor interface
      const contributors: Contributor[] = response.data.contributors.map((contributor: any) => ({
        id: contributor.id,
        login: contributor.login,
        name: contributor.name || contributor.login,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
        weight: 5 // Default weight of 5 (middle value between 1-10)
      }));

      if (contributors.length === 0) {
        setError('No contributors found for this repository');
        return;
      }

      setPayoutContributors(contributors);
      setSelectedRepo(repo);
      setPayoutFundAmount('');
      setShowPayoutModal(true);
    } catch (error: any) {
      console.error('Error fetching contributors:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Repository not found or you don\'t have access to it.');
      } else {
        setError('Failed to fetch contributors. Please try again.');
      }
    } finally {
      setLoadingRepoId(null);
    }
  };

  const handleWeightChange = (contributorId: number, weight: number) => {
    setPayoutContributors(prev =>
      prev.map(contributor =>
        contributor.id === contributorId
          ? { ...contributor, weight }
          : contributor
      )
    );
  };

  const handleConfirmPayout = async () => {
    if (!selectedRepo || !payoutFundAmount || parseFloat(payoutFundAmount) <= 0) {
      setError('Please enter a valid fund amount');
      return;
    }

    if (payoutContributors.some(c => !c.weight || c.weight < 1 || c.weight > 10)) {
      setError('Please set weights between 1-10 for all contributors');
      return;
    }

    try {
      // Calculate total weight
      const totalWeight = payoutContributors.reduce((sum, c) => sum + (c.weight || 0), 0);
      const fundAmountNum = parseFloat(payoutFundAmount);

      // Calculate individual payouts
      const payouts = payoutContributors.map(contributor => ({
        ...contributor,
        payout: (fundAmountNum * (contributor.weight || 0)) / totalWeight
      }));

      console.log('Processing payout:', {
        repo: selectedRepo.name,
        totalAmount: fundAmountNum,
        payouts
      });

      // TODO: Make API call to process payout
      // await axios.post(`http://localhost:5000/api/repository/${selectedRepo.id}/payout`, {
      //   contributors: payouts,
      //   totalAmount: fundAmountNum
      // }, { withCredentials: true });

      // Update repository pool amount
      setRepositories(prev =>
        prev.map(repo =>
          repo.id === selectedRepo.id
            ? { ...repo, poolAmount: Math.max(0, (repo.poolAmount || 0) - fundAmountNum) }
            : repo
        )
      );

      setShowPayoutModal(false);
      setPayoutContributors([]);
      setPayoutFundAmount('');
      setSelectedRepo(null);
      setError(null);
    } catch (error) {
      console.error('Error processing payout:', error);
      setError('Failed to process payout');
    }
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

  // Split current repos into rows of 2
  const repoRows: Repository[][] = [];
  for (let i = 0; i < currentRepos.length; i += 2) {
    repoRows.push(currentRepos.slice(i, i + 2));
  }

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
                <div className="text-gray-400 text-sm mb-2">Total Repositories</div>
                <div className="text-3xl font-bold">{repositories.length}</div>
                <div className="text-gray-500 text-sm mt-1">Owned repos</div>
              </div>
              <GitBranch className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Forked Repos</div>
                <div className="text-3xl font-bold">{totalForkedRepos}</div>
                <div className="text-gray-500 text-sm mt-1">Contributing to</div>
              </div>
              <GitFork className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Stars</div>
                <div className="text-3xl font-bold">
                  {backendStats?.total_stars.toLocaleString() || 0}
                </div>
                <div className="text-yellow-400 text-sm mt-1">GitHub Stars</div>
              </div>
              <Star className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Open Repos</div>
                <div className="text-3xl font-bold">{openRepos}</div>
                <div className="text-gray-500 text-sm mt-1">For contributions</div>
              </div>
              <CheckCircle className="w-12 h-12 text-gray-700" />
            </div>
          </Card>
        </div>

        <div>
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
                  <div key={i} className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-4"></div>
                        <div className="h-3 bg-gray-800 rounded mb-2"></div>
                        <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                      </div>
                    </Card>
                    <Card>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-4"></div>
                        <div className="h-3 bg-gray-800 rounded mb-2"></div>
                        <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : error ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button onClick={fetchMaintainerData} variant="outline">
                    Retry
                  </Button>
                </div>
              </Card>
            ) : repositories.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">No repositories found</p>
              </Card>
            ) : (
              <>
                <div className="space-y-6 mb-6">
                  {repoRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-2 gap-6">
                      {row.map((repo, colIndex) => {
                        const index = rowIndex * 2 + colIndex;
                        return (
                          <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card hover className="h-full">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <GitBranch className="w-5 h-5 text-gray-400" />
                                      <span className="font-bold">{repo.name}</span>
                                      {repo.private && (
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                          Private
                                        </span>
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
                                      <span>
                                        Updated:{' '}
                                        {new Date(repo.updated_at).toLocaleDateString()}
                                      </span>
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
                                      Pool: ${repo.poolAmount?.toLocaleString() || 0} USDC
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {repo.stats.open_issues_count} open issues
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setContributorsModal({
                                          isOpen: true,
                                          owner: repo.full_name.split('/')[0],
                                          repo: repo.full_name.split('/')[1],
                                        })
                                      }
                                    >
                                      Contributors ({repo.stats.contributors_count})
                                    </Button>
                                    {repo.isOpenToContributions ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUnlistRepo(repo)}
                                        disabled={listingRepoId === repo.id}
                                      >
                                        {listingRepoId === repo.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          'Unlist Repo'
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleListRepo(repo)}
                                        disabled={listingRepoId === repo.id}
                                      >
                                        {listingRepoId === repo.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          'List Repo'
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handlePayout(repo)}
                                      disabled={loadingRepoId === repo.id}
                                    >
                                      {loadingRepoId === repo.id ? 'Loading...' : 'Payout'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 border ${currentPage === page
                            ? 'border-white bg-white text-black'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500'
                            } transition-colors`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
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
            <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
            <input
              type="number"
              placeholder="1000"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
            />
          </div>
          <div className="text-sm text-gray-400">
            Current pool: ${selectedRepo?.poolAmount?.toLocaleString() || 0} USDC
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
              <span className="font-bold">$250 USDC</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">AI Suggestion</span>
              <span className="font-bold text-yellow-400">$275 USDC</span>
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

      {/* Payout Modal */}
      <Modal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
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
              {payoutContributors.length > 0 ? (
                payoutContributors.map((contributor) => (
                  <div key={contributor.id} className="bg-gray-800 p-4 rounded border border-gray-700">
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
                          onChange={(e) => handleWeightChange(contributor.id, parseInt(e.target.value))}
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
                  </div>
                ))
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
              value={payoutFundAmount}
              onChange={(e) => setPayoutFundAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none"
            />
            {selectedRepo?.poolAmount !== undefined && selectedRepo.poolAmount > 0 && (
              <div className="text-sm text-gray-400 mt-1">
                Available in pool: ${selectedRepo.poolAmount.toLocaleString()} USDC
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1"
              onClick={handleConfirmPayout}
              disabled={!payoutFundAmount || parseFloat(payoutFundAmount) <= 0}
            >
              Confirm Payout
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowPayoutModal(false);
                setError(null);
              }}
            >
              Cancel
            </Button>


          </div>
        </div>
      </Modal>

    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}
