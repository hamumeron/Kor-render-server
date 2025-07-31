const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Korサーバーは正常に動作しています");
});

async function handleProxy(req, res, rawUrl) {
  const targetUrl = decodeURIComponent(rawUrl || "");

  if (!/^https?:\/\//.test(targetUrl)) {
    return res.status(400).send("URLを認識できません");
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "ja,en-US;q=0.9",
        "Referer": "https://www.google.com/"
      }
    });

    const contentType = response.headers.get("content-type") || "text/plain";
    res.set("content-type", contentType);

    // HTML もバイナリデータもそのまま返す
    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).send("エラー: " + err.message);
  }
}

app.get("/proxy", (req, res) => {
  handleProxy(req, res, req.query.url);
});

app.use((req, res) => {
  res.status(404).send("エラー: サポートされていないURLです");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
