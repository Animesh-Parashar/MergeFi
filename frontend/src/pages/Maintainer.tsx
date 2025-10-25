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
import ContributorsModal from '../components/ContributorsModal';
import PayoutModal from '../components/PayoutModal';



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
  walletAddress?: string;
  chainId?: number;
}

interface NFTContributor {
  address: string;
  amount: number;
  name: string;
  chainId?: number;
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
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [backendStats, setBackendStats] = useState<MaintainerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contributorsModal, setContributorsModal] = useState({
    isOpen: false,
    owner: '',
    repo: ''
  });
  const [payoutContributors, setPayoutContributors] = useState<Contributor[]>([]);
  const [payoutFundAmount, setPayoutFundAmount] = useState('');
  const [loadingRepoId, setLoadingRepoId] = useState<number | null>(null);
  const [totalForkedRepos, setTotalForkedRepos] = useState(0);
  const [listingRepoId, setListingRepoId] = useState<number | null>(null);

  // Add new state for listing modal
  const [listingModal, setListingModal] = useState({
    isOpen: false,
    repo: null as Repository | null,
    poolAmount: ''
  });

  const reposPerPage = 6;

  useEffect(() => {
    fetchMaintainerData();
  }, []);

  const fetchMaintainerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<MaintainerData>('https://mergefi.onrender.com/api/maintainer', {
        withCredentials: true,
      });

      const { user, repositories, stats } = response.data;

      // Fetch which repos are listed from Supabase
      const listedReposResponse = await axios.get('https://mergefi.onrender.com/api/repos/listed', {
        withCredentials: true,
      });

      const listedRepos = listedReposResponse.data.repos;
      const listedRepoMap = new Map(listedRepos.map((r: any) => [r.github_repo_id, r]));

      // Add status and pool amount for repositories
      const reposWithStatus = repositories.map((repo: Repository) => {
        const listedRepo = listedRepoMap.get(repo.id);
        return {
          ...repo,
          isOpenToContributions: !!listedRepo,
          poolAmount: listedRepo?.pool_reward || 0, // Fetch pool_reward from backend
        };
      });

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
    // Show modal to enter pool amount
    setListingModal({
      isOpen: true,
      repo: repo,
      poolAmount: ''
    });
  };

  const handleConfirmListing = async () => {
    const { repo, poolAmount } = listingModal;

    if (!repo) return;

    const poolAmountNum = parseFloat(poolAmount);
    if (isNaN(poolAmountNum) || poolAmountNum < 0) {
      setError('Please enter a valid pool amount (0 or greater)');
      return;
    }

    try {
      setListingRepoId(repo.id);
      setError(null);

      const [owner, repoName] = repo.full_name.split('/');

      // Call backend to list the repository with pool amount
      await axios.post(
        'https://mergefi.onrender.com/api/repos/list',
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
          pool_reward: poolAmountNum
        },
        { withCredentials: true }
      );

      // Update local state
      setRepositories(prev =>
        prev.map(r =>
          r.id === repo.id
            ? { ...r, isOpenToContributions: true, poolAmount: poolAmountNum }
            : r
        )
      );

      // Close modal and reset
      setListingModal({ isOpen: false, repo: null, poolAmount: '' });
      alert(`${repo.name} is now open for contributions with a pool of $${poolAmountNum} USDC!`);
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
        'https://mergefi.onrender.com/api/repos/unlist',
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
    // Fetch contributors for this repository from the API with wallet data
    try {
      setError(null);
      setLoadingRepoId(repo.id);
      const [owner, repoName] = repo.full_name.split('/');

      const response = await axios.get(
        `https://mergefi.onrender.com/api/maintainer/${owner}/${repoName}/contributors-wallets`,
        { withCredentials: true }
      );

      // Map API response to our Contributor interface
      const contributors: Contributor[] = response.data.contributors.map((contributor: any) => ({
        id: contributor.id,
        login: contributor.login,
        name: contributor.name || contributor.login,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
        weight: 5, // Default weight of 5 (middle value between 1-10)
        walletAddress: contributor.walletAddress,
        chainId: contributor.chainId ? parseInt(contributor.chainId) : undefined
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

    // Check if contributors have wallet addresses
    const contributorsWithoutWallets = payoutContributors.filter(c => !c.walletAddress);
    if (contributorsWithoutWallets.length > 0) {
      setError(`Some contributors don't have wallet addresses registered: ${contributorsWithoutWallets.map(c => c.login).join(', ')}`);
      return;
    }

    try {
      // **FILTER OUT THE MAINTAINER** - Only process contributors who are not the maintainer
      const contributorsExcludingMaintainer = payoutContributors.filter(
        contributor => contributor.login !== user?.login
      );

      if (contributorsExcludingMaintainer.length === 0) {
        setError('No contributors to process payout for (excluding maintainer)');
        return;
      }

      console.log(`Processing payout for ${contributorsExcludingMaintainer.length} contributors (excluding maintainer ${user?.login})`);

      // Calculate weighted contributions (contributions × weight) for each contributor
      const fundAmountNum = parseFloat(payoutFundAmount);

      // Calculate total weighted contributions: Σ(contributions × weight) - ONLY for non-maintainer contributors
      const totalWeightedContributions = contributorsExcludingMaintainer.reduce((sum, c) =>
        sum + (c.contributions * (c.weight || 0)), 0
      );

      if (totalWeightedContributions === 0) {
        setError('Total weighted contributions cannot be zero');
        return;
      }

      // Calculate individual payouts using: (contributions × weight) / Σ(contributions × weight) × totalPool
      const nftContributors: NFTContributor[] = contributorsExcludingMaintainer.map(contributor => {
        const weightedContribution = contributor.contributions * (contributor.weight || 0);
        const amount = (weightedContribution / totalWeightedContributions) * fundAmountNum;
        // Round to 2 decimal places
        const roundedAmount = Math.round(amount * 100) / 100;

        return {
          address: contributor.walletAddress || '0x0000000000000000000000000000000000000000',
          amount: roundedAmount,
          name: contributor.login,
          chainId: contributor.chainId
        };
      });

      console.log('Processing payout with NFT minting (excluding maintainer):', {
        repo: selectedRepo.name,
        totalAmount: fundAmountNum.toFixed(2),
        totalWeightedContributions,
        maintainerExcluded: user?.login,
        contributors: nftContributors.map(c => ({
          name: c.name,
          amount: c.amount.toFixed(2),
          percentage: ((c.amount / fundAmountNum) * 100).toFixed(2) + '%'
        }))
      });

      // Call cross-chain NFT minting service
      console.log('Starting NFT minting for contributors (excluding maintainer)...');

      // Import NFT services
      const { callMintCrossChainRewardNFT } = await import('../services/runtransaction');

      // Get current MetaMask connected chain as source chain
      let sourceChainId = 11155111; // Default to Sepolia

      // API function to get user's chainId preference
      const getUserChainId = async (githubUsername: string): Promise<number | null> => {
        try {
          const response = await axios.post('https://mergefi.onrender.com/api/getchain', {
            github_username: githubUsername
          }, { withCredentials: true });

          // API returns chainId directly as number
          const chainId = response.data?.chainId || response.data?.chain;
          return chainId ? parseInt(chainId) : null;
        } catch (error) {
          console.error(`Error getting chain for user ${githubUsername}:`, error);
          return null;
        }
      };

      // Process each contributor individually (excluding maintainer)
      for (const contributor of nftContributors) {
        try {
          console.log(`Processing NFT mint for ${contributor.name} (${contributor.address})`);

          // Get user's preferred chainId from API
          const userChainId = await getUserChainId(contributor.name);
          console.log(`User ${contributor.name} preferred chainId:`, userChainId);

          // Use the user's preferred chainId as target, fallback to source chain if not found
          const targetChainId = userChainId || sourceChainId;

          if (targetChainId === sourceChainId) {
            console.warn(`⚠️ User ${contributor.name} target chain same as source. No bridging needed.`);
          }

          console.log(`Minting NFT from chain ${sourceChainId} to chain ${targetChainId} for ${contributor.name}`);

          // Call NFT minting function with proper parameters
          const result = await callMintCrossChainRewardNFT(
            contributor.amount.toString(),  // amount
            contributor.address,            // walletAddress  
            targetChainId,                 // toChainId (user's preferred chain)
            [sourceChainId],               // sourceChains (MetaMask connected chain)
            selectedRepo.name,             // reponame
            contributor.name               // contributorname
          );

          console.log(`✅ NFT minted successfully for ${contributor.name}:`, result);

        } catch (error) {
          console.error(`❌ Failed to mint NFT for ${contributor.name}:`, error);
          // Continue with other contributors even if one fails
        }
      }

      console.log('🎉 NFT minting process completed for all contributors (maintainer excluded).');

      // Update repository pool amount
      setRepositories(prev =>
        prev.map(repo =>
          repo.id === selectedRepo.id
            ? { ...repo, poolAmount: Math.max(0, (repo.poolAmount || 0) - fundAmountNum) }
            : repo
        )
      );

      alert(`Payout and NFT minting completed successfully for ${nftContributors.length} contributors (maintainer excluded)!`);
      setShowPayoutModal(false);
      setPayoutContributors([]);
      setPayoutFundAmount('');
      setSelectedRepo(null);
      setError(null);
    } catch (error: any) {
      console.error('Error processing payout:', error);
      setError(error.message || 'Failed to process payout');
    }
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
                                    <div className="text-sm font-semibold text-gray-300">
                                      Pool: <span className="text-green-400">${repo.poolAmount?.toLocaleString() || 0}</span> USDC
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
                                      disabled={loadingRepoId === repo.id || !repo.isOpenToContributions}
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

      {/* Contributors Modal */}
      <ContributorsModal
        isOpen={contributorsModal.isOpen}
        onClose={() => setContributorsModal({ isOpen: false, owner: '', repo: '' })}
        owner={contributorsModal.owner}
        repo={contributorsModal.repo}
      />

      {/* Payout Modal */}
      <PayoutModal
        isOpen={showPayoutModal}
        onClose={() => {
          setShowPayoutModal(false);
          setError(null);
        }}
        selectedRepo={selectedRepo}
        contributors={payoutContributors}
        fundAmount={payoutFundAmount}
        error={error}
        onFundAmountChange={setPayoutFundAmount}
        onWeightChange={handleWeightChange}
        onConfirmPayout={handleConfirmPayout}
        maintainerLogin={user?.login} // Add this prop
      />

      {/* Listing Modal */}
      {listingModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">
              List Repository for Contributions
            </h3>

            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                Repository: <span className="text-white font-semibold">{listingModal.repo?.name}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Initial Pool Reward (USDC)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount (e.g., 1000)"
                value={listingModal.poolAmount}
                onChange={(e) =>
                  setListingModal(prev => ({
                    ...prev,
                    poolAmount: e.target.value
                  }))
                }
                className="w-full bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                This amount will be available for contributor payouts
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setListingModal({ isOpen: false, repo: null, poolAmount: '' });
                  setError(null);
                }}
                disabled={listingRepoId !== null}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmListing}
                disabled={listingRepoId !== null}
                className="flex-1"
              >
                {listingRepoId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Listing...
                  </>
                ) : (
                  'Confirm & List'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
