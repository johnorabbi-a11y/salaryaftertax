#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SITE = process.env.SITE_ORIGIN || "https://aftertaxtool.com";
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html") && !/^google[\w-]*\.html$/i.test(entry.name)) files.push(path.join(dir, entry.name));
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function pageUrl(file) {
  const relative = rel(file);
  if (relative === "index.html") return `${SITE}/`;
  return `${SITE}/${relative}`;
}

function getTag(html, re) {
  const match = html.match(re);
  return match ? match[1].trim().replace(/\s+/g, " ") : "";
}

function lineOf(html, needle) {
  const index = html.indexOf(needle);
  if (index < 0) return "";
  return html.slice(0, index).split(/\r?\n/).length;
}

const htmlFiles = walk(ROOT).sort();
const records = [];
const failures = [];
const titleMap = new Map();
const descriptionMap = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const fileName = path.basename(file);
  const title = getTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = getTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)
    || getTag(html, /<meta\s+content=["']([^"']*)["']\s+name=["']description["'][^>]*>/i);
  const canonical = getTag(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["'][^>]*>/i)
    || getTag(html, /<link\s+href=["']([^"']*)["']\s+rel=["']canonical["'][^>]*>/i);
  const expectedCanonical = pageUrl(file);
  const issues = [];

  if (!title) issues.push("missing title");
  if (!description) issues.push("missing meta description");
  if (!canonical) issues.push("missing canonical");
  if (canonical && canonical !== expectedCanonical) {
    issues.push(`canonical mismatch: expected ${expectedCanonical}, found ${canonical}`);
  }
  if (title && title.length < 25) issues.push(`title too short (${title.length} chars)`);
  if (title && title.length > 70) issues.push(`title too long (${title.length} chars)`);
  if (description && description.length < 70) issues.push(`description too short (${description.length} chars)`);
  if (description && description.length > 180) issues.push(`description too long (${description.length} chars)`);

  const salaryMatch = fileName.match(/^(\d+).*(after-tax|salary).*\.html$/i);
  if (salaryMatch) {
    const formattedAmount = Number(salaryMatch[1]).toLocaleString("en-GB");
    if (title && !title.includes(formattedAmount)) {
      issues.push(`salary-specific title check failed: missing ${formattedAmount}`);
    }
    if (description && !description.includes(formattedAmount)) {
      issues.push(`salary-specific description check failed: missing ${formattedAmount}`);
    }
  }

  const record = {
    file: rel(file),
    title,
    description,
    canonical,
    issues,
    titleLine: title ? lineOf(html, "<title") : "",
    descriptionLine: description ? lineOf(html, "description") : "",
    canonicalLine: canonical ? lineOf(html, "canonical") : "",
  };
  records.push(record);

  if (title) {
    const key = title.toLowerCase();
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key).push(record.file);
  }
  if (description) {
    const key = description.toLowerCase();
    if (!descriptionMap.has(key)) descriptionMap.set(key, []);
    descriptionMap.get(key).push(record.file);
  }
}

for (const record of records) {
  for (const issue of record.issues) {
    failures.push({
      file: record.file,
      issue,
      lines: [record.titleLine, record.descriptionLine, record.canonicalLine].filter(Boolean).join(", "),
    });
  }
}

function duplicateFailures(label, map) {
  for (const [value, files] of map.entries()) {
    if (files.length <= 1) continue;
    for (const file of files) {
      failures.push({
        file,
        issue: `duplicate ${label}: shared by ${files.length} pages`,
        detail: value,
      });
    }
  }
}

duplicateFailures("title", titleMap);
duplicateFailures("description", descriptionMap);

console.log("Metadata Audit");
console.log("==============");
console.log(`HTML files scanned: ${htmlFiles.length}`);
console.log(`Pass: ${htmlFiles.length - new Set(failures.map((f) => f.file)).size}`);
console.log(`Files with metadata issues: ${new Set(failures.map((f) => f.file)).size}`);
console.log(`Total issues: ${failures.length}`);

if (failures.length) {
  console.log("\nFailures:");
  for (const item of failures) {
    console.log(`FAIL ${item.file}`);
    console.log(`  - ${item.issue}${item.lines ? ` (line ${item.lines})` : ""}`);
    if (item.detail) console.log(`    ${item.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nPASS: metadata is complete, canonicalized, and unique.");
}

