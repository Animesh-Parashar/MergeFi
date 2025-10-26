import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
console.log(process.env.FRONTEND_URL);
console.log(process.env.GITHUB_CLIENT_ID);
console.log(process.env.GITHUB_CLIENT_SECRET);
console.log(process.env.SUPABASE_URL);
console.log(process.env.GEMINI_API_KEY);
// app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Update CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// 1️⃣ Redirect user to GitHub for login
app.get("/auth/github", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user%20repo`;
  console.log('[auth/github] redirecting user to GitHub OAuth', { clientId: CLIENT_ID });
  res.redirect(redirectUri);
});

// 2️⃣ GitHub redirects here with `code`
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  console.log('[auth/github/callback] received callback', { hasCode: !!code });

  try {
    // Exchange code for access token
    console.log('[auth/github/callback] exchanging code for access token');
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;
    console.log('[auth/github/callback] obtained access token', {
      tokenLength: accessToken ? accessToken.length : 0,
    });

    // Update cookie settings in the callback
    res.cookie('github_token', accessToken, {
      httpOnly: true,
      secure: true,  // Required for HTTPS
      sameSite: 'none', // Required for cross-origin
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      domain: 'mergefi.onrender.com' // Match your domain
    });

    // Send message to parent window and close popup
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GITHUB_AUTH_SUCCESS' 
          }, '${process.env.FRONTEND_URL}');
          window.close();
        } else {
          window.location.href = '${process.env.FRONTEND_URL}/';
        }
      </script>
    `);
  } catch (err) {
    console.error('[auth/github/callback] error exchanging code for token:', err && err.message ? err.message : err);
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GITHUB_AUTH_ERROR', 
            error: 'GitHub OAuth failed' 
          }, '${process.env.FRONTEND_URL}');
          window.close();
        } else {
          window.location.href = '${process.env.FRONTEND_URL}/?error=auth_failed';
        }
      </script>
    `);
  }
});

// 3️⃣ Check authentication status
app.get("/api/auth/status", async (req, res) => {
  const { github_token } = req.cookies;
console.log('Cookies received at /api/auth/status:', req.cookies);
  if (!github_token) {
    console.log('[api/auth/status] no github_token cookie present');
    return res.json({ authenticated: false });
  }

  try {
    console.log('[api/auth/status] verifying github token by fetching user from GitHub');
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${github_token}` },
    });
    console.log('[api/auth/status] github user fetched', { login: userRes.data?.login });
    res.json({
      authenticated: true,
      user: userRes.data
    });
  } catch (error) {
    // Token is invalid
    console.error('[api/auth/status] error validating github token:', error && error.message ? error.message : error);
    res.clearCookie('github_token');
    res.json({ authenticated: false });
  }
});

// 4️⃣ Get current user data
app.get("/api/auth/user", async (req, res) => {
  const { github_token } = req.cookies;

  if (!github_token) {
    console.log('[api/auth/user] no github_token cookie present');
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    console.log('[api/auth/user] fetching user profile from GitHub');
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${github_token}` },
    });
    console.log('[api/auth/user] fetched user', { login: userRes.data?.login });
    res.json(userRes.data);
  } catch (error) {
    console.error('[api/auth/user] error fetching user from GitHub:', error && error.message ? error.message : error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// 5️⃣ Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('github_token');
  res.json({ success: true });
});

//using routes
import githubroute from './routes/github.routes.js'
import transactionRoutes from './routes/transaction.routes.js'

app.use("/api", githubroute);
app.use("/api/transactions", transactionRoutes);

// Lightweight health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// common k8s/readiness probe path
app.get('/healthz', (req, res) => res.status(200).send('ok'));

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
