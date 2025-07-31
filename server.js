const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");
const cheerio = require("cheerio");

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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9",
        "Referer": "https://www.google.com/"
      }
    });

    const contentType = response.headers.get("content-type") || "text/plain";
    res.set("content-type", contentType);

    // HTML の場合
    if (contentType.includes("text/html")) {
      let html = await response.text();
      const $ = cheerio.load(html);

      if ($("head base").length === 0) {
        $("head").prepend(`<base href="${targetUrl}">`);
      }

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const absoluteUrl = new URL(href, targetUrl);
          const proxiedUrl = `/proxy?url=${encodeURIComponent(absoluteUrl.toString())}`;
          $(el).attr("href", proxiedUrl);
        } catch {}
      });

      // form の action も書き換え
      $("form[action]").each((_, el) => {
        const action = $(el).attr("action");
        if (!action) return;
        try {
          const absoluteUrl = new URL(action, targetUrl);
          const proxiedUrl = `/proxy?url=${encodeURIComponent(absoluteUrl.toString())}`;
          $(el).attr("action", proxiedUrl);
        } catch {}
      });

      let newHtml = $.html();
      newHtml = newHtml.replace(/X-Frame-Options.*?\n?/gi, "");
      newHtml = newHtml.replace(/Content-Security-Policy.*?\n?/gi, "");

      res.send(newHtml);
    } else {
      const buffer = await response.buffer();
      res.send(buffer);
    }
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
