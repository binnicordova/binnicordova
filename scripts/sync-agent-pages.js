#!/usr/bin/env node
// Copies the canonical HTML (public/_pages/*.html) and Markdown (public/*.md)
// sources into functions/pages/ so the pageRenderer Cloud Function can read
// them at runtime. Cloud Functions deploys only bundle the functions/
// directory, so this keeps the function's copy in sync with the real page
// content instead of hand-maintaining a second copy.
//
// Runs automatically as a Hosting/Functions "predeploy" hook (see
// firebase.json), and can be run manually with `node scripts/sync-agent-pages.js`.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES = ["index", "architecture", "projects", "timeline", "vancouver"];
const DEST_DIR = path.join(ROOT, "functions", "pages");

fs.mkdirSync(DEST_DIR, { recursive: true });

for (const page of PAGES) {
  const htmlSrc = path.join(ROOT, "public", "_pages", `${page}.html`);
  const mdSrc = path.join(ROOT, "public", `${page}.md`);
  fs.copyFileSync(htmlSrc, path.join(DEST_DIR, `${page}.html`));
  fs.copyFileSync(mdSrc, path.join(DEST_DIR, `${page}.md`));
}

console.log(`Synced ${PAGES.length} pages (html + md) into functions/pages/`);
