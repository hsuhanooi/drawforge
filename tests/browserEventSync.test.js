const http = require("http");
const { createEventForNode } = require("../src/events");

const fetchJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  }).on("error", reject);
});

describe("browser/server event sync", () => {
  let server;

  beforeAll(async () => {
    // eslint-disable-next-line global-require
    server = require("../server");
    await new Promise((resolve, reject) => {
      server.listen(3101, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("serves event JSON matching src/events.js for camp nodes", async () => {
    const served = await fetchJson("http://localhost:3101/event.json?nodeId=r1c1&row=1&col=1");
    const source = JSON.parse(JSON.stringify(createEventForNode({ id: "r1c1", row: 1, col: 1 })));

    expect(served.kind).toBe(source.kind);
    expect(served.options.map((option) => option.effect)).toEqual(source.options.map((option) => option.effect));
    expect(served.options.filter((option) => option.card).map((option) => option.card.id)).toEqual(
      source.options.filter((option) => option.card).map((option) => option.card.id)
    );
  });
});
