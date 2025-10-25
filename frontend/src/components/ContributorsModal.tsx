import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnalysisModal from "./AnalysisModal.tsx";

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  name?: string;
  company?: string;
  location?: string;
  bio?: string;
  followers: number;
  following: number;
  type: string;
}

interface ContributorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
}

const ContributorsModal: React.FC<ContributorsModalProps> = ({
  isOpen,
  onClose,
  owner,
  repo,
}) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedContributor, setSelectedContributor] =
    useState<Contributor | null>(null);

  useEffect(() => {
    if (isOpen && owner && repo) {
      fetchContributors();
    } // Reset selected contributor when modal re-opens
    if (!isOpen) {
      setSelectedContributor(null);
    }
  }, [isOpen, owner, repo]);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/maintainer/${owner}/${repo}/contributors`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (response.ok) {
        setContributors(data.contributors);
        console.log(data.contributors)
      } else {
        console.error("Error fetching contributors:", data.error);
      }
    } catch (error) {
      console.error("Error fetching contributors:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleAnalyzeClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Contributors</h2>
                <p className="text-gray-400">
                  {owner}/{repo}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.total_contributors}
                  </div>
                  <div className="text-sm text-gray-400">Contributors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.total_contributions}
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Contributions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.average_contributions}
                  </div>
                  <div className="text-sm text-gray-400">Avg Contributions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.top_contributor?.contributions || 0}
                  </div>
                  <div className="text-sm text-gray-400">Top Contributor</div>
                </div>
              </div>
            )}
          </div>

          {/* Contributors List */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white">Loading contributors...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {contributors.map((contributor) => (
                  <motion.div
                    key={contributor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">
                            {contributor.name || contributor.login}
                          </h3>
                          <span className="text-sm text-gray-400">
                            @{contributor.login}
                          </span>
                        </div>
                        {contributor.bio && (
                          <p className="text-sm text-gray-400 mt-1 max-w-md truncate">
                            {contributor.bio}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          {contributor.company && (
                            <span>🏢 {contributor.company}</span>
                          )}
                          {contributor.location && (
                            <span>📍 {contributor.location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {contributor.contributions}
                      </div>
                      <div className="text-sm text-gray-400">contributions</div>
                      <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                        <span>{contributor.followers} followers</span>
                        <span>{contributor.following} following</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-32 ml-4">
                      <a
                        href={contributor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm text-center"
                      >
                        View Profile
                      </a>

                      <button
                        onClick={() => handleAnalyzeClick(contributor)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm text-center"
                      >
                        Analyze
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      {selectedContributor && (
        <AnalysisModal
          key="analysisModal"
          isOpen={!!selectedContributor}
          onClose={() => setSelectedContributor(null)}
          owner={owner}
          repo={repo}
          contributor={selectedContributor}
        />
      )}
    </AnimatePresence>
  );
};

export default ContributorsModal;
