const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");
const app = express();

app.use(cors());

app.get("/proxy", async (req, res) => {
  const targetUrl = decodeURIComponent(req.query.url || "");

  if (!/^https?:\/\//.test(targetUrl)) {
    return res.status(400).send("無効なURLです");
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AnonymousProxy/1.0)",
      }
    });

    const contentType = response.headers.get("content-type");
    res.set("content-type", contentType);
    const body = await response.buffer();
    res.send(body);
  } catch (err) {
    res.status(500).send("エラー: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.send("I'm alive!");
});

