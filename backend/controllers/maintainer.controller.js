import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../utils/supabase.js';

// ================================
//  MAINTAINER CONTROL (MAIN STATS)
// ================================
export const maintainercontrol = async (req, res) => {
  const { github_token } = req.cookies;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch user and owned repositories
    const [userRes, repoRes] = await Promise.all([
      axios.get(`https://api.github.com/user`, {
        headers: { Authorization: `Bearer ${github_token}` },
      }),
      axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${github_token}` },
        params: {
          sort: "updated",
          per_page: 50,
          type: "owner", // Only owned repos
        },
      }),
    ]);

    const user = userRes.data;
    const repos = repoRes.data.filter((repo) => !repo.fork); // Exclude forked repos

    // Get detailed info for owned repos
    const repoDetails = await Promise.all(
      repos.slice(0, 20).map(async (repo) => {
        try {
          const [contributorsRes, issuesRes, pullsRes] = await Promise.all([
            axios
              .get(
                `https://api.github.com/repos/${repo.full_name}/contributors`,
                {
                  headers: { Authorization: `Bearer ${github_token}` },
                  params: { per_page: 20 },
                }
              )
              .catch(() => ({ data: [] })),

            axios
              .get(`https://api.github.com/repos/${repo.full_name}/issues`, {
                headers: { Authorization: `Bearer ${github_token}` },
                params: { state: "open", per_page: 10 },
              })
              .catch(() => ({ data: [] })),

            axios
              .get(`https://api.github.com/repos/${repo.full_name}/pulls`, {
                headers: { Authorization: `Bearer ${github_token}` },
                params: { state: "open", per_page: 10 },
              })
              .catch(() => ({ data: [] })),
          ]);

          console.log(`Fetched maintainer data for ${repo.full_name}`);

          return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            private: repo.private,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            watchers_count: repo.watchers_count,
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            contributors: contributorsRes.data,
            open_issues: issuesRes.data,
            open_prs: pullsRes.data,
            stats: {
              contributors_count: contributorsRes.data.length,
              open_issues_count: issuesRes.data.length,
              open_prs_count: pullsRes.data.length,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching maintainer data for ${repo.full_name}:`,
            error.message
          );
          return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            private: repo.private,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            watchers_count: repo.watchers_count,
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            contributors: [],
            open_issues: [],
            open_prs: [],
            stats: {
              contributors_count: 0,
              open_issues_count: 0,
              open_prs_count: 0,
            },
          };
        }
      })
    );

    const maintainerStats = {
      total_owned_repos: repos.length,
      total_stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      total_forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      total_contributors: repoDetails.reduce(
        (sum, repo) => sum + repo.stats.contributors_count,
        0
      ),
      total_open_issues: repoDetails.reduce(
        (sum, repo) => sum + repo.stats.open_issues_count,
        0
      ),
      total_open_prs: repoDetails.reduce(
        (sum, repo) => sum + repo.stats.open_prs_count,
        0
      ),
      most_popular_repo: repos.reduce(
        (max, repo) =>
          repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max,
        null
      ),
    };

    res.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        company: user.company,
        location: user.location,
        bio: user.bio,
      },
      repositories: repoDetails,
      stats: maintainerStats,
    });
  } catch (err) {
    console.error("Error in /api/maintainer:", err);
    res.status(500).json({
      error: "Failed to fetch maintainer data",
      message: err.message,
    });
  }
};

export const getMaintainerStats = maintainercontrol;

// ================================
//  REPO CONTRIBUTORS
// ================================
export const getRepoContributors = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const contributorsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: { Authorization: `Bearer ${github_token}` },
        params: { per_page: 100 },
      }
    );
    console.log(contributorsRes.data);

    const detailedContributors = await Promise.all(
      contributorsRes.data.map(async (contributor) => {
        try {
          const userRes = await axios.get(
            `https://api.github.com/users/${contributor.login}`,
            {
              headers: { Authorization: `Bearer ${github_token}` },
            }
          );

          return {
            id: contributor.id,
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url,
            contributions: contributor.contributions,
            type: contributor.type,
            name: userRes.data.name,
            company: userRes.data.company,
            location: userRes.data.location,
            bio: userRes.data.bio,
            public_repos: userRes.data.public_repos,
            followers: userRes.data.followers,
            following: userRes.data.following,
          };
        } catch (error) {
          console.error(
            `Error fetching user details for ${contributor.login}:`,
            error.message
          );
          return {
            id: contributor.id,
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url,
            contributions: contributor.contributions,
            type: contributor.type,
            name: null,
            company: null,
            location: null,
            bio: null,
            public_repos: 0,
            followers: 0,
            following: 0,
          };
        }
      })
    );

    const stats = {
      total_contributors: detailedContributors.length,
      total_contributions: detailedContributors.reduce(
        (sum, c) => sum + c.contributions,
        0
      ),
      top_contributor: detailedContributors.reduce(
        (top, c) => (c.contributions > (top?.contributions || 0) ? c : top),
        null
      ),
      average_contributions: Math.round(
        detailedContributors.reduce((sum, c) => sum + c.contributions, 0) /
        detailedContributors.length
      ),
    };

    res.json({
      repository: { owner, name: repo, full_name: `${owner}/${repo}` },
      contributors: detailedContributors,
      stats,
    });
  } catch (err) {
    console.error(`Error fetching contributors for ${owner}/${repo}:`, err);
    res.status(500).json({
      error: "Failed to fetch repository contributors",
      message: err.message,
    });
  }
};

// ================================
//  CONTRIBUTORS WITH WALLETS
// ================================
export const getRepoContributorsWithWallets = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { supabase } = await import("../utils/supabase.js");

    const contributorsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: { Authorization: `Bearer ${github_token}` },
        params: { per_page: 100 },
      }
    );

    const detailedContributors = await Promise.all(
      contributorsRes.data.map(async (contributor) => {
        try {
          const userRes = await axios.get(
            `https://api.github.com/users/${contributor.login}`,
            {
              headers: { Authorization: `Bearer ${github_token}` },
            }
          );

          const { data: walletData } = await supabase
            .from("address_and_chain")
            .select("walletaddress, chain")
            .eq("github_username", contributor.login)
            .single();

          return {
            id: contributor.id,
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url,
            contributions: contributor.contributions,
            type: contributor.type,
            name: userRes.data.name,
            company: userRes.data.company,
            location: userRes.data.location,
            bio: userRes.data.bio,
            public_repos: userRes.data.public_repos,
            followers: userRes.data.followers,
            following: userRes.data.following,
            walletAddress: walletData?.walletaddress || null,
            chainId: walletData?.chain || null,
          };
        } catch (error) {
          console.error(
            `Error fetching user details for ${contributor.login}:`,
            error.message
          );
          return {
            id: contributor.id,
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url,
            contributions: contributor.contributions,
            type: contributor.type,
            walletAddress: null,
            chainId: null,
          };
        }
      })
    );

    res.json({
      repository: { owner, name: repo, full_name: `${owner}/${repo}` },
      contributors: detailedContributors,
    });
  } catch (err) {
    console.error(
      `Error fetching contributors with wallets for ${owner}/${repo}:`,
      err
    );
    res.status(500).json({
      error: "Failed to fetch repository contributors with wallet data",
      message: err.message,
    });
  }
};

// ================================
//  CONTRIBUTOR COMMITS
// ================================
export const getContributorCommits = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo, username } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!owner || !repo || !username) {
    return res.status(400).json({ error: "Missing owner, repo, or username" });
  }

  try {
    const commitsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `Bearer ${github_token}` },
        params: { author: username, per_page: 50 },
      }
    );

    res.json(commitsRes.data);
  } catch (err) {
    console.error(
      `Error fetching commits for ${username} in ${owner}/${repo}:`,
      err
    );
    res.status(500).json({
      error: "Failed to fetch contributor commits",
      message: err.message,
    });
  }
};

// ================================
//  CONTRIBUTOR MERGED PRS
// ================================
export const getContributorMergedPRs = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo, username } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const query = `repo:${owner}/${repo} type:pr is:merged author:${username}`;
    const searchRes = await axios.get(`https://api.github.com/search/issues`, {
      headers: { Authorization: `Bearer ${github_token}` },
      params: { q: query, per_page: 50 },
    });

    res.json(searchRes.data.items);
  } catch (err) {
    console.error(`Error fetching merged PRs for ${username}:`, err);
    res.status(500).json({
      error: "Failed to fetch merged PRs",
      message: err.message,
    });
  }
};

// ================================
//  PR ANALYSIS DATA
// ================================
export const getPRAnalysisData = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo, prNumber } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const prRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers: { Authorization: `Bearer ${github_token}` } }
    );

    const prBody = prRes.data.body || "";

    const diffRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: "application/vnd.github.v3.diff",
        },
      }
    );

    const diffContent = diffRes.data;

    let issueBody = null;
    const issueRegex = /(?:closes?|fixes?|resolves?) #(\d+)/i;
    const match = prBody.match(issueRegex);

    if (match) {
      const issueNumber = match[1];
      try {
        const issueRes = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
          { headers: { Authorization: `Bearer ${github_token}` } }
        );
        issueBody = issueRes.data.body;
      } catch (issueError) {
        console.warn(
          `Could not fetch linked issue #${issueNumber}:`,
          issueError.message
        );
      }
    }

    res.json({ prBody, diffContent, issueBody });
  } catch (err) {
    console.error(`Error fetching analysis data for PR #${prNumber}:`, err);
    res.status(500).json({
      error: "Failed to fetch PR analysis data",
      message: err.message,
    });
  }
};

// ================================
//  GEMINI AI ANALYSIS
// ================================
export const getGeminiAnalysis = async (req, res) => {
  const { prBody, diffContent, issueBody } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: "Gemini API key is not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
Role: You are an expert code reviewer and project manager for an open-source project. Your task is to analyze a contribution and suggest a fair reward.

[THE PROBLEM: GITHUB ISSUE]
${issueBody || "No linked issue was provided."}

[THE SOLUTION: CONTRIBUTOR'S PULL REQUEST]
${prBody || "No PR description was provided."}

Code Changes (.diff):
${diffContent}

[YOUR TASK]
1. Analysis: Does the code in "Code Changes" solve the problem?
2. Quality: Rate quality (1-10).
3. Complexity: (Typo, Small Bug, Major Bug, New Feature).
4. Suggest reward in USDC:
   * Typo: $1 - $5
   * Small Bug: $5 - $25
   * Major Bug: $25 - $100
   * New Feature: $100 - $500

Return valid JSON only.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "");
    const jsonResponse = JSON.parse(cleanedText);
    const analysisResult = {
      solves_issue: jsonResponse.solves_issue ?? (jsonResponse.reward > 0),
      analysis_notes: jsonResponse.analysis_notes || jsonResponse.analysis || "No analysis provided",
      quality_rating: jsonResponse.quality_rating ?? jsonResponse.quality ?? 0,
      complexity: jsonResponse.complexity || "Unknown",
      suggested_payout_usdc: jsonResponse.suggested_payout_usdc ?? jsonResponse.reward ?? 0
    };

    console.log("Gemini API response:", analysisResult);
    res.json(analysisResult);
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    res.status(500).json({ error: "Failed to get analysis from AI" });
  }
};
