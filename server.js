const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 6746;
const ROOT = __dirname;

const SUGGEST_USER_AGENT = "Mozilla/5.0 (compatible; StartPage/1.0)";

function buildSuggestUrl(engine, q, origin) {
  const query = encodeURIComponent(q || "");
  if (engine === "google") {
    return "https://suggestqueries.google.com/complete/search?client=firefox&q=" + query;
  }
  if (engine === "bing") {
    return "https://api.bing.com/osjson.aspx?query=" + query;
  }
  if (engine === "searxng" || engine === "custom") {
    if (!origin) return null;
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch (e) {
      return null;
    }
    if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") return null;
    return parsedOrigin.origin + "/autocompleter?q=" + query + "&format=json";
  }
  return "https://duckduckgo.com/ac/?type=list&q=" + query;
}

function proxyGet(url, res) {
  const upstreamReq = https.get(url, { headers: { "User-Agent": SUGGEST_USER_AGENT, Accept: "application/json" } }, (upstreamRes) => {
    let body = "";
    upstreamRes.on("data", (chunk) => { body += chunk; });
    upstreamRes.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(body || "{}");
    });
  });
  upstreamReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end("{}");
  });
  upstreamReq.setTimeout(8000, () => { upstreamReq.destroy(); });
}

function handleGeocode(req, res, searchParams) {
  const name = searchParams.get("name") || "";
  const count = Math.min(parseInt(searchParams.get("count") || "5", 10) || 5, 10);
  if (!name.trim()) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end("{}");
    return;
  }
  proxyGet(
    "https://geocoding-api.open-meteo.com/v1/search?count=" + count + "&name=" + encodeURIComponent(name),
    res
  );
}

function handleWeather(req, res, searchParams) {
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  const unit = searchParams.get("unit") === "celsius" ? "celsius" : "fahrenheit";
  if (!isFinite(lat) || !isFinite(lon)) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end("{}");
    return;
  }
  proxyGet(
    "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,weather_code&temperature_unit=" + unit,
    res
  );
}

function handleSuggest(req, res, searchParams) {
  const engine = searchParams.get("engine") || "duckduckgo";
  const q = searchParams.get("q") || "";
  const origin = searchParams.get("origin") || "";
  const targetUrl = buildSuggestUrl(engine, q, origin);

  if (!targetUrl) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end("[]");
    return;
  }

  const upstreamReq = https.get(targetUrl, { headers: { "User-Agent": SUGGEST_USER_AGENT, Accept: "application/json" } }, (upstreamRes) => {
    let body = "";
    upstreamRes.on("data", (chunk) => {
      body += chunk;
    });
    upstreamRes.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(body || "[]");
    });
  });
  upstreamReq.on("error", () => {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end("[]");
  });
  upstreamReq.setTimeout(5000, () => {
    upstreamReq.destroy();
  });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");

  if (requestUrl.pathname === "/api/suggest") {
    handleSuggest(req, res, requestUrl.searchParams);
    return;
  }

  if (requestUrl.pathname === "/api/geocode") {
    handleGeocode(req, res, requestUrl.searchParams);
    return;
  }

  if (requestUrl.pathname === "/api/weather") {
    handleWeather(req, res, requestUrl.searchParams);
    return;
  }

  const requestPath = decodeURIComponent(requestUrl.pathname);
  let filePath = path.join(ROOT, requestPath === "/" ? "index.html" : requestPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`StartPage offline site running at http://localhost:${PORT}`);
});
