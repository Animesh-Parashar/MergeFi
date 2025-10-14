import { motion } from 'framer-motion';
import { Home, DollarSign, Brain, Settings, LogOut, Github, ExternalLink, Users, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Repository {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  isOwner: boolean;
  contributorsCount: number;
  hasSmartContract: boolean;
}

const mockRepos: Repository[] = [
  {
    id: '1',
    name: 'awesome-web3-toolkit',
    description: 'A comprehensive toolkit for building decentralized applications',
    lastUpdated: '2 days ago',
    isOwner: true,
    contributorsCount: 8,
    hasSmartContract: false
  },
  {
    id: '2',
    name: 'blockchain-payment-gateway',
    description: 'Open-source payment gateway with multi-chain support',
    lastUpdated: '5 days ago',
    isOwner: true,
    contributorsCount: 12,
    hasSmartContract: true
  },
  {
    id: '3',
    name: 'defi-analytics-platform',
    description: 'Real-time analytics dashboard for DeFi protocols',
    lastUpdated: '1 week ago',
    isOwner: false,
    contributorsCount: 15,
    hasSmartContract: true
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'owned' | 'contributed'>('owned');
  const [activePage, setActivePage] = useState<'dashboard' | 'payouts' | 'ai-split' | 'settings'>('dashboard');
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  const urlParams = new URLSearchParams(window.location.search);
const login = urlParams.get('login');
const repos = urlParams.get('repos');
const contributors = urlParams.get('contributors');
console.log(login);
console.log(repos);
console.log(contributors);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSetupRevenue = (repoId: string) => {
    navigate(`/revenue-split/${repoId}`);
  };

  const handleViewEarnings = (repoId: string) => {
    navigate(`/earnings/${repoId}`);
  };

  const filteredRepos = mockRepos.filter(repo =>
    activeTab === 'owned' ? repo.isOwner : !repo.isOwner
  );

  const sidebarItems = [
    { id: 'dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'payouts', icon: <DollarSign className="w-5 h-5" />, label: 'Payouts' },
    { id: 'ai-split', icon: <Brain className="w-5 h-5" />, label: 'AI Split' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800/50 flex flex-col"
      >
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-cyan-400">
              CollabPay
            </span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={user?.username || 'User'}
              className="w-10 h-10 rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.username || 'User'}</p>
              <div className="flex items-center space-x-1 text-xs text-cyan-400">
                <Github className="w-3 h-3" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 5 }}
              onClick={() => setActivePage(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                activePage === item.id
                  ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <motion.button
            whileHover={{ x: 5 }}
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto p-8"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">
              {activePage === 'dashboard' ? 'Your Repositories' : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h1>
            <p className="text-slate-400">
              {activePage === 'dashboard'
                ? 'Manage revenue sharing for your GitHub projects'
                : 'Manage your settings and preferences'}
            </p>
          </div>

          {activePage === 'dashboard' && (
            <>
              <div className="flex space-x-4 mb-6 border-b border-slate-800/50">
                <button
                  onClick={() => setActiveTab('owned')}
                  className={`px-4 py-3 font-semibold transition-colors relative ${
                    activeTab === 'owned'
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Owned Repositories
                  {activeTab === 'owned' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('contributed')}
                  className={`px-4 py-3 font-semibold transition-colors relative ${
                    activeTab === 'contributed'
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Contributed Repositories
                  {activeTab === 'contributed' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                    />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredRepos.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                            <GitBranch className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-bold text-white font-mono">
                                {repo.name}
                              </h3>
                              {repo.hasSmartContract && (
                                <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-semibold">
                                  ✓ DEPLOYED
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 mb-3">
                              {repo.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{repo.contributorsCount} contributors</span>
                              </div>
                              <span>•</span>
                              <span>Updated {repo.lastUpdated}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`https://github.com/${user?.username || 'user'}/${repo.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>

                      <div className="flex space-x-3">
                        {repo.isOwner ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSetupRevenue(repo.id)}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                              repo.hasSmartContract
                                ? 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-cyan-500/30'
                                : 'bg-cyan-600 hover:bg-cyan-600/80 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                            }`}
                          >
                            {repo.hasSmartContract ? 'Manage Revenue Split' : 'Setup Revenue Split'}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewEarnings(repo.id)}
                            className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-600/80 rounded-xl font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                          >
                            View Earnings
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {activePage !== 'dashboard' && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
                {activePage === 'payouts' && <DollarSign className="w-8 h-8" />}
                {activePage === 'ai-split' && <Brain className="w-8 h-8" />}
                {activePage === 'settings' && <Settings className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {activePage.charAt(0).toUpperCase() + activePage.slice(1)} Section
              </h3>
              <p className="text-slate-400">
                This section is coming soon
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
