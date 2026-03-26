const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = process.env.PORT || 3000;
const browserDir = path.join(__dirname, "browser");
const appJsPath = path.join(browserDir, "app.js");
const indexHtmlPath = path.join(browserDir, "index.html");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const getBundleMeta = () => {
  const appJs = fs.readFileSync(appJsPath);
  const sha256 = crypto.createHash("sha256").update(appJs).digest("hex");
  return {
    version: "v0.1.0-dev",
    appJsSha256: sha256,
    shortSha: sha256.slice(0, 12),
    hashedJsPath: `/app.${sha256.slice(0, 12)}.js`
  };
};

const renderIndexHtml = () => {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const meta = getBundleMeta();

  return html
    .replace("./app.js", meta.hashedJsPath)
    .replace("__APP_VERSION__", `${meta.version} • ${meta.shortSha}`)
    .replace("__APP_SHA_TITLE__", `app.js sha256 ${meta.appJsSha256}`);
};

const server = http.createServer((req, res) => {
  const meta = getBundleMeta();

  if (req.url === "/meta.json") {
    res.writeHead(200, {
      "Content-Type": contentTypes[".json"],
      "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(meta, null, 2));
    return;
  }

  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, {
      "Content-Type": contentTypes[".html"],
      "Cache-Control": "no-store"
    });
    res.end(renderIndexHtml());
    return;
  }

  if (req.url === meta.hashedJsPath) {
    fs.readFile(appJsPath, (error, contents) => {
      if (error) {
        res.writeHead(500);
        res.end("Unable to read app bundle");
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentTypes[".js"],
        "Cache-Control": "public, max-age=31536000, immutable"
      });
      res.end(contents);
    });
    return;
  }

  const requestPath = req.url;
  const filePath = path.join(browserDir, requestPath);

  if (!filePath.startsWith(browserDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "text/plain; charset=utf-8",
      "Cache-Control": ext === ".css" ? "no-cache" : "no-store"
    });
    res.end(contents);
  });
});

server.listen(port, () => {
  const meta = getBundleMeta();
  console.log(`Drawforge browser demo running at http://localhost:${port} (${meta.shortSha})`);
});
