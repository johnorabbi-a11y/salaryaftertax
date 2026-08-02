const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SITE = "https://aftertaxtool.com/";

const experimentTargets = [
  "43000-salary-after-tax-uk.html",
  "59000-salary-after-tax-uk.html",
  "77000-salary-after-tax-uk.html",
  "37000-after-tax-monthly.html",
  "55000-after-tax-monthly.html",
  "70000-after-tax-monthly.html",
  "90000-after-tax-monthly.html",
  "90000-after-tax-weekly.html",
  "paycheck-deductions-calculator.html",
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function canonicalFor(html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function h1For(html) {
  const matches = html.match(/<h1\b[^>]*>/gi) || [];
  return matches.length;
}

function sitemapInventory() {
  const urls = new Set();
  for (const file of fs.readdirSync(ROOT).filter((name) => /^sitemap.*\.xml$/.test(name))) {
    const xml = read(file);
    for (const match of xml.matchAll(/<loc>(https:\/\/aftertaxtool\.com\/[^<]+)<\/loc>/g)) {
      urls.add(match[1]);
    }
  }
  return urls;
}

const sitemapUrls = sitemapInventory();
const index = read("index.html");
const monthly = read("monthly-pay-after-tax-calculator.html");

console.log("GSC query-routing regression audit");

for (const target of experimentTargets) {
  if (!exists(target)) fail(`Missing routed target ${target}`);
  if (!index.includes(`href="/${target}"`) && !monthly.includes(`href="/${target}"`)) {
    fail(`Experiment target is not linked from homepage or monthly hub: ${target}`);
  }

  const html = read(target);
  const expectedCanonical = SITE + target;
  const canonical = canonicalFor(html);
  if (canonical !== expectedCanonical) fail(`Canonical mismatch for ${target}: ${canonical}`);
  if (!sitemapUrls.has(expectedCanonical)) fail(`Target missing from sitemap inventory: ${target}`);
  if (h1For(html) !== 1) fail(`Expected one H1 in ${target}`);
}

const moduleMatch = index.match(/aria-label="Specific salary routes with current search evidence"[\s\S]*?<\/table>/);
if (!moduleMatch) {
  fail("Homepage specific salary route module missing");
} else {
  const links = [...moduleMatch[0].matchAll(/href="\/([^"#?]+\.html)"/g)].map((match) => match[1]);
  const uniqueLinks = new Set(links);
  if (links.length !== uniqueLinks.size) fail("Homepage experiment module contains duplicate links");
  if (links.length > 12) fail(`Homepage experiment module is too large (${links.length} links)`);
}

const intentChecks = [
  ["37000-after-tax-monthly.html", /monthly/i],
  ["55000-after-tax-monthly.html", /monthly/i],
  ["90000-after-tax-monthly.html", /monthly/i],
  ["90000-after-tax-weekly.html", /weekly/i],
  ["43000-salary-after-tax-uk.html", /UK|PAYE|National Insurance/i],
  ["paycheck-deductions-calculator.html", /deductions|paycheck|payroll/i],
];

for (const [file, pattern] of intentChecks) {
  const html = read(file);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
  if (!pattern.test(title + " " + h1)) {
    fail(`Intent wording weak in title/H1 for ${file}`);
  }
}

if (!process.exitCode) {
  console.log("PASS: GSC query-routing experiment targets are compact, canonical, sitemapped and intent-aligned.");
}
