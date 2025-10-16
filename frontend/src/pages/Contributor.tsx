import { motion } from 'framer-motion';
import {
  DollarSign,
  Award,
  GitMerge,
  TrendingUp,
  ExternalLink,
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

export function Contributor() {
  const earningsData = [
    { month: 'Jan', earnings: 320 },
    { month: 'Feb', earnings: 580 },
    { month: 'Mar', earnings: 750 },
    { month: 'Apr', earnings: 920 },
    { month: 'May', earnings: 1180 },
    { month: 'Jun', earnings: 1540 },
  ];

  const mergedPRs = [
    {
      id: 1,
      repo: 'awesome-blockchain',
      pr: '#234',
      title: 'Implement multi-sig wallet',
      reward: 275,
      date: '2025-06-15',
    },
    {
      id: 2,
      repo: 'defi-toolkit',
      pr: '#189',
      title: 'Add staking mechanism',
      reward: 180,
      date: '2025-06-10',
    },
    {
      id: 3,
      repo: 'awesome-blockchain',
      pr: '#201',
      title: 'Fix transaction validation',
      reward: 220,
      date: '2025-06-05',
    },
    {
      id: 4,
      repo: 'web3-starter',
      pr: '#87',
      title: 'Update dependencies',
      reward: 95,
      date: '2025-05-28',
    },
  ];

  const badges = [
    {
      name: 'awesome-blockchain',
      contributions: 12,
      level: 'Gold',
      color: 'from-yellow-600 to-yellow-400',
    },
    {
      name: 'defi-toolkit',
      contributions: 7,
      level: 'Silver',
      color: 'from-gray-500 to-gray-300',
    },
    {
      name: 'web3-starter',
      contributions: 3,
      level: 'Bronze',
      color: 'from-orange-700 to-orange-500',
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
            Contributor Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Track your contributions, earnings, and achievement badges
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
                <div className="text-3xl font-bold">$1,540</div>
                <div className="text-green-400 text-sm mt-1">PyUSD</div>
              </div>
              <DollarSign className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Merged PRs</div>
                <div className="text-3xl font-bold">22</div>
                <div className="text-gray-500 text-sm mt-1">Across 3 repos</div>
              </div>
              <GitMerge className="w-12 h-12 text-gray-700" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">NFT Badges</div>
                <div className="text-3xl font-bold">3</div>
                <div className="text-gray-500 text-sm mt-1">1 Gold, 1 Silver</div>
              </div>
              <Award className="w-12 h-12 text-gray-700" />
            </div>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Earnings Growth</h2>
          <Card>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
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
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Contributions</h2>
            <div className="space-y-4">
              {mergedPRs.map((pr, index) => (
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
                      <ExternalLink className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <div className="text-sm text-gray-400">Reward</div>
                      <div className="font-bold text-green-400">
                        ${pr.reward} PyUSD
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Achievement Badges</h2>
            <div className="space-y-4">
              {badges.map((badge, index) => (
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
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Contribution History</h2>
          <Card>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-500">
                $ collab-pay history --user contributor.eth
              </div>
              <div className="space-y-1 mt-4">
                <div className="text-gray-400">
                  [2025-06-15] → awesome-blockchain #234 | $275 PyUSD ✓
                </div>
                <div className="text-gray-400">
                  [2025-06-10] → defi-toolkit #189 | $180 PyUSD ✓
                </div>
                <div className="text-gray-400">
                  [2025-06-05] → awesome-blockchain #201 | $220 PyUSD ✓
                </div>
                <div className="text-gray-400">
                  [2025-05-28] → web3-starter #87 | $95 PyUSD ✓
                </div>
                <div className="text-gray-500 mt-4">
                  Total: 22 contributions | $1,540 PyUSD earned
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
