const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createEventForNode } = require("./src/events");
const { createCardCatalog, toRenderableCard, toRenderableCards } = require("./src/cardCatalog");
const { RELICS } = require("./src/relics");
const { createRewardOptions } = require("./src/rewards");
const { createPlayRewardCardOptions, createPlayEventState, createPlayShopState } = require("./src/playContent");
const { createBrowserRun, enterBrowserNode } = require("./src/browserRunActions");
const {
  applyVictoryToRun,
  claimCardReward,
  claimRelicFromChoices,
  claimRelicReward,
  skipRewards,
  claimEventOption,
  removeCardFromDeck,
  finishNode,
  buyShopItem,
  upgradeCard
} = require("./src/browserPostNodeActions");
const {
  startCombatForNode,
  playCombatCard,
  endCombatTurn
} = require("./src/browserCombatActions");

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

const pickUniqueItems = (items, count) => {
  const pool = [...items];
  const chosen = [];
  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
};

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

    const event = createEventForNode({ id: nodeId, row, col });
    event.options = event.options.map((option) => {
      if (option.card) {
        return { ...option, card: toRenderableCard(option.card) };
      }
      if (option.cards) {
        return { ...option, cards: toRenderableCards(option.cards) };
      }
      return option;
    });

    sendJson(res, 200, event);
    return;
  }

  if (requestUrl.pathname === "/cards.json") {
    sendJson(res, 200, createCardCatalog());
    return;
  }

  if (requestUrl.pathname === "/relics.json") {
    sendJson(res, 200, RELICS);
    return;
  }

  if (requestUrl.pathname === "/reward-options.json") {
    const count = Number(requestUrl.searchParams.get("count") || 3);
    sendJson(res, 200, toRenderableCards(createRewardOptions(count)));
    return;
  }

  if (requestUrl.pathname === "/relic-choices.json") {
    const tier = requestUrl.searchParams.get("tier") || "elite";
    const count = Number(requestUrl.searchParams.get("count") || (tier === "boss" ? 1 : 3));
    const exclude = new Set((requestUrl.searchParams.get("exclude") || "").split(",").filter(Boolean));
    const pool = RELICS.filter((relic) => {
      if (exclude.has(relic.id)) return false;
      if (tier === "boss") return relic.rarity === "rare" || relic.rarity === "boss";
      return relic.rarity === "common" || relic.rarity === "uncommon";
    });
    sendJson(res, 200, pickUniqueItems(pool, count));
    return;
  }

  if (requestUrl.pathname === "/play/reward-options.json") {
    const count = Number(requestUrl.searchParams.get("count") || 3);
    sendJson(res, 200, createPlayRewardCardOptions(count));
    return;
  }

  if (requestUrl.pathname === "/play/event.json") {
    const nodeType = requestUrl.searchParams.get("nodeType") || "event";
    const row = Number(requestUrl.searchParams.get("row") || 0);
    const col = Number(requestUrl.searchParams.get("col") || 0);
    const payload = await createPlayEventState({ id: `play-${nodeType}-${row}-${col}`, type: nodeType, row, col });
    sendJson(res, 200, payload);
    return;
  }

  if (requestUrl.pathname === "/play/shop.json" && req.method === "POST") {
    try {
      const { run } = await readJsonBody(req);
      sendJson(res, 200, await createPlayShopState(run));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to create shop state" });
    }
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
      if (["combat", "elite", "boss"].includes(result.node.type)) {
        result.run.combat = startCombatForNode(result.run, result.node);
      }
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to enter node" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/play-card.json" && req.method === "POST") {
    try {
      const { run, handIndex } = await readJsonBody(req);
      sendJson(res, 200, playCombatCard(run, handIndex));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to play card" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/end-turn.json" && req.method === "POST") {
    try {
      const { run } = await readJsonBody(req);
      sendJson(res, 200, endCombatTurn(run));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to end turn" });
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

  if (requestUrl.pathname === "/run/buy-shop-item.json" && req.method === "POST") {
    try {
      const { run, type, itemId, price } = await readJsonBody(req);
      sendJson(res, 200, buyShopItem(run, type, itemId, price));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to buy shop item" });
    }
    return;
  }

  if (requestUrl.pathname === "/run/upgrade-card.json" && req.method === "POST") {
    try {
      const { run, deckIndex } = await readJsonBody(req);
      sendJson(res, 200, upgradeCard(run, deckIndex));
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to upgrade card" });
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
