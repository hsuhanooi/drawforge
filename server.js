const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createEventForNode } = require("./src/events");
const { createBrowserRun, enterBrowserNode } = require("./src/browserRunActions");
const {
  applyVictoryToRun,
  claimCardReward,
  claimRelicFromChoices,
  claimRelicReward,
  skipRewards,
  claimEventOption,
  removeCardFromDeck,
  finishNode
} = require("./src/browserPostNodeActions");

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

const sendJson = (res, status, payload, cacheControl = "no-store") => {
  res.writeHead(status, {
    "Content-Type": contentTypes[".json"],
    "Cache-Control": cacheControl
  });
  res.end(JSON.stringify(payload, null, 2));
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch (error) {
      reject(error);
    }
  });
  req.on("error", reject);
});

const server = http.createServer(async (req, res) => {
  const meta = getBundleMeta();
  const requestUrl = new URL(req.url, `http://localhost:${port}`);

  if (requestUrl.pathname === "/meta.json") {
    sendJson(res, 200, meta);
    return;
  }

  if (requestUrl.pathname === "/event.json") {
    const nodeId = requestUrl.searchParams.get("nodeId") || "r0c0";
    const row = Number(requestUrl.searchParams.get("row"));
    const col = Number(requestUrl.searchParams.get("col"));

    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      sendJson(res, 400, { error: "row and col query params are required integers" });
      return;
    }

    sendJson(res, 200, createEventForNode({ id: nodeId, row, col }));
    return;
  }

  if (requestUrl.pathname === "/run/new.json") {
    sendJson(res, 200, createBrowserRun());
    return;
  }

  if (requestUrl.pathname === "/run/enter-node.json" && req.method === "POST") {
    try {
      const { run, nodeId } = await readJsonBody(req);
      const result = enterBrowserNode(run, nodeId);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to enter node" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/apply-victory.json" && req.method === "POST") {
    try {
      const { run, combat } = await readJsonBody(req);
      sendJson(res, 200, applyVictoryToRun(run, combat));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to apply victory" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/claim-card.json" && req.method === "POST") {
    try {
      const { run, cardId } = await readJsonBody(req);
      sendJson(res, 200, claimCardReward(run, cardId));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to claim card reward" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/claim-choice-relic.json" && req.method === "POST") {
    try {
      const { run, relicId } = await readJsonBody(req);
      sendJson(res, 200, claimRelicFromChoices(run, relicId));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to claim relic choice" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/claim-relic.json" && req.method === "POST") {
    try {
      const { run, relicId } = await readJsonBody(req);
      sendJson(res, 200, claimRelicReward(run, relicId));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to claim relic reward" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/skip-rewards.json" && req.method === "POST") {
    try {
      const { run } = await readJsonBody(req);
      sendJson(res, 200, skipRewards(run));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to skip rewards" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/claim-event-option.json" && req.method === "POST") {
    try {
      const { run, optionId } = await readJsonBody(req);
      sendJson(res, 200, claimEventOption(run, optionId));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to resolve event option" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/remove-card.json" && req.method === "POST") {
    try {
      const { run, cardId } = await readJsonBody(req);
      sendJson(res, 200, removeCardFromDeck(run, cardId));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to remove card" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/finish-node.json" && req.method === "POST") {
    try {
      const { run } = await readJsonBody(req);
      sendJson(res, 200, finishNode(run));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to finish node" });
    }
    return;
  }

  if (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
    res.writeHead(200, {
      "Content-Type": contentTypes[".html"],
      "Cache-Control": "no-store"
    });
    res.end(renderIndexHtml());
    return;
  }

  if (requestUrl.pathname === meta.hashedJsPath) {
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

  const filePath = path.join(browserDir, requestUrl.pathname);

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

module.exports = server;
