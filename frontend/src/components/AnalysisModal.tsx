import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import axios from "axios";

// Interface for the Contributor (passed from parent)
interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  name?: string;
}

// Interface for a Merged Pull Request (from Step 1)
interface MergedPR {
  id: number;
  number: number;
  title: string;
  created_at: string;
  merged_at: string;
  html_url: string;
  user: {
    login: string;
  };
}

// Interface for the Analysis Data (from Step 2)
interface PRAnalysisData {
  prBody: string | null;
  diffContent: string;
  issueBody: string | null;
}

// Interface for the AI Analysis Result (from Step 3)
interface AnalysisResult {
  solves_issue: boolean;
  analysis_notes: string;
  quality_rating: number;
  complexity: string;
  contribution_weight: number;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  contributor: Contributor;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  owner,
  repo,
  contributor,
}) => {
  const [mergedPRs, setMergedPRs] = useState<MergedPR[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the analysis part
  const [selectedPR, setSelectedPR] = useState<MergedPR | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  // 1. Fetch Merged PRs when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMergedPRs();
    } else {
      // Reset state when closed
      setMergedPRs([]);
      setLoadingPRs(true);
      setError(null);
      setSelectedPR(null);
      setLoadingAnalysis(false);
      setAnalysisResult(null);
    }
  }, [isOpen]);

  const fetchMergedPRs = async () => {
    setLoadingPRs(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/maintainer/${owner}/${repo}/${contributor.login}/merged-prs`,
        { withCredentials: true }
      );
      setMergedPRs(response.data);
    } catch (err: any) {
      console.error("Error fetching merged PRs:", err);
      setError(err.response?.data?.error || "Failed to fetch merged PRs");
    } finally {
      setLoadingPRs(false);
    }
  };

  // 2. Handle the "Analyze" button click
  const handleAnalyzePR = async (pr: MergedPR) => {
    setSelectedPR(pr);
    setLoadingAnalysis(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const analysisDataRes = await axios.get<PRAnalysisData>(
        `http://localhost:5000/api/maintainer/${owner}/${repo}/pr-data/${pr.number}`,
        { withCredentials: true }
      );

      const { prBody, diffContent, issueBody } = analysisDataRes.data;
      const geminiRes = await axios.post<AnalysisResult>(
        `http://localhost:5000/api/ai/analyze-pr`,
        { prBody, diffContent, issueBody }, // Send the data in the request body
        { withCredentials: true }
      );

      setAnalysisResult(geminiRes.data);
      console.log("Analysis Result:", geminiRes.data);
    } catch (err: any) {
      console.error("Error during analysis:", err);
      setError(err.response?.data?.error || "Failed to analyze PR");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="analysisBackdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Analyze Contributions
                  </h2>
                  <p className="text-gray-400">
                    {contributor.name || contributor.login} on {owner}/{repo}
                  </p>
                </div>
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

            {/* Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-6">
              {/* Left Column: Merged PRs List */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-white">
                  Merged Pull Requests ({mergedPRs.length})
                </h3>
                {loadingPRs ? (
                  <div className="text-gray-400">Loading PRs...</div>
                ) : error ? (
                  <div className="text-red-400">{error}</div>
                ) : mergedPRs.length === 0 ? (
                  <div className="text-gray-400">
                    No merged PRs found for this contributor.
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                    {mergedPRs.map((pr) => (
                      <div
                        key={pr.id}
                        className="bg-gray-800 p-3 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <a
                              href={pr.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-medium hover:underline truncate"
                            >
                              {pr.number}: {pr.title}
                            </a>
                            <p className="text-sm text-gray-400">
                              Merged {formatDate(pr.merged_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAnalyzePR(pr)}
                            disabled={
                              loadingAnalysis && selectedPR?.id === pr.id
                            }
                            className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                          >
                            {loadingAnalysis && selectedPR?.id === pr.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Analyze"
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Analysis Result */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-white">
                  AI Analysis
                </h3>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[300px]">
                  {loadingAnalysis ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      <p className="mt-3">
                        Analyzing PR #{selectedPR?.number}...
                      </p>
                      <p className="text-sm">This may take a moment.</p>
                    </div>
                  ) : analysisResult ? (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-white">
                        Analysis for PR #{selectedPR?.number}
                      </h4>
                      <div className="space-y-2 text-gray-200">
                        <p>
                          <strong>Solves Issue:</strong>{" "}
                          {analysisResult.solves_issue ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Complexity:</strong>{" "}
                          {analysisResult.complexity || "N/A"}
                        </p>
                        <p>
                          <strong>Quality Rating:</strong>{" "}
                          {analysisResult.quality_rating ?? 0} / 10
                        </p>
                        <p>
                          <strong>Notes:</strong>{" "}
                          {analysisResult.analysis_notes || "No notes available"}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                          Contribution Weight:
                        </p>
                        <p className="text-3xl font-bold text-green-400">
                          {analysisResult.contribution_weight ?? 0} <span className="text-lg">/ 10</span>
                          
                        </p>
                      </div>
                      <button
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(analysisResult.contribution_weight ?? 0) <= 0}
                      >
                        Add to Payout
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Select a PR to analyze.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalysisModal;
