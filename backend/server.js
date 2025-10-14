import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

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

    // Fetch user info
    const userRes = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    //  const repoRes = await axios.get("https://api.github.com/user/repos", {
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    // const repocont = await axios.get("https://api.github.com/user/repos/:owner/:repo/contributors", {
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    

    // You can now store token in DB or session
    const user = userRes.data;

    // Redirect to frontend with user data (for demo)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?login=${user.login}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub OAuth failed" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
