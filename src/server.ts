import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { createServer } from "node:http";
import { handleToolCalls } from "./tools";
import { handleWebform } from "./webform";

// Public HTTP surface VAPI reaches during a live call. One endpoint dispatches both tools.
// ponytail: stdlib http, no framework — one POST route doesn't need Express.
const PORT = Number(process.env.PORT ?? 3000);

// Read the full request body and JSON-parse it ({} on empty). Both POST routes need this.
function readJson(req: import("node:http").IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
  });
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  // Web-form capture: a client's form POSTs a submission to /webhook/leads/<their-token>.
  if (req.method === "POST" && req.url?.startsWith("/webhook/leads/")) {
    const token = req.url.slice("/webhook/leads/".length).split(/[/?]/)[0];
    readJson(req).then(async (body) => {
      const result = await handleWebform(token, body);
      console.log("web-form →", JSON.stringify(result));
      res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    }).catch((e: any) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, reason: `bad request: ${e?.message ?? e}` }));
    });
    return;
  }

  if (req.method === "POST" && req.url === "/vapi/tools") {
    readJson(req).then(async (body) => {
      const out = await handleToolCalls(body);
      console.log("tool call →", JSON.stringify(out.results.map((r) => r.result)));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out));
    }).catch((e: any) => {
      console.error("tool handler error:", e);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results: [{ toolCallId: "", result: `Server error: ${e?.message ?? e}` }] }));
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, () => console.log(`Reacher tool server on :${PORT}  →  POST /vapi/tools  ·  GET /health`));
