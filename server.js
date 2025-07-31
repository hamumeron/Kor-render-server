const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Korサーバーは正常に動作しています");
});

app.get("/proxy", async (req, res) => {
  const targetUrl = decodeURIComponent(req.query.url || "");

  if (!/^https?:\/\//.test(targetUrl)) {
    return res.status(400).send("URLを認識できません");
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9",
        "Referer": "https://www.google.com/"
      }
    });

    const contentType = response.headers.get("content-type") || "text/plain";
    res.set("content-type", contentType);

    if (contentType.includes("text/html")) {
      let html = await response.text();

      html = html.replace(/<head[^>]*>/i, (match) => {
        return `${match}\n<base href="${targetUrl}">`;
      });

      html = html.replace(/X-Frame-Options.*?\n?/gi, "");
      html = html.replace(/Content-Security-Policy.*?\n?/gi, "");

      res.send(html);
    } else {
      const buffer = await response.buffer();
      res.send(buffer);
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).send("エラー: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
