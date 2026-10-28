const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
loadDotEnv();

const port = Number(process.env.PORT || 3000);
const apiKey = process.env.GEMMA_API_KEY;
const model = process.env.GEMMA_MODEL || "gemma-3-27b-it";
const root = __dirname;
const mimeTypes = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

async function askGemma(question) {
  if (!apiKey) throw new Error("GEMMA_API_KEY is not configured");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    systemInstruction: { parts: [{ text: "You are EcoGemma, a concise and encouraging waste-management assistant. Give practical general guidance, mention that local rules vary, and never pretend to identify an object from an image. If the user asks for dangerous disposal instructions, recommend an official local facility." }] },
    contents: [{ role: "user", parts: [{ text: question }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 350 }
  }) });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Gemma request failed with status ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!answer) throw new Error("Gemma returned an empty answer");
  return answer;
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/chat") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; if (raw.length > 10000) request.destroy(); });
    request.on("end", async () => {
      try {
        const question = JSON.parse(raw).question?.trim();
        if (!question || question.length > 500) return sendJson(response, 400, { error: "Enter a question up to 500 characters." });
        const answer = await askGemma(question);
        sendJson(response, 200, { answer });
      } catch (error) {
        console.error(error);
        const status = error.status === 429 ? 429 : 503;
        sendJson(response, status, { error: "The AI service is unavailable. Please try again later." });
      }
    });
    return;
  }
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(root, requestedPath.split("?")[0]);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) return sendJson(response, 404, { error: "Not found" });
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});
server.listen(port, () => console.log(`EcoGemma running at http://localhost:${port}`));
