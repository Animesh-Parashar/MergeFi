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
  from_chain_id: number;
  to_chain_id?: number;
  description?: string;
  created_at: string;
}

interface TransactionWithDetails extends StoredTransaction {
  from_address?: string;
  to_address?: string;
  value?: string;
  token?: string;
  blockNumber?: string;
  confirmations?: number;
  fee?: string;
  method?: string;
  timestamp?: string;
  status?: string;
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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchLatestTransactions = async () => {
    const isRefresh = !loading;
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      // Fetch transactions from backend
      const response = await fetch(`${BACKEND_URL}/api/transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions from backend');
      }
      
      const data = await response.json();
      const storedTxs: StoredTransaction[] = data.transactions || [];

      if (storedTxs.length === 0) {
        setTransactions([]);
        setFilteredTransactions([]);
        setStats({
          totalTransactions: 0,
          successfulTxs: 0,
          totalVolume: '0',
          pendingTxs: 0,
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Enrich each transaction with Blockscout data
      const enrichedTxs: TransactionWithDetails[] = await Promise.all(
        storedTxs.map(async (tx): Promise<TransactionWithDetails> => {
          const fromNetwork = getNetworkByChainId(tx.from_chain_id);
          const toNetwork = tx.to_chain_id ? getNetworkByChainId(tx.to_chain_id) : null;
          
          // Primary network to lookup the transaction (prefer destination chain)
          const primaryNetwork = toNetwork || fromNetwork;
          
          if (!primaryNetwork) {
            console.warn(`⚠️ Unknown network for chain IDs ${tx.from_chain_id} -> ${tx.to_chain_id}`);
            return {
              ...tx,
              timestamp: new Date(tx.created_at).toLocaleString(),
              method: 'Unknown Network',
              status: 'error',
              from_address: 'Unknown Chain',
              to_address: 'Unknown Chain',
              value: '0',
              token: 'N/A',
            };
          }

          // Always try destination chain first (where the actual execution happens)
          const chainsToTry = toNetwork ? [toNetwork] : [fromNetwork!];

          for (const chainNetwork of chainsToTry) {
            try {
              console.log(`🔍 Looking up tx on ${chainNetwork.name}: ${tx.tx_hash.slice(0, 10)}...`);
              const blockscoutResponse = await fetch(
                `${chainNetwork.apiBase}/transactions/${tx.tx_hash}`
              );
              
              if (blockscoutResponse.ok) {
                const blockscoutData = await blockscoutResponse.json();
                
                // Check if result is actually success or pending
                const txStatus = blockscoutData.result || blockscoutData.status;
                console.log(`  ✅ Found on ${chainNetwork.name} - Status: ${txStatus}`);
                
                // Check for token transfers (USDC, USDT, etc.)
                let displayValue = '0.000000';
                let displayToken = chainNetwork.currency;
                
                if (blockscoutData.token_transfers && blockscoutData.token_transfers.length > 0) {
                  // Use the first token transfer (usually the main one)
                  const tokenTransfer = blockscoutData.token_transfers[0];
                  const tokenValue = tokenTransfer.total?.value || '0';
                  const tokenDecimals = parseInt(tokenTransfer.total?.decimals || tokenTransfer.token?.decimals || '18');
                  const tokenSymbol = tokenTransfer.token?.symbol || 'Unknown';
                  
                  // Convert token value based on decimals
                  displayValue = tokenValue === '0' ? '0.00' : (parseFloat(tokenValue) / Math.pow(10, tokenDecimals)).toFixed(tokenDecimals === 6 ? 2 : 6);
                  displayToken = tokenSymbol;
                  
                  console.log(`  💰 Token Transfer: ${displayValue} ${displayToken}`);
                } else {
                  // No token transfer, check native ETH value
                  const valueInWei = blockscoutData.value || '0';
                  displayValue = valueInWei === '0' ? '0.000000' : (parseFloat(valueInWei) / 1e18).toFixed(6);
                  displayToken = chainNetwork.currency;
                }
                
                // Parse fee
                const feeInWei = blockscoutData.fee?.value || blockscoutData.transaction_burnt_fee || '0';
                const feeInEth = feeInWei === '0' ? '0.000000' : (parseFloat(feeInWei) / 1e18).toFixed(6);
                
                // Get block number (try multiple fields)
                const blockNum = blockscoutData.block_number || blockscoutData.block || blockscoutData.height;
                
                return {
                  ...tx,
                  from_address: blockscoutData.from?.hash || blockscoutData.from || 'Unknown',
                  to_address: blockscoutData.to?.hash || blockscoutData.to || 'Unknown',
                  value: displayValue,
                  token: displayToken,
                  blockNumber: blockNum ? blockNum.toString() : 'Pending',
                  confirmations: blockscoutData.confirmations || 0,
                  fee: feeInEth,
                  method: blockscoutData.method || blockscoutData.tx_types?.[0] || 'transfer',
                  timestamp: blockscoutData.timestamp 
                    ? new Date(blockscoutData.timestamp).toLocaleString() 
                    : new Date(tx.created_at).toLocaleString(),
                  status: txStatus === 'success' || txStatus === 'ok' ? 'success' : (txStatus || 'pending'),
                };
              } else {
                console.warn(`  ⚠️ Not found on ${chainNetwork.name} (${blockscoutResponse.status})`);
              }
            } catch (err) {
              console.error(`  ❌ Error fetching from ${chainNetwork.name}:`, err);
            }
          }
          
          // Return with default values if blockscout fetch fails on all chains
          console.warn(`  ⚠️ Transaction ${tx.tx_hash.slice(0, 10)}... not found on any chain`);
          return {
            ...tx,
            timestamp: new Date(tx.created_at).toLocaleString(),
            method: 'Transfer',
            status: 'pending',
            from_address: 'Not Found',
            to_address: 'Not Found',
            value: '0.000000',
            token: primaryNetwork.currency,
          };
        })
      );

      setTransactions(enrichedTxs);
      setFilteredTransactions(enrichedTxs);

      // Calculate stats
      const totalTxs = enrichedTxs.length;
      const successfulTxs = enrichedTxs.filter(
        tx => tx.status === 'success' || tx.status === 'ok'
      ).length;
      const pendingTxs = enrichedTxs.filter(
        tx => tx.status === 'pending'
      ).length;
      
      // Calculate total volume in USDC (only count USDC/USDT transactions)
      const totalVolumeUSDC = enrichedTxs.reduce((sum, tx) => {
        // Only count stablecoin transactions (USDC, USDT)
        if (tx.token === 'USDC' || tx.token === 'USDT') {
          const value = parseFloat(tx.value || '0');
          return sum + (isNaN(value) ? 0 : value);
        }
        return sum;
      }, 0);

      setStats({
        totalTransactions: totalTxs,
        successfulTxs,
        totalVolume: totalVolumeUSDC.toFixed(2),
        pendingTxs,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
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

  const formatAddress = (address?: string): string => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status?: string) => {
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
                <div className="text-green-400 text-sm mt-1">USDC</div>
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
                const fromNetwork = getNetworkByChainId(tx.from_chain_id);
                const toNetwork = tx.to_chain_id ? getNetworkByChainId(tx.to_chain_id) : null;
                const displayNetwork = toNetwork || fromNetwork; // Use destination chain for explorer link
                const explorerUrl = displayNetwork ? `${displayNetwork.explorerBase}/tx/${tx.tx_hash}` : '#';
                const isCrossChain = tx.to_chain_id && tx.to_chain_id !== tx.from_chain_id;
                
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
                          <div className="text-gray-400 text-sm mb-1">
                            {isCrossChain ? 'From → To Network' : 'Network'}
                          </div>
                          <div className="text-sm">
                            {isCrossChain ? (
                              <span>
                                {fromNetwork?.name || `Chain ${tx.from_chain_id}`}
                                <span className="text-gray-500 mx-1">→</span>
                                {toNetwork?.name || `Chain ${tx.to_chain_id}`}
                              </span>
                            ) : (
                              <span>{fromNetwork?.name || `Chain ${tx.from_chain_id}`}</span>
                            )}
                          </div>
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
