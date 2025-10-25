import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Repository {
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  pool_reward: number;
  owner: string;
  repo: string;
}

export function ListedRepos() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchListedRepos();
  }, []);

  useEffect(() => {
    filterRepositories();
  }, [searchQuery, selectedLanguage, repositories]);

  const fetchListedRepos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/repos/all-listed');
      if (response.data.success) {
        setRepositories(response.data.repos);
        setFilteredRepos(response.data.repos);
      }
    } catch (error) {
      console.error('Error fetching listed repos:', error);
    }
    setLoading(false);
  };

  const filterRepositories = () => {
    let filtered = repositories;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        repo =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(repo => repo.language === selectedLanguage);
    }

    setFilteredRepos(filtered);
  };

  const languages = ['all', ...new Set(repositories.map(repo => repo.language).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Open for Contributions
          </h1>
          <p className="text-gray-400 text-lg">
            Browse all repositories actively seeking contributors with reward pools
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-10 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              {/* Language Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-white"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'all' ? 'All Languages' : lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-wrap gap-4 text-sm text-gray-400"
        >
          <div>
            Total Repositories: <span className="text-white font-bold">{repositories.length}</span>
          </div>
          <div>•</div>
          <div>
            Showing: <span className="text-white font-bold">{filteredRepos.length}</span>
          </div>
          <div>•</div>
          <div>
            Total Pool Rewards: <span className="text-green-400 font-bold">
              ${repositories.reduce((sum, repo) => sum + (repo.pool_reward || 0), 0).toLocaleString()} USDC
            </span>
          </div>
        </motion.div>

        {/* Repositories Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
              <span className="text-gray-400">Loading repositories...</span>
            </div>
          </div>
        ) : filteredRepos.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {searchQuery || selectedLanguage !== 'all'
                  ? 'No repositories match your filters'
                  : 'No repositories open for contributions yet'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo, index) => (
              <motion.div
                key={repo.github_repo_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="h-full flex flex-col">
                  {/* Header with Repo Name and Stats */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-2 text-white">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {repo.full_name}
                      </p>
                    </div>
                    {repo.language && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-xs">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-grow">
                    {repo.description || 'No description provided'}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{repo.stargazers_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>{repo.forks_count || 0}</span>
                    </div>
                  </div>

                  {/* Pool Reward Section */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div>
                      <div className="text-sm font-semibold text-gray-300">
                        Pool: <span className="text-green-400">${repo.pool_reward?.toLocaleString() || 0}</span> USDC
                      </div>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded text-sm hover:bg-gray-800 hover:border-gray-600 transition-colors"
                    >
                      View Repo
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}