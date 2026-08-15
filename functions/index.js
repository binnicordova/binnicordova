const { onRequest } = require("firebase-functions/v2/https");
const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.join(__dirname, "pages");
const SITE_URL = "https://binnicordova.com";

const ROUTES = {
  "/": "index",
  "/index.html": "index",
  "/architecture.html": "architecture",
  "/projects.html": "projects",
  "/timeline.html": "timeline",
  "/vancouver.html": "vancouver",
};

const cache = new Map();

function loadPage(name) {
  if (cache.has(name)) {
    return cache.get(name);
  }
  const html = fs.readFileSync(path.join(PAGES_DIR, `${name}.html`), "utf8");
  const md = fs.readFileSync(path.join(PAGES_DIR, `${name}.md`), "utf8");
  const entry = { html, md };
  cache.set(name, entry);
  return entry;
}

// --- Page rendering (content negotiation: text/html vs text/markdown) ---

function renderPage(req, res) {
  const reqPath = req.path === "" ? "/" : req.path;
  const pageName = ROUTES[reqPath] || "index";
  const { html, md } = loadPage(pageName);

  const accept = req.get("accept") || "";
  const wantsMarkdown = accept.includes("text/markdown");

  res.set("Vary", "Accept");
  res.set("Cache-Control", "public, max-age=300, s-maxage=3600");

  if (wantsMarkdown) {
    res.set("Content-Type", "text/markdown; charset=utf-8");
    res.status(200).send(md);
    return;
  }

  res.set("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

// --- A2A Agent Card + minimal JSON-RPC agent (no payment capability) ---
// Real, working informational agent: answers questions about contact info
// and case studies using the same data exposed via WebMCP in the page
// markup. Intentionally does NOT declare AP2/x402/MPP payment capability —
// there is no paid product behind this site, so declaring one would be
// false advertising an agent could act on.

const CONTACT_INFO = {
  name: "Binni Cordova",
  title: "Senior Software Engineer | Native iOS/Android | React Native | AIDD | SDD",
  linkedin: "https://www.linkedin.com/in/binnicordova",
  github: "https://github.com/binnicordova",
  website: `${SITE_URL}/`,
  vancouverContact: "hello@binnicordova.com",
  targetMarkets: ["Canada", "United States", "Europe"],
  relocation:
    "Open to employer visa sponsorship, structured relocation programs, and self-relocation under contract or relocation-as-a-service arrangements.",
};

const CASE_STUDIES = [
  { company: "The Coca-Cola Company", role: "Senior Full Stack Software Engineer", domain: "Marketplace", period: "Apr 2025 - Present", outcome: "Offline-first React Native platform with AWS Backend-for-Frontend and native security modules." },
  { company: "NFL+ CTV", role: "Senior Software Engineer", domain: "Media", period: "Feb 2024 - Mar 2025", outcome: "Cross-platform streaming player (Mobile, Web, Smart TV) reaching millions of users." },
  { company: "Itau Bank ITU", role: "Software Engineer", domain: "Banking", period: "Dec 2021 - Feb 2024", outcome: "Biometric-secured banking app for 100K+ users with 90%+ automated test coverage." },
  { company: "Platanitos", role: "Full Stack Software Engineer", domain: "Ecommerce", period: "Mar 2019 - Dec 2021", outcome: "React Native + Expo migration exceeding 1M downloads across iOS, Android, and Huawei." },
  { company: "Gruppo GPI", role: "Software Engineer", domain: "Healthcare", period: "Mar 2018 - Mar 2019", outcome: "Clinical reporting and annotation system deployed across 3,000+ hospitals and clinics." },
];

const AGENT_CARD = {
  protocolVersion: "0.3.0",
  name: "Binni Cordova Portfolio Agent",
  description:
    "Answers questions about Binni Cordova's contact details and mobile engineering case studies. Informational only — no payment capability, no commerce.",
  url: `${SITE_URL}/a2a`,
  preferredTransport: "JSONRPC",
  version: "1.0.0",
  provider: { organization: "Binni Cordova", url: `${SITE_URL}/` },
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/plain", "application/json"],
  skills: [
    {
      id: "contact-info",
      name: "Contact Information",
      description: "Returns LinkedIn, GitHub, target markets, and relocation preferences.",
      tags: ["contact", "recruiting"],
      examples: ["How can I reach you?", "Are you open to relocation?"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain", "application/json"],
    },
    {
      id: "case-studies",
      name: "Case Study Summary",
      description: "Returns a structured summary of production mobile engineering case studies.",
      tags: ["portfolio", "projects", "case-studies"],
      examples: ["Tell me about your recent projects", "What have you shipped at Coca-Cola?"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain", "application/json"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

function serveAgentCard(req, res) {
  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json(AGENT_CARD);
}

function textPart(text) {
  return { kind: "text", text };
}

function agentMessage(parts) {
  return {
    messageId: `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role: "agent",
    parts,
  };
}

function taskResult(id, message) {
  return {
    task: {
      id,
      contextId: `ctx-${Date.now().toString(36)}`,
      status: { state: "completed", message },
    },
  };
}

function detectSkill(params) {
  if (params && typeof params.skillId === "string") {
    return params.skillId;
  }
  const parts = params && params.message && params.message.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => (p && p.text) || "").join(" ").toLowerCase()
    : "";
  if (/contact|reach|email|linkedin|sponsor|relocat/.test(text)) {
    return "contact-info";
  }
  if (/project|case stud|coca|nfl|itau|platanitos|gpi|shipped|built/.test(text)) {
    return "case-studies";
  }
  return null;
}

function handleMessageSend(rpcId, params, res) {
  const taskId = `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const skillId = detectSkill(params);

  if (skillId === "contact-info") {
    res.status(200).json({
      jsonrpc: "2.0",
      id: rpcId,
      result: taskResult(taskId, agentMessage([textPart(JSON.stringify(CONTACT_INFO))])),
    });
    return;
  }

  if (skillId === "case-studies") {
    res.status(200).json({
      jsonrpc: "2.0",
      id: rpcId,
      result: taskResult(taskId, agentMessage([textPart(JSON.stringify(CASE_STUDIES))])),
    });
    return;
  }

  res.status(200).json({
    jsonrpc: "2.0",
    id: rpcId,
    result: taskResult(
      taskId,
      agentMessage([
        textPart(
          "I can answer questions about contact info (skillId: contact-info) or case studies (skillId: case-studies). This agent has no payment capability."
        ),
      ])
    ),
  });
}

function handleA2ARequest(req, res) {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    res.status(405).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32601, message: "Method not allowed. Use POST with a JSON-RPC message/send body." },
    });
    return;
  }

  const body = req.body || {};
  if (body.method !== "message/send") {
    res.status(400).json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: { code: -32601, message: `Unsupported method "${body.method}". Only message/send is implemented.` },
    });
    return;
  }

  handleMessageSend(body.id ?? null, body.params || {}, res);
}

function router(req, res) {
  const reqPath = req.path === "" ? "/" : req.path;

  if (reqPath === "/.well-known/agent-card.json") {
    serveAgentCard(req, res);
    return;
  }

  if (reqPath === "/a2a") {
    handleA2ARequest(req, res);
    return;
  }

  renderPage(req, res);
}

exports.renderPage = renderPage;
exports.router = router;
exports.pageRenderer = onRequest(
  { region: "us-central1", memory: "128MiB", concurrency: 80 },
  router
);
