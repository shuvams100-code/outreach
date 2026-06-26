import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { createServer } from "node:http";
import { handleToolCalls } from "./tools";

// Public HTTP surface VAPI reaches during a live call. One endpoint dispatches both tools.
// ponytail: stdlib http, no framework — one POST route doesn't need Express.
const PORT = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.method === "POST" && req.url === "/vapi/tools") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const out = await handleToolCalls(body);
        console.log("tool call →", JSON.stringify(out.results.map((r) => r.result)));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(out));
      } catch (e: any) {
        console.error("tool handler error:", e);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ results: [{ toolCallId: "", result: `Server error: ${e?.message ?? e}` }] }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, () => console.log(`Reacher tool server on :${PORT}  →  POST /vapi/tools  ·  GET /health`));
