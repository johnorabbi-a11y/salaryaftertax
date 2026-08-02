const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SITE = "https://aftertaxtool.com/";

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function htmlFiles() {
  return fs.readdirSync(ROOT).filter((name) => name.endsWith(".html"));
}

function canonicalFor(html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function fileForUrl(url) {
  if (url === SITE || url === "https://aftertaxtool.com") return "index.html";
  if (!url.startsWith(SITE)) return null;
  const pathname = url.slice(SITE.length).split("#")[0].split("?")[0];
  return pathname || "index.html";
}

function normalizeHref(href) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (href.startsWith("https://aftertaxtool.com/")) return fileForUrl(href);
  if (href.startsWith("/")) {
    const clean = href.slice(1).split("#")[0].split("?")[0];
    return clean || "index.html";
  }
  if (/^[a-z]+:/i.test(href)) return null;
  return href.split("#")[0].split("?")[0];
}

function linksFrom(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const target = normalizeHref(match[1]);
    if (target) links.push(target);
  }
  return links;
}

const files = htmlFiles();
const indexable = new Set();

for (const file of files) {
  const html = read(file);
  const canonical = canonicalFor(html);
  if (file === "google045f4d6b341942cf.html") continue;
  if (!canonical) continue;
  if (canonical === SITE && file === "index.html") {
    indexable.add(file);
    continue;
  }
  if (canonical === SITE + file) indexable.add(file);
}

const graph = new Map();
const inbound = new Map([...indexable].map((file) => [file, 0]));

for (const file of indexable) {
  const html = read(file);
  const outgoing = new Set();
  for (const target of linksFrom(html)) {
    if (indexable.has(target)) outgoing.add(target);
  }
  graph.set(file, outgoing);
  for (const target of outgoing) inbound.set(target, (inbound.get(target) || 0) + 1);
}

const depth = new Map([["index.html", 0]]);
const queue = ["index.html"];
for (let i = 0; i < queue.length; i++) {
  const current = queue[i];
  const nextDepth = depth.get(current) + 1;
  for (const target of graph.get(current) || []) {
    if (!depth.has(target)) {
      depth.set(target, nextDepth);
      queue.push(target);
    }
  }
}

const unreachable = [...indexable].filter((file) => !depth.has(file));
const zeroInbound = [...indexable].filter((file) => file !== "index.html" && (inbound.get(file) || 0) === 0);
const weakInbound = [...indexable].filter((file) => file !== "index.html" && (inbound.get(file) || 0) <= 2);
const depthValues = [...depth.values()].sort((a, b) => a - b);
const sum = depthValues.reduce((total, value) => total + value, 0);
const percentile = (p) => depthValues[Math.min(depthValues.length - 1, Math.ceil(depthValues.length * p) - 1)] || 0;

const result = {
  indexableUrls: indexable.size,
  reachableUrls: depth.size,
  unreachableUrls: unreachable.length,
  zeroInboundUrls: zeroInbound.length,
  weakInboundUrls: weakInbound.length,
  averageDepth: Number((sum / depthValues.length).toFixed(2)),
  medianDepth: percentile(0.5),
  p95Depth: percentile(0.95),
  maxDepth: depthValues[depthValues.length - 1] || 0,
  weakestExamples: weakInbound.slice(0, 20),
};

console.log(JSON.stringify(result, null, 2));

if (unreachable.length) {
  console.error(`FAIL: ${unreachable.length} indexable URLs are unreachable from homepage crawl.`);
  process.exitCode = 1;
}
if (zeroInbound.length) {
  console.error(`FAIL: ${zeroInbound.length} indexable URLs have zero inbound internal links.`);
  process.exitCode = 1;
}
if (result.p95Depth > 6) {
  console.error(`FAIL: P95 click depth is ${result.p95Depth}, above the <=6 benchmark.`);
  process.exitCode = 1;
}
