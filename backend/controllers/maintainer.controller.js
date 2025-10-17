const maintainercontrol = async (req,res)=>{

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
          const [contributorsRes, issuesRes, pullsRes, releasesRes] = await Promise.all([
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
            }).catch(() => ({ data: [] })),

            axios.get(`https://api.github.com/repos/${repo.full_name}/releases`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { per_page: 5 }
            }).catch(() => ({ data: [] }))
          ]);

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
            releases: releasesRes.data,
            stats: {
              contributors_count: contributorsRes.data.length,
              open_issues_count: issuesRes.data.length,
              open_prs_count: pullsRes.data.length,
              releases_count: releasesRes.data.length
            }
          };
        } catch (error) {
          console.error(`Error fetching maintainer data for ${repo.full_name}:`, error.message);
          return {
            ...repo,
            contributors: [],
            open_issues: [],
            open_prs: [],
            releases: [],
            stats: { contributors_count: 0, open_issues_count: 0, open_prs_count: 0, releases_count: 0 }
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
}

export {maintainercontrol};