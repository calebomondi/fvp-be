import express from "express";
import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";

dotenv.config();

const router = express.Router();

const client = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
});

// Step 1: Redirect user to Twitter login
router.get("/login", async (req, res) => {
  try {
    const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(
      process.env.TWITTER_CALLBACK_URL,
      { authAccessType: "write" }
    );

    // Store oauth_token_secret temporarily in session
    req.session.oauth_token = oauth_token;
    req.session.oauth_token_secret = oauth_token_secret;

    // Redirect user to Twitter auth page
    res.redirect(url);
  } catch (error) {
    console.error("Error generating Twitter login link:", error);
    res.status(500).json({ error: "Failed to generate Twitter login link" });
  }
});
// Step 2: Twitter redirects here after user authorizes
router.get("/callback", async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const storedToken = req.session.oauth_token;
  const storedTokenSecret = req.session.oauth_token_secret;

  // Validate tokens
  if (!oauth_token || !oauth_verifier || oauth_token !== storedToken) {
    return res.status(400).json({ error: "You denied the app or your session expired!" });
  }
  // Obtain the persistent tokens
  // Create a client from temporary tokens
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken: storedToken,
      accessSecret: storedTokenSecret,
    });

    const { accessToken, accessSecret, screenName, userId} = await client.login(oauth_verifier);

    // Store tokens in session
    req.session.accessToken = accessToken;
    req.session.accessTokenSecret = accessSecret;
    req.session.twitterUsername = screenName;
    req.session.twitterUserId = userId;

    // Redirect back to frontend
    res.redirect("http://fvp.finance/tweet-share");
  } catch (err) {
    console.error("Twitter callback error:", err);
    res.status(500).json({ error: "Twitter authentication failed" });
  }
});

router.post("/tweet", async (req, res) => {
  const { text, image } = req.body;

  const accessToken = req.session.accessToken;
  const accessTokenSecret = req.session.accessTokenSecret;

  if (!accessToken || !accessTokenSecret) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (!text || !image) {
    return res.status(400).json({ error: "Missing tweet text or image" });
  }

  try {
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken,
      accessSecret: accessTokenSecret,
    });

    const mediaId = await twitterClient.v1.uploadMedia(
      Buffer.from(image, "base64"),
      { mimeType: "image/png" }
    );

    const tweet = await twitterClient.v2.tweet({
      text,
      media: {
        media_ids: [mediaId],
      },
    });

    const user = await twitterClient.currentUser();

    res.json({
      message: "Tweeted successfully!",
      tweet,
      screen_name: user.screen_name,
    });
  } catch (error) {
    console.error("Error tweeting:", error);
    res.status(500).json({ error: "Failed to post tweet" });
  }
});


export default router;
