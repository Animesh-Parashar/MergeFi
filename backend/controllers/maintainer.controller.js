import axios from 'axios';

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
          sort: 'updated',
          per_page: 50,
          type: 'owner' // Only owned repos
        }
      }),
    ]);

    const user = userRes.data;
    const repos = repoRes.data.filter(repo => !repo.fork); // Exclude forked repos

    // Get detailed info for owned repos
    const repoDetails = await Promise.all(
      repos.slice(0, 20).map(async (repo) => {
        try {
          const [contributorsRes, issuesRes, pullsRes] = await Promise.all([
            axios.get(`https://api.github.com/repos/${repo.full_name}/contributors`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { per_page: 20 }
            }).catch(() => ({ data: [] })),

            axios.get(`https://api.github.com/repos/${repo.full_name}/issues`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { state: 'open', per_page: 10 }
            }).catch(() => ({ data: [] })),

            axios.get(`https://api.github.com/repos/${repo.full_name}/pulls`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { state: 'open', per_page: 10 }
            }).catch(() => ({ data: [] }))
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
              open_prs_count: pullsRes.data.length
            }
          };

        } catch (error) {
          console.error(`Error fetching maintainer data for ${repo.full_name}:`, error.message);
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
              open_prs_count: 0
            }
          };
        }
      })
    );

    const maintainerStats = {
      total_owned_repos: repos.length,
      total_stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      total_forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      total_contributors: repoDetails.reduce((sum, repo) => sum + repo.stats.contributors_count, 0),
      total_open_issues: repoDetails.reduce((sum, repo) => sum + repo.stats.open_issues_count, 0),
      total_open_prs: repoDetails.reduce((sum, repo) => sum + repo.stats.open_prs_count, 0),
      most_popular_repo: repos.reduce((max, repo) =>
        repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max, null)
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
        bio: user.bio
      },
      repositories: repoDetails,
      stats: maintainerStats
    });

  } catch (err) {
    console.error("Error in /api/maintainer:", err);
    res.status(500).json({
      error: "Failed to fetch maintainer data",
      message: err.message
    });
  }
};

// Alias for getMaintainerStats - same as maintainercontrol
export const getMaintainerStats = maintainercontrol;

// New route to get contributors for a specific repository
export const getRepoContributors = async (req, res) => {
  const { github_token } = req.cookies;
  const { owner, repo } = req.params;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch contributors with detailed information
    const contributorsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: { Authorization: `Bearer ${github_token}` },
        params: { 
          per_page: 100,
          anon: 'false' // Exclude anonymous contributors
        }
      }
    );

    // Enrich contributor data with user details
    const detailedContributors = await Promise.all(
      contributorsRes.data.slice(0, 20).map(async (contributor) => {
        try {
          // Fetch detailed user info for each contributor
          const userRes = await axios.get(contributor.url, {
            headers: { Authorization: `Bearer ${github_token}` }
          });

          return {
            id: contributor.id,
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            html_url: contributor.html_url,
            contributions: contributor.contributions,
            type: contributor.type,
            // Additional user details
            name: userRes.data.name,
            company: userRes.data.company,
            location: userRes.data.location,
            bio: userRes.data.bio,
            public_repos: userRes.data.public_repos,
            followers: userRes.data.followers,
            following: userRes.data.following
          };
        } catch (error) {
          console.error(`Error fetching user details for ${contributor.login}:`, error.message);
          // Return basic contributor info if detailed fetch fails
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
            following: 0
          };
        }
      })
    );

    // Calculate contributor statistics
    const stats = {
      total_contributors: detailedContributors.length,
      total_contributions: detailedContributors.reduce((sum, c) => sum + c.contributions, 0),
      top_contributor: detailedContributors.reduce((top, c) => 
        c.contributions > (top?.contributions || 0) ? c : top, null),
      average_contributions: Math.round(
        detailedContributors.reduce((sum, c) => sum + c.contributions, 0) / detailedContributors.length
      )
    };

    res.json({
      repository: {
        owner,
        name: repo,
        full_name: `${owner}/${repo}`
      },
      contributors: detailedContributors,
      stats
    });

  } catch (err) {
    console.error(`Error fetching contributors for ${owner}/${repo}:`, err);
    res.status(500).json({
      error: "Failed to fetch repository contributors",
      message: err.message
    });
  }
};