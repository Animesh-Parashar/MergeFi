import axios from 'axios';

export const contributorcontrol = async (req, res) => {
  const { github_token } = req.cookies;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch user and contribution activity
    const [userRes, repoRes, eventsRes] = await Promise.all([
      axios.get(`https://api.github.com/user`, {
        headers: { Authorization: `Bearer ${github_token}` },
      }),
      axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${github_token}` },
        params: {
          sort: 'updated',
          per_page: 100,
          type: 'all'
        }
      }),
      axios.get(`https://api.github.com/users/${userRes.data?.login || 'user'}/events/public`, {
        headers: { Authorization: `Bearer ${github_token}` },
        params: { per_page: 50 }
      }).catch(() => ({ data: [] }))
    ]);

    const user = userRes.data;
    const allRepos = repoRes.data;
    const events = eventsRes.data;

    // Filter contributed repos (excluding owned repos)
    const contributedRepos = allRepos.filter(repo => repo.fork || 
      (repo.owner.login !== user.login && repo.permissions?.push !== false));

    // Get recent contributions from events
    const recentContributions = events
      .filter(event => ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent'].includes(event.type))
      .slice(0, 20)
      .map(event => ({
        type: event.type,
        repo: event.repo.name,
        created_at: event.created_at,
        payload: {
          action: event.payload?.action,
          commits: event.payload?.commits?.length || 0,
          pull_request: event.payload?.pull_request ? {
            title: event.payload.pull_request.title,
            state: event.payload.pull_request.state,
            html_url: event.payload.pull_request.html_url
          } : null
        }
      }));

    // Calculate contribution stats
    const contributorStats = {
      total_repos_contributed: contributedRepos.length,
      total_owned_repos: allRepos.filter(repo => !repo.fork && repo.owner.login === user.login).length,
      total_forked_repos: allRepos.filter(repo => repo.fork).length,
      total_public_repos: user.public_repos,
      followers: user.followers,
      following: user.following
    };

    // Get languages from recent repos
    const languages = await Promise.all(
      allRepos.slice(0, 10).map(async (repo) => {
        try {
          const langRes = await axios.get(`https://api.github.com/repos/${repo.full_name}/languages`, {
            headers: { Authorization: `Bearer ${github_token}` },
          });
          return { repo: repo.name, languages: langRes.data };
        } catch {
          return { repo: repo.name, languages: {} };
        }
      })
    );

    res.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        bio: user.bio,
        location: user.location,
        company: user.company,
        hireable: user.hireable
      },
      contributions: {
        recent_activity: recentContributions,
        contributed_repos: contributedRepos.slice(0, 20),
        languages_used: languages
      },
      stats: contributorStats
    });

  } catch (err) {
    console.error("Error in /api/contributor:", err);
    res.status(500).json({ 
      error: "Failed to fetch contributor data",
      message: err.message 
    });
  }
};

export const getContributorStats = async (req, res) => {
  try {
    const { github_token } = req.cookies;
    
    if (!github_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // First get user info
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${github_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const user = userRes.data;

    // Fetch user's pull requests
    const searchResponse = await axios.get(
      `https://api.github.com/search/issues?q=author:${user.login}+type:pr+is:merged`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const mergedPRs = searchResponse.data.items.slice(0, 10).map(pr => ({
      id: pr.id,
      repo: pr.repository_url.split('/').slice(-2).join('/'),
      pr: `#${pr.number}`,
      title: pr.title,
      date: new Date(pr.closed_at).toISOString().split('T')[0],
      url: pr.html_url,
    }));

    // Get repository contribution counts
    const repoContributions = {};
    mergedPRs.forEach(pr => {
      repoContributions[pr.repo] = (repoContributions[pr.repo] || 0) + 1;
    });

    const badges = Object.entries(repoContributions).map(([repo, count]) => {
      let level = 'Bronze';
      let color = 'from-orange-700 to-orange-500';
      
      if (count >= 10) {
        level = 'Gold';
        color = 'from-yellow-600 to-yellow-400';
      } else if (count >= 5) {
        level = 'Silver';
        color = 'from-gray-500 to-gray-300';
      }

      return {
        name: repo,
        contributions: count,
        level,
        color,
      };
    });

    // Fetch user's repositories for contribution stats
    const reposResponse = await axios.get(
      `https://api.github.com/user/repos?per_page=100&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const stats = {
      totalPRs: searchResponse.data.total_count,
      totalRepos: Object.keys(repoContributions).length,
      mergedPRs: mergedPRs,
      badges: badges,
      user: user,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching contributor stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch contributor stats' });
  }
};

export const getContributorEarnings = async (req, res) => {
  try {
    // This would integrate with your blockchain contract
    // For now, returning mock data structure
    const earningsData = [
      { month: 'Jan', earnings: 0 },
      { month: 'Feb', earnings: 0 },
      { month: 'Mar', earnings: 0 },
      { month: 'Apr', earnings: 0 },
      { month: 'May', earnings: 0 },
      { month: 'Jun', earnings: 0 },
    ];

    res.json({
      totalEarnings: 0,
      earningsData: earningsData,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error.message);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};