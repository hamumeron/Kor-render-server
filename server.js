const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Korサーバーは正常に動作しています");
});

app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
    return res.status(400).send("Invalid or missing URL parameter.");
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KorProxy/1.0; +https://example.com/)",
      },
    });

    res.set("Content-Type", response.headers.get("content-type") || "text/plain");
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Kor Proxy Server is running on port ${PORT}`);
});
