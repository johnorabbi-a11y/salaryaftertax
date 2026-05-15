#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasLink(html, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`href=["']${escaped}["']`, "i").test(html);
}

function introParagraphCount(html) {
  const lower = html.toLowerCase();
  const answerIndex = lower.search(/<[^>]+class=["'][^"']*answer-box[^"']*["']/);
  const firstH2 = lower.indexOf("<h2");
  const cut = answerIndex >= 0 ? answerIndex : firstH2 >= 0 ? firstH2 : html.length;
  return (html.slice(0, cut).match(/<p(?:\s|>)/gi) || []).length;
}

function checkPage(file) {
  const fileName = path.basename(file);
  const html = fs.readFileSync(file, "utf8");
  const lower = html.toLowerCase();
  const text = stripTags(html);
  const issues = [];
  const isUkAnnualSalary = /^\d+-salary-after-tax-uk\.html$/i.test(fileName);
  const amount = isUkAnnualSalary ? fileName.match(/^(\d+)/)[1] : null;

  const paragraphCount = (lower.match(/<p(?:\s|>)/g) || []).length;
  const tableCount = (lower.match(/<table/g) || []).length;
  const wordCount = text ? text.split(/\s+/).length : 0;

  if (wordCount < 550) issues.push(`thin body copy (${wordCount} words)`);
  if (paragraphCount < 8) issues.push(`few paragraphs (${paragraphCount})`);
  if (tableCount < 2) issues.push(`few tables (${tableCount})`);
  if (!/<h1[\s>]/i.test(html)) issues.push("missing H1");
  if (!/<h2[\s>]/i.test(html)) issues.push("missing H2 sections");

  if (isUkAnnualSalary) {
    const introCount = introParagraphCount(html);
    if (introCount < 3) issues.push(`thin intro (${introCount} intro paragraphs before answer/table section)`);
    if (!/answer-box|direct answer/i.test(html)) issues.push("missing direct answer box");
    if (!(lower.includes("yearly") && lower.includes("monthly") && lower.includes("weekly") && tableCount > 0)) {
      issues.push("missing yearly/monthly/weekly breakdown table");
    }
    if (!(lower.includes("income tax") && lower.includes("national insurance") && lower.includes("total deductions"))) {
      issues.push("missing deductions table");
    }
    if (!(lower.includes("monthly budget") && lower.includes("rent"))) {
      issues.push("missing monthly budget context/table");
    }
    if (!(lower.includes("nearby salary") || lower.includes("nearby salaries") || lower.includes("compared with nearby salaries"))) {
      issues.push("missing nearby salary comparison/linking section");
    }
    if (!hasLink(html, `/${amount}-after-tax-monthly.html`)) issues.push("missing monthly version link");
    if (!hasLink(html, `/${amount}-after-tax-weekly.html`)) issues.push("missing weekly version link");
    if (!/faq/i.test(html)) issues.push("missing FAQ section");
    if (lower.lastIndexOf("advertisement") > lower.lastIndexOf("final summary")) {
      issues.push("page appears to end after an ad");
    }
  }

  return {
    file: rel(file),
    issues,
    wordCount,
    paragraphCount,
    tableCount,
  };
}

const htmlFiles = walk(ROOT).sort();
const results = htmlFiles.map(checkPage);
const failures = results.filter((result) => result.issues.length > 0);

console.log("Thin Page Audit");
console.log("================");
console.log(`HTML files scanned: ${htmlFiles.length}`);
console.log(`Pass: ${htmlFiles.length - failures.length}`);
console.log(`Fail: ${failures.length}`);

if (failures.length) {
  console.log("\nFailures:");
  for (const result of failures) {
    console.log(`\nFAIL ${result.file}`);
    console.log(`  words=${result.wordCount} paragraphs=${result.paragraphCount} tables=${result.tableCount}`);
    for (const issue of result.issues) console.log(`  - ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nPASS: no structurally thin pages found.");
}
