import axios from 'axios';
import { supabase } from '../utils/supabase.js';

const ownercontrol = async (req,res)=>{
    const { github_token } = req.cookies;

  if (!github_token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch comprehensive data for owners
    const [userRes, repoRes, orgsRes] = await Promise.all([
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
      axios.get(`https://api.github.com/user/orgs`, {
        headers: { Authorization: `Bearer ${github_token}` },
      }).catch(() => ({ data: [] }))
    ]);

    const user = userRes.data;
    const repos = repoRes.data;
    const organizations = orgsRes.data;

    // Get detailed analytics for top repositories
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 15);

    const detailedRepos = await Promise.all(
      topRepos.map(async (repo) => {
        try {
          const [contributorsRes, trafficRes, commitsRes, releasesRes] = await Promise.all([
            axios.get(`https://api.github.com/repos/${repo.full_name}/contributors`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { per_page: 50 }
            }).catch(() => ({ data: [] })),
            
            axios.get(`https://api.github.com/repos/${repo.full_name}/traffic/views`, {
              headers: { Authorization: `Bearer ${github_token}` },
            }).catch(() => ({ data: { count: 0, uniques: 0 } })),
            
            axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { per_page: 20, since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
            }).catch(() => ({ data: [] })),

            axios.get(`https://api.github.com/repos/${repo.full_name}/releases`, {
              headers: { Authorization: `Bearer ${github_token}` },
              params: { per_page: 10 }
            }).catch(() => ({ data: [] }))
          ]);

          return {
            ...repo,
            analytics: {
              contributors: contributorsRes.data,
              traffic: trafficRes.data,
              recent_commits: commitsRes.data,
              releases: releasesRes.data,
              health_score: Math.min(100, 
                (repo.stargazers_count * 0.1) + 
                (contributorsRes.data.length * 2) + 
                (commitsRes.data.length * 1.5) +
                (releasesRes.data.length * 5)
              )
            }
          };
        } catch (error) {
          console.error(`Error fetching owner analytics for ${repo.full_name}:`, error.message);
          return {
            ...repo,
            analytics: {
              contributors: [],
              traffic: { count: 0, uniques: 0 },
              recent_commits: [],
              releases: [],
              health_score: 0
            }
          };
        }
      })
    );

    // Calculate comprehensive owner statistics
    const ownerStats = {
      total_repos: repos.length,
      public_repos: repos.filter(repo => !repo.private).length,
      private_repos: repos.filter(repo => repo.private).length,
      owned_repos: repos.filter(repo => !repo.fork).length,
      forked_repos: repos.filter(repo => repo.fork).length,
      total_stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      total_forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      total_watchers: repos.reduce((sum, repo) => sum + repo.watchers_count, 0),
      organizations_count: organizations.length,
      account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)),
      average_repo_stars: Math.round(repos.reduce((sum, repo) => sum + repo.stargazers_count, 0) / repos.length),
      most_starred_repo: repos.reduce((max, repo) => 
        repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max, null),
      most_active_repo: detailedRepos.reduce((max, repo) => 
        repo.analytics.recent_commits.length > (max?.analytics?.recent_commits?.length || 0) ? repo : max, null)
    };

    res.json({
      user: {
        ...user,
        account_metrics: {
          age_days: ownerStats.account_age_days,
          influence_score: Math.min(100, 
            (user.followers * 0.5) + 
            (ownerStats.total_stars * 0.1) + 
            (ownerStats.owned_repos * 2)
          )
        }
      },
      repositories: {
        all: repos,
        detailed: detailedRepos,
        top_performers: detailedRepos.slice(0, 5)
      },
      organizations: organizations,
      analytics: {
        portfolio_health: Math.round(detailedRepos.reduce((sum, repo) => 
          sum + repo.analytics.health_score, 0) / detailedRepos.length),
        total_reach: ownerStats.total_stars + ownerStats.total_forks + ownerStats.total_watchers,
        growth_indicators: {
          new_repos_30d: repos.filter(repo => 
            new Date(repo.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          active_repos: detailedRepos.filter(repo => 
            repo.analytics.recent_commits.length > 0).length
        }
      },
      stats: ownerStats
    });

  } catch (err) {
    console.error("Error in /api/owner:", err);
    res.status(500).json({ 
      error: "Failed to fetch owner data",
      message: err.message 
    });
  }
}

export const listRepository = async (req, res) => {
  try {
    const { github_token } = req.cookies;
    
    if (!github_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      github_repo_id,
      owner,
      repo,
      name,
      full_name,
      description,
      html_url,
      language,
      stargazers_count,
      forks_count,
    } = req.body;

    if (!github_repo_id || !owner || !repo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if repo is already listed
    const { data: existing, error: checkError } = await supabase
      .from('listed_repositories')
      .select('*')
      .eq('github_repo_id', github_repo_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Repository already listed' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('listed_repositories')
      .insert([
        {
          github_repo_id,
          owner,
          repo,
          name,
          full_name,
          description,
          html_url,
          language,
          stargazers_count,
          forks_count,
          is_open: true,
          listed_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to list repository' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error listing repository:', error);
    res.status(500).json({ error: 'Failed to list repository' });
  }
};

export const unlistRepository = async (req, res) => {
  try {
    const { github_token } = req.cookies;
    
    if (!github_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { github_repo_id } = req.body;

    if (!github_repo_id) {
      return res.status(400).json({ error: 'Missing repository ID' });
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('listed_repositories')
      .delete()
      .eq('github_repo_id', github_repo_id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to unlist repository' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error unlisting repository:', error);
    res.status(500).json({ error: 'Failed to unlist repository' });
  }
};

export const getListedRepositories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('listed_repositories')
      .select('*')
      .eq('is_open', true)
      .order('listed_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch repositories' });
    }

    res.json({ success: true, repos: data || [] });
  } catch (error) {
    console.error('Error fetching listed repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};

export const getUserListedRepositories = async (req, res) => {
  try {
    const { github_token } = req.cookies;
    
    if (!github_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data, error } = await supabase
      .from('listed_repositories')
      .select('github_repo_id');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch repositories' });
    }

    res.json({ success: true, repos: data || [] });
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};

export {ownercontrol};