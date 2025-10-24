import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// 1️⃣ Redirect user to GitHub for login
app.get("/auth/github", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user%20repo`;
  res.redirect(redirectUri);
});

// 2️⃣ GitHub redirects here with `code`
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
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

    res.cookie('github_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
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
    console.error(err);
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

  if (!github_token) {
    return res.json({ authenticated: false });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${github_token}` },
    });

    res.json({
      authenticated: true,
      user: userRes.data
    });
  } catch (error) {
    // Token is invalid
    res.clearCookie('github_token');
    res.json({ authenticated: false });
  }
});

// 4️⃣ Get current user data
app.get("/api/auth/user", async (req, res) => {
  const { github_token } = req.cookies;

  if (!github_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${github_token}` },
    });

    res.json(userRes.data);
  } catch (error) {
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

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);