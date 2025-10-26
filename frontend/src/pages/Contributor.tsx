import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DollarSign,
  Award,
  GitMerge,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card } from '../components/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Add ethers imports
import { BrowserProvider, Contract } from 'ethers';

interface PRData {
  id: number;
  repo: string;
  pr: string;
  title: string;
  date: string;
  url: string;
  state?: string;
}

interface BadgeData {
  name: string;
  contributions: number;
  level: string;
  color: string;
}

interface StatsData {
  totalPRs: number;
  totalRepos: number;
  mergedPRs: PRData[];
  badges: BadgeData[];
  user: any;
}

interface EarningsData {
  totalEarnings: number;
  earningsData: { month: string; earnings: number }[];
}

export function Contributor() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New: NFT state
  interface NFTItem {
    tokenId: number;
    amountRaw: string;
    repoName: string;
    contributorName: string;
    timestamp: number;
  }

  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [nftLoading, setNftLoading] = useState(false);
  const [nftError, setNftError] = useState<string | null>(null);

  useEffect(() => {
    fetchContributorData();
    fetchContributorNFTs()
  }, []);

  const fetchContributorData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, earningsResponse] = await Promise.all([
        axios.get('https://mergefi.onrender.com/api/contributor/stats', {
          withCredentials: true,
        }),
        axios.get('https://mergefi.onrender.com/api/contributor/earnings', {
          withCredentials: true,
        }),
      ]);

      setStats(statsResponse.data);
      setEarnings(earningsResponse.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contributor data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  async function fetchContributorNFTs() {
    setNftError(null);
    setNftLoading(true);
    setNfts([]);

    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        setNftError('Ethereum provider (MetaMask) not found in window');
        return;
      }

      // Ask provider for chainId and account (user may already be connected)
      const chainIdHex = await eth.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      // Build a small local contract-address mapping (matches mapping in CrossChainNFTService)
      const contractAddressMap: Record<number, string> = {
        11155420: "0x8c920A7cd5862f3c2ec8269EC1baB3071F51788C",
        421614:  "0x673eC263392486Aa19621c4B12D90A39f0ce72d0",
        84532:   "0xfd1feba71394e0af5f97ea6365fe86870b36c112",
        11155111:"0x5e7489631db30cce2f020f4c6e0243d85a1ad595",
        10143:   "0xfd1feba71394e0af5f97ea6365fe86870b36c112",
        80002:   "0xfd1feba71394e0af5f97ea6365fe86870b36c112",
      };

      const contractAddress = contractAddressMap[chainId];
      if (!contractAddress) {
        setNftError(`No Contributor NFT contract configured for chain ${chainId}`);
        return;
      }

      // Minimal ABI for the read functions we need
      const CONTRIBUTOR_NFT_READ_ABI = [
        {
          inputs: [{ internalType: 'address', name: 'contributor', type: 'address' }],
          name: 'getContributorTokens',
          outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
          name: 'getRewardData',
          outputs: [
            {
              components: [
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
                { internalType: 'string', name: 'repoName', type: 'string' },
                { internalType: 'string', name: 'contributorName', type: 'string' },
                { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
              ],
              internalType: 'struct ContributorReward',
              name: '',
              type: 'tuple',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new Contract(contractAddress, CONTRIBUTOR_NFT_READ_ABI, provider);

      // get token IDs
      const tokenIds: any[] = await contract.getContributorTokens(address);
      if (!tokenIds || tokenIds.length === 0) {
        setNfts([]);
        return;
      }

      // Fetch reward data for each token
      const results: NFTItem[] = await Promise.all(
        tokenIds.map(async (tid: any) => {
          const tokenId = Number(tid.toString());
          const reward = await contract.getRewardData(tokenId);
          return {
            tokenId,
            amountRaw: reward.amount.toString(),
            repoName: reward.repoName,
            contributorName: reward.contributorName,
            timestamp: Number(reward.timestamp),
          };
        })
      );
      console.log(results);
      setNfts(results);
    } catch (err: any) {
      console.error('Error fetching contributor NFTs:', err);
      setNftError(err?.message || String(err));
    } finally {
      setNftLoading(false);
    }
  }

  // Utility to format USDC-like amounts (assumes 6 decimals in contract)
  const formatUSDC = (raw: string) => {
    try {
      const bn = BigInt(raw);
      const whole = bn / BigInt(1_000_000);
      const frac = Number(bn % BigInt(1_000_000)).toString().padStart(6, '0').slice(0, 2); // 2 decimals
      return `$${whole.toString()}.${frac} USDC`;
    } catch {
      return `${raw}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading contributor data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchContributorData}
            className="bg-gray-900 border border-gray-700 px-6 py-2 hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !earnings) {
    return null;
  }

  // Pagination logic
  const totalPages = Math.ceil(stats.mergedPRs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPRs = stats.mergedPRs.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Contributor Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Welcome back, @{stats.user.login} · Track your contributions, earnings, and achievement badges
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
                <div className="text-3xl font-bold">${earnings.totalEarnings}</div>
                <div className="text-green-400 text-sm mt-1">PyUSD</div>
              </div>
              <DollarSign className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Merged PRs</div>
                <div className="text-3xl font-bold">{stats.totalPRs}</div>
                <div className="text-gray-500 text-sm mt-1">Across {stats.totalRepos} repos</div>
              </div>
              <GitMerge className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">NFT Badges</div>
                <div className="text-3xl font-bold">{stats.badges.length}</div>
                <div className="text-gray-500 text-sm mt-1">
                  {stats.badges.filter(b => b.level === 'Gold').length} Gold, {stats.badges.filter(b => b.level === 'Silver').length} Silver
                </div>
              </div>
              <Award className="w-12 h-12 text-gray-700" />
            </div>
          </Card>
        </div>

        {/* <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Earnings Growth</h2> 
          <Card>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earnings.earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <YAxis
                    stroke="#666"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Earnings']}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#fff"
                    strokeWidth={2}
                    dot={{ fill: '#fff', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div> */}

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Contributions</h2>
              {stats.mergedPRs.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>
                    {startIndex + 1}-{Math.min(endIndex, stats.mergedPRs.length)} of {stats.mergedPRs.length}
                  </span>
                </div>
              )}
            </div>
            {stats.mergedPRs.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">No merged pull requests yet</p>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {currentPRs.map((pr, index) => (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-400 text-sm">{pr.repo}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-400 text-sm">{pr.pr}</span>
                            </div>
                            <div className="font-bold mb-2">{pr.title}</div>
                            <div className="text-sm text-gray-500">{pr.date}</div>
                          </div>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <div className="text-sm text-gray-400">Status</div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-bold text-green-500">Verified</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 border ${
                        currentPage === 1
                          ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                          : 'border-gray-700 text-white hover:bg-gray-900'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 border ${
                        currentPage === totalPages
                          ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                          : 'border-gray-700 text-white hover:bg-gray-900'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Achievement Badges</h2>
            {stats.badges.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">No badges earned yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {stats.badges.map((badge, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="relative overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-10`}
                      />
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-900 border border-gray-700 flex items-center justify-center">
                          <Award className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold mb-1">{badge.name}</div>
                          <div className="text-sm text-gray-400">
                            {badge.contributions} contributions
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 bg-gradient-to-br ${badge.color} text-black text-sm font-bold`}
                        >
                          {badge.level}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Contribution History</h2>
          <Card>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-500">
                $ mergefi history --user {stats.user.login}
              </div>
              <div className="space-y-1 mt-4">
                {stats.mergedPRs.slice(0, 4).map((pr) => (
                  <div key={pr.id} className="text-gray-400">
                    [{pr.date}] → {pr.repo} {pr.pr} | Verified ✓
                  </div>
                ))}
                <div className="text-gray-500 mt-4">
                  Total: {stats.totalPRs} contributions | ${earnings.totalEarnings} PyUSD earned
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* New: Contributor Reward NFTs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Your Reward NFTs</h2>
          <Card>
            <div className="p-4">
              {nftLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading NFTs...</span>
                </div>
              ) : nftError ? (
                <div className="text-red-400">Error: {nftError}</div>
              ) : nfts.length === 0 ? (
                <div className="text-gray-400">No reward NFTs found for connected wallet</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {nfts.map((nft) => (
                    <div key={nft.tokenId} className="p-4 bg-gray-900 border border-gray-700 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-400">Token #{nft.tokenId}</div>
                        <div className="text-xs text-gray-500">{new Date(nft.timestamp * 1000).toLocaleString()}</div>
                      </div>
                      <div className="font-bold mb-1">{nft.repoName}</div>
                      <div className="text-sm text-gray-400 mb-2">@{nft.contributorName}</div>
                      <div className="text-white font-semibold">{formatUSDC(nft.amountRaw)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
