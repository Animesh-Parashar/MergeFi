import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingUp, ExternalLink, Copy, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Payment {
  id: string;
  amount: string;
  currency: string;
  date: string;
  txHash: string;
  status: 'completed' | 'pending';
}

const mockPayments: Payment[] = [
  {
    id: '1',
    amount: '450.00',
    currency: 'PYUSD',
    date: '2025-10-12',
    txHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    status: 'completed'
  },
  {
    id: '2',
    amount: '320.50',
    currency: 'PYUSD',
    date: '2025-10-05',
    txHash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u',
    status: 'completed'
  },
  {
    id: '3',
    amount: '275.75',
    currency: 'PYUSD',
    date: '2025-09-28',
    txHash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v',
    status: 'completed'
  },
  {
    id: '4',
    amount: '410.25',
    currency: 'PYUSD',
    date: '2025-09-21',
    txHash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w',
    status: 'completed'
  },
  {
    id: '5',
    amount: '385.00',
    currency: 'PYUSD',
    date: '2025-09-14',
    txHash: '0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x',
    status: 'completed'
  }
];

const repoMockData: Record<string, { name: string; description: string; contractAddress: string }> = {
  '1': {
    name: 'awesome-web3-toolkit',
    description: 'A comprehensive toolkit for building decentralized applications',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  },
  '2': {
    name: 'blockchain-payment-gateway',
    description: 'Open-source payment gateway with multi-chain support',
    contractAddress: '0x842d35Cc6634C0532925a3b844Bc9e7595f0bEc'
  },
  '3': {
    name: 'defi-analytics-platform',
    description: 'Real-time analytics dashboard for DeFi protocols',
    contractAddress: '0x942d35Cc6634C0532925a3b844Bc9e7595f0bEd'
  }
};

export default function ContributorEarnings() {
  const navigate = useNavigate();
  const { repoId } = useParams<{ repoId: string }>();
  const [payments] = useState(mockPayments);

  const currentRepo = repoMockData[repoId || '1'] || repoMockData['1'];

  const totalEarnings = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const lastPayment = payments.length > 0 ? payments[0] : null;
  const contributionScore = 28;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const earningsData = [
    { month: 'Sep W1', amount: 385 },
    { month: 'Sep W2', amount: 410 },
    { month: 'Sep W3', amount: 275 },
    { month: 'Oct W1', amount: 320 },
    { month: 'Oct W2', amount: 450 }
  ];

  const maxAmount = Math.max(...earningsData.map((d) => d.amount));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-white font-mono">
            {currentRepo.name}
          </h1>
          <p className="text-slate-400">Your earnings and contribution metrics</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-semibold">Total Earnings</span>
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ${totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-cyan-400 font-mono">PYUSD</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-violet-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-semibold">Latest Payout</span>
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ${lastPayment ? lastPayment.amount : '0.00'}
              </div>
              <div className="text-sm text-slate-400">
                {lastPayment ? new Date(lastPayment.date).toLocaleDateString() : 'No payments yet'}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-semibold">Contribution Score</span>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{contributionScore}%</div>
              <div className="text-sm text-slate-400">of total revenue</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Earnings Over Time</h3>
            <div className="h-64 flex items-end justify-between space-x-4">
              {earningsData.map((data, index) => (
                <motion.div
                  key={data.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="mb-2 text-sm font-semibold text-cyan-400"
                  >
                    ${data.amount}
                  </motion.div>
                  <div className="w-full bg-cyan-600 rounded-t-lg"></div>
                  <div className="mt-3 text-xs text-slate-400 font-mono">{data.month}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-semibold">Smart Contract Address</span>
              <button
                onClick={() => copyToClipboard(currentRepo.contractAddress)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <code className="text-cyan-400 font-mono text-sm break-all">{currentRepo.contractAddress}</code>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold mb-6">Payment History</h2>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/30 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {payments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-slate-300 font-mono text-sm">
                          {new Date(payment.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-semibold">${payment.amount}</div>
                          <div className="text-xs text-cyan-400 font-mono">{payment.currency}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {payment.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://blockscout.com/tx/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span className="font-mono text-sm">
                            {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-8)}
                          </span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
