const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const browserDir = path.join(__dirname, "browser");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
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
      "Content-Type": contentTypes[ext] || "text/plain; charset=utf-8"
    });
    res.end(contents);
  });
});

server.listen(port, () => {
  console.log(`Drawforge browser demo running at http://localhost:${port}`);
});
