#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build"]);
const CHECK_ATTRS = ["href", "src"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile()) files.push(path.join(dir, entry.name));
  }
  return files;
}

function toSitePath(file) {
  return "/" + path.relative(ROOT, file).replace(/\\/g, "/");
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function isExternal(url) {
  return /^(https?:)?\/\//i.test(url)
    || /^(mailto|tel|sms|javascript|data):/i.test(url)
    || url.startsWith("#");
}

function normalizeInternalUrl(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return "/index.html";
  if (clean.endsWith("/")) return clean + "index.html";
  return clean.startsWith("/") ? clean : null;
}

function resolveRelativeUrl(fromFile, url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return null;
  const fromDir = path.posix.dirname(toSitePath(fromFile));
  const resolved = path.posix.normalize(path.posix.join(fromDir, clean));
  return resolved.startsWith("/") ? resolved : "/" + resolved;
}

function extractLinks(html) {
  const links = [];
  for (const attr of CHECK_ATTRS) {
    const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "gi");
    let match;
    while ((match = re.exec(html))) {
      links.push({ attr, url: match[1] });
    }
  }
  return links;
}

const allFiles = walk(ROOT);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html")).sort();
const existing = new Set(allFiles.map(toSitePath));
const missing = [];
const monthlyWeeklyIssues = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const links = extractLinks(html);

  for (const link of links) {
    if (isExternal(link.url)) continue;
    const target = link.url.startsWith("/")
      ? normalizeInternalUrl(link.url)
      : resolveRelativeUrl(file, link.url);
    if (!target) continue;
    if (!existing.has(target)) {
      missing.push({
        file: rel(file),
        attr: link.attr,
        url: link.url,
        target,
      });
    }
  }

  const base = path.basename(file);
  const annualMatch = base.match(/^(\d+)-salary-after-tax-uk\.html$/i);
  if (annualMatch) {
    const amount = annualMatch[1];
    const required = [`/${amount}-after-tax-monthly.html`, `/${amount}-after-tax-weekly.html`];
    for (const url of required) {
      if (!new RegExp(`href=["']${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(html)) {
        monthlyWeeklyIssues.push({ file: rel(file), issue: `missing link to ${url}` });
      } else if (!existing.has(url)) {
        monthlyWeeklyIssues.push({ file: rel(file), issue: `linked monthly/weekly target does not exist: ${url}` });
      }
    }
  }
}

console.log("Broken Link Audit");
console.log("=================");
console.log(`HTML files scanned: ${htmlFiles.length}`);
console.log(`Broken internal links/assets: ${missing.length}`);
console.log(`Monthly/weekly link issues: ${monthlyWeeklyIssues.length}`);

if (missing.length) {
  console.log("\nBroken internal links/assets:");
  for (const item of missing) {
    console.log(`FAIL ${item.file}`);
    console.log(`  ${item.attr}="${item.url}" -> ${item.target}`);
  }
}

if (monthlyWeeklyIssues.length) {
  console.log("\nMonthly/weekly link issues:");
  for (const item of monthlyWeeklyIssues) {
    console.log(`FAIL ${item.file}`);
    console.log(`  - ${item.issue}`);
  }
}

if (missing.length || monthlyWeeklyIssues.length) {
  process.exitCode = 1;
} else {
  console.log("\nPASS: no broken internal links or monthly/weekly link gaps found.");
}
