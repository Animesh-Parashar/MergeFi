import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  TrendingUp,
  Zap,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getNetworkByChainId } from '../config/blockscout';

interface StoredTransaction {
  id: number;
  tx_hash: string;
  chain_id: number;
  description: string;
  created_at: string;
}

interface TransactionWithDetails extends StoredTransaction {
  from_address: string;
  to_address: string;
  value: string;
  token: string;
  blockNumber: string;
  confirmations: number;
  fee: string;
  method: string;
  timestamp: string;
  status: string;
}

export function Transactions() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successfulTxs: 0,
    totalVolume: '0',
    pendingTxs: 0,
  });

  // const BACKEND_URL = 'http://localhost:5000'; // TODO: Uncomment when backend is ready

  // Dummy transactions for demo
  const getDummyTransactions = (): StoredTransaction[] => {
    return [
      {
        id: 1,
        tx_hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        chain_id: 11155111,
        description: 'Reward for PR #234 - Bug fix in authentication',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 2,
        tx_hash: '0x8ba1f109551bd432803012645ac136ddd64dba72',
        chain_id: 11155111,
        description: 'Reward for PR #235 - New feature implementation',
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 3,
        tx_hash: '0x4e83362442b8d1bec281c06cb2cf39c8c36dd0d0',
        chain_id: 421614,
        description: 'Initial liquidity pool funding',
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 4,
        tx_hash: '0x9e83362442b8d1bec281c06cb2cf39c8c36dd0e1',
        chain_id: 11155111,
        description: 'Reward for PR #236 - Documentation update',
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: 5,
        tx_hash: '0x1e83362442b8d1bec281c06cb2cf39c8c36dd0f2',
        chain_id: 421614,
        description: 'Cross-chain transfer via Avail',
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 6,
        tx_hash: '0x2e83362442b8d1bec281c06cb2cf39c8c36dd0g3',
        chain_id: 11155111,
        description: 'Monthly reward distribution',
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      },
      {
        id: 7,
        tx_hash: '0x3e83362442b8d1bec281c06cb2cf39c8c36dd0h4',
        chain_id: 421614,
        description: 'Reward for PR #237 - Performance optimization',
        created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      },
      {
        id: 8,
        tx_hash: '0x4e83362442b8d1bec281c06cb2cf39c8c36dd0i5',
        chain_id: 11155111,
        description: 'Gas fee reimbursement',
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      },
    ];
  };

  const fetchLatestTransactions = async () => {
    const isRefresh = !loading;
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      // For demo purposes, use dummy data
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${BACKEND_URL}/api/transactions`);
      // const data = await response.json();
      // const storedTxs: StoredTransaction[] = data.transactions || [];
      
      const storedTxs: StoredTransaction[] = getDummyTransactions();

      // Enrich with Blockscout data (placeholder - will fetch from API)
      const enrichedTxs: TransactionWithDetails[] = storedTxs.map(tx => ({
        ...tx,
        from_address: '0x1234567890123456789012345678901234567890', // Will be fetched from Blockscout
        to_address: '0x2345678901234567890123456789012345678901', // Will be fetched from Blockscout
        value: '100', // Will be fetched from Blockscout
        token: 'USDC', // Will be fetched from Blockscout
        blockNumber: '1234567',
        confirmations: 12,
        fee: '0.001',
        method: 'Transfer',
        timestamp: tx.created_at,
        status: 'success', // Will be fetched from Blockscout
      }));

      /* TODO: Uncomment when backend is ready
      // Enrich each transaction with Blockscout data
      const enrichedTxs = await Promise.all(
        storedTxs.map(async (tx) => {
          const network = getNetworkByChainId(tx.chain_id);
          if (!network) return { ...tx };

          try {
            const blockscoutResponse = await fetch(
              `${network.apiBase}/transactions/${tx.tx_hash}`
            );
            
            if (blockscoutResponse.ok) {
              const blockscoutData = await blockscoutResponse.json();
              return {
                ...tx,
                blockNumber: blockscoutData.block?.toString() || '',
                confirmations: blockscoutData.confirmations || 0,
                fee: formatValue(blockscoutData.fee?.value || '0'),
                method: blockscoutData.method || 'Transfer',
                timestamp: blockscoutData.timestamp 
                  ? new Date(blockscoutData.timestamp).toLocaleString() 
                  : new Date(tx.created_at).toLocaleString(),
                blockscoutStatus: blockscoutData.status || tx.status,
              };
            }
          } catch (err) {
            console.error(`Error fetching blockscout data for ${tx.tx_hash}:`, err);
          }
          
          // Return with default values if blockscout fetch fails
          return {
            ...tx,
            timestamp: new Date(tx.created_at).toLocaleString(),
            method: tx.type || 'Transfer',
          };
        })
      );
      */

      setTransactions(enrichedTxs);
      setFilteredTransactions(enrichedTxs);

      // Calculate stats
      const totalTxs = enrichedTxs.length;
      const successfulTxs = enrichedTxs.filter(
        tx => tx.status === 'success' || tx.status === 'ok' || (tx as any).blockscoutStatus === 'ok'
      ).length;
      const pendingTxs = enrichedTxs.filter(
        tx => tx.status === 'pending'
      ).length;
      const totalVolume = enrichedTxs.reduce((sum, tx) => {
        const value = parseFloat(tx.value || '0');
        return sum + (isNaN(value) ? 0 : value);
      }, 0);

      setStats({
        totalTransactions: totalTxs,
        successfulTxs,
        totalVolume: totalVolume.toFixed(4),
        pendingTxs,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestTransactions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLatestTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter transactions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = transactions.filter(tx => 
        tx.tx_hash.toLowerCase().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Platform Transactions
              </h1>
              <p className="text-gray-400 text-lg">
                MergeFi payment activity on Ethereum and Arbitrum
              </p>
            </div>
            <Button
              onClick={() => fetchLatestTransactions()}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction hash (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                {filteredTransactions.length === 0 ? (
                  <span className="text-yellow-400">No transactions found matching "{searchQuery}"</span>
                ) : (
                  <span className="text-green-400">
                    Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          )}
        </Card>

        {/* Stats Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Volume</div>
                <div className="text-2xl font-bold">{stats.totalVolume}</div>
                <div className="text-green-400 text-sm mt-1">ETH</div>
              </div>
              <TrendingUp className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Transactions</div>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <div className="text-gray-500 text-sm mt-1">Last 20</div>
              </div>
              <Activity className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Successful</div>
                <div className="text-2xl font-bold">{stats.successfulTxs}</div>
                <div className="text-green-400 text-sm mt-1">
                  {stats.totalTransactions > 0 
                    ? `${Math.round((stats.successfulTxs / stats.totalTransactions) * 100)}%` 
                    : '0%'}
                </div>
              </div>
              <CheckCircle className="w-10 h-10 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Pending</div>
                <div className="text-2xl font-bold">{stats.pendingTxs}</div>
                <div className="text-yellow-400 text-sm mt-1">In Progress</div>
              </div>
              <Zap className="w-10 h-10 text-gray-700" />
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-red-900 bg-red-950/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-red-400 font-semibold">Error</h3>
                  <p className="text-gray-400">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-gray-800">
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-gray-700 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold mb-2">Loading Transactions</h3>
              <p className="text-gray-400">Fetching latest blockchain activity...</p>
            </div>
          </Card>
        )}

        {/* Transactions List */}
        {!loading && filteredTransactions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Recent Activity
              {searchQuery && (
                <span className="text-sm text-gray-400 ml-3 font-normal">
                  (Filtered by search)
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {filteredTransactions.map((tx, index) => {
                const network = getNetworkByChainId(tx.chain_id);
                const explorerUrl = network ? `${network.explorerBase}/tx/${tx.tx_hash}` : '#';
                
                return (
                <motion.div
                  key={tx.tx_hash}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover className="border-gray-800">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(tx.status)}
                          <div>
                            <div className="font-semibold text-lg">{tx.method}</div>
                            <div className="text-sm text-gray-400">
                              {tx.timestamp || new Date(tx.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <span className="text-sm">View Details</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Transaction Details */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm mb-1">From</div>
                          <div className="font-mono text-sm flex items-center gap-2">
                            {formatAddress(tx.from_address)}
                            <ArrowUpRight className="w-3 h-3 text-red-400" />
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400 text-sm mb-1">To</div>
                          <div className="font-mono text-sm flex items-center gap-2">
                            {formatAddress(tx.to_address)}
                            <ArrowDownLeft className="w-3 h-3 text-green-400" />
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400 text-sm mb-1">Value</div>
                          <div className="font-bold">{tx.value} {tx.token}</div>
                        </div>

                        <div>
                          <div className="text-gray-400 text-sm mb-1">Network</div>
                          <div className="text-sm">{network?.name || `Chain ${tx.chain_id}`}</div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid md:grid-cols-3 gap-4 pt-3 border-t border-gray-800">
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Hash</div>
                          <div className="font-mono text-xs break-all">{formatAddress(tx.tx_hash)}</div>
                        </div>
                        {tx.blockNumber && (
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Block</div>
                            <div className="font-mono text-xs">{tx.blockNumber}</div>
                          </div>
                        )}
                        {tx.confirmations !== undefined && (
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Confirmations</div>
                            <div className="text-xs">{tx.confirmations}</div>
                          </div>
                        )}
                        {tx.description && (
                          <div className="md:col-span-3">
                            <div className="text-gray-400 text-xs mb-1">Description</div>
                            <div className="text-xs">{tx.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )})}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <Card className="border-gray-800">
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
              <p className="text-gray-400">
                There are no recent transactions to display
              </p>
            </div>
          </Card>
        )}

        {/* Empty Search State */}
        {!loading && !error && transactions.length > 0 && filteredTransactions.length === 0 && searchQuery && (
          <Card className="border-gray-800">
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Matching Transactions</h3>
              <p className="text-gray-400 mb-4">
                No transactions found matching "{searchQuery}"
              </p>
              <Button onClick={clearSearch} variant="outline">
                Clear Search
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
