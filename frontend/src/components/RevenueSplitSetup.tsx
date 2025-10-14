import { motion } from 'framer-motion';
import { ArrowLeft, Users, Brain, Rocket, ExternalLink, CheckCircle, Copy } from 'lucide-react';
import { useState } from 'react';

interface Contributor {
  id: string;
  username: string;
  avatar: string;
  commits: number;
  suggestedPercent: number;
  editablePercent: number;
}

const mockContributors: Contributor[] = [
  {
    id: '1',
    username: 'alice_dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    commits: 342,
    suggestedPercent: 45,
    editablePercent: 45
  },
  {
    id: '2',
    username: 'bob_engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    commits: 218,
    suggestedPercent: 28,
    editablePercent: 28
  },
  {
    id: '3',
    username: 'charlie_code',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    commits: 156,
    suggestedPercent: 20,
    editablePercent: 20
  },
  {
    id: '4',
    username: 'diana_tech',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
    commits: 54,
    suggestedPercent: 7,
    editablePercent: 7
  }
];

interface RevenueSplitSetupProps {
  repoName: string;
  repoDescription: string;
  onBack: () => void;
  onDeploy: () => void;
}

export default function RevenueSplitSetup({
  repoName,
  repoDescription,
  onBack,
  onDeploy
}: RevenueSplitSetupProps) {
  const [contributors, setContributors] = useState(mockContributors);
  const [isDeployed, setIsDeployed] = useState(false);
  const [contractAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  const [txHash] = useState('0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t');

  const totalPercent = contributors.reduce((sum, c) => sum + c.editablePercent, 0);

  const handlePercentChange = (id: string, value: number) => {
    setContributors(
      contributors.map((c) =>
        c.id === id ? { ...c, editablePercent: Math.max(0, Math.min(100, value)) } : c
      )
    );
  };

  const handleAISuggest = () => {
    const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0);
    setContributors(
      contributors.map((c) => ({
        ...c,
        editablePercent: Math.round((c.commits / totalCommits) * 100)
      }))
    );
  };

  const handleDeploy = () => {
    setIsDeployed(true);
    onDeploy();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={onBack}
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
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 text-white font-mono">
                  {repoName}
                </h1>
                <p className="text-slate-400 mb-4">{repoDescription}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{contributors.length} contributors</span>
                  </div>
                </div>
              </div>
              <a
                href={`https://github.com/${repoName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Revenue Split Configuration</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAISuggest}
              className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
            >
              <Brain className="w-5 h-5" />
              <span>Auto Suggest Split (AI)</span>
            </motion.button>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/30 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Contributor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Commits
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Suggested %
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Split %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {contributors.map((contributor, index) => (
                    <motion.tr
                      key={contributor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={contributor.avatar}
                            alt={contributor.username}
                            className="w-10 h-10 rounded-lg"
                          />
                          <span className="font-medium font-mono text-cyan-400">
                            {contributor.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 font-mono">
                          {contributor.commits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-violet-400 font-semibold font-mono">
                          {contributor.suggestedPercent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={contributor.editablePercent}
                            onChange={(e) =>
                              handlePercentChange(contributor.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-center font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/30 border-t border-slate-700/50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-bold">
                      Total:
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold font-mono text-lg ${
                          totalPercent === 100
                            ? 'text-cyan-400'
                            : totalPercent > 100
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {totalPercent}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {totalPercent !== 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
            >
              <p className="text-yellow-400 text-sm">
                ⚠️ Total percentage must equal 100% before deploying the smart contract.
                Currently at {totalPercent}%.
              </p>
            </motion.div>
          )}
        </motion.div>

        {!isDeployed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeploy}
              disabled={totalPercent !== 100}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all ${
                totalPercent === 100
                  ? 'bg-gradient-to-r from-cyan-600 to-violet-600 shadow-cyan-500/30 hover:shadow-cyan-500/50'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Rocket className="w-6 h-6" />
              <span>Deploy Smart Contract</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8"
          >
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-cyan-400">
                  Smart Contract Deployed Successfully!
                </h3>
                <p className="text-slate-400">
                  Your revenue splitter contract is now live on the blockchain.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 font-semibold">Contract Address</span>
                  <button
                    onClick={() => copyToClipboard(contractAddress)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-cyan-400 font-mono text-sm break-all">{contractAddress}</code>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 font-semibold">Transaction Hash</span>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={`https://blockscout.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <code className="font-mono text-sm break-all">{txHash}</code>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
