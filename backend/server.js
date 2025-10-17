import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());

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
      httpOnly: true,        // Prevents XSS attacks
      sameSite: 'lax',       // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
      path: '/'
    });

    // Redirect to frontend with user data (for demo)
    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub OAuth failed" });
  }
});

//using routes

import githubroute from './routes/github.routes.js'


app.use("/api/",githubroute);


app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);