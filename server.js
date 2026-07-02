const express = require("express");
const cors = require("cors");
const dns = require("dns");
const { URL } = require("url");
const path = require("path");

const app = express();
const urlDatabase = new Map();
let nextId = 1;

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/api/shorturl", (req, res) => {
  const { url } = req.body;

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return res.json({ error: "invalid url" });
  }

  return dns.lookup(parsedUrl.hostname, (error) => {
    if (error) {
      return res.json({ error: "invalid url" });
    }

    for (const [shortUrl, originalUrl] of urlDatabase.entries()) {
      if (originalUrl === url) {
        return res.json({ original_url: originalUrl, short_url: shortUrl });
      }
    }

    const shortUrl = nextId;
    nextId += 1;
    urlDatabase.set(shortUrl, url);

    return res.json({ original_url: url, short_url: shortUrl });
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);
  const originalUrl = urlDatabase.get(shortUrl);

  if (!originalUrl) {
    return res.status(404).json({ error: "No short URL found for the given input" });
  }

  return res.redirect(originalUrl);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
