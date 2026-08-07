const fs = require("fs");
const path = require("path");

const DEFAULT_REPO = "C:\\Users\\johno\\OneDrive\\Documenti\\GitHub\\salaryaftertax";
const SITE = "https://aftertaxtool.com/";

const args = process.argv.slice(2);
const repoArg = args.find((arg) => arg.startsWith("--repo="));
const sitemapsArg = args.find((arg) => arg.startsWith("--sitemaps="));
const repo = repoArg ? repoArg.slice("--repo=".length) : DEFAULT_REPO;
const sitemapDir = sitemapsArg ? sitemapsArg.slice("--sitemaps=".length) : process.cwd();

const expectedFamilies = {
  "sitemap-core.xml": "core",
  "sitemap-authority.xml": "authority",
  "sitemap-calculators.xml": "calculators",
  "sitemap-uk-annual.xml": "uk annual",
  "sitemap-uk-monthly.xml": "uk monthly",
  "sitemap-uk-weekly.xml": "uk weekly",
  "sitemap-uk-utilities.xml": "uk utilities",
  "sitemap-us-national.xml": "us national",
  "sitemap-us-state-hubs.xml": "us state hubs",
  "sitemap-us-state-annual.xml": "us state annual",
  "sitemap-us-state-monthly.xml": "us state monthly",
  "sitemap-us-state-weekly.xml": "us state weekly",
  "sitemap-compensation-payroll.xml": "compensation payroll",
};

const legacyPattern = /^sitemap-(tier\d+|clean|index)\.xml$/;

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function canonicalFor(html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function expectedCanonical(file) {
  return file === "index.html" ? SITE : SITE + file;
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function lastmods(xml) {
  return [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());
}

function fail(issues, message, data = {}) {
  issues.push({ message, ...data });
}

function fileForUrl(url) {
  if (url === SITE) return "index.html";
  if (!url.startsWith(SITE)) return null;
  return url.slice(SITE.length);
}

function main() {
  const issues = [];
  const warnings = [];

  const sitemapIndexPath = path.join(sitemapDir, "sitemap.xml");
  if (!fs.existsSync(sitemapIndexPath)) fail(issues, "sitemap.xml missing from sitemap directory", { sitemapDir });

  const htmlFiles = fs.readdirSync(repo).filter((file) => file.endsWith(".html"));
  const canonicalUrls = new Set();
  const canonicalByFile = new Map();
  for (const file of htmlFiles) {
    const html = read(path.join(repo, file));
    const canonical = canonicalFor(html);
    if (file === "google045f4d6b341942cf.html") continue;
    if (canonical === expectedCanonical(file)) {
      canonicalUrls.add(canonical);
      canonicalByFile.set(file, canonical);
    }
  }

  const indexXml = fs.existsSync(sitemapIndexPath) ? read(sitemapIndexPath) : "";
  if (!indexXml.includes('<?xml version="1.0" encoding="UTF-8"?>')) fail(issues, "sitemap.xml missing expected XML declaration");
  if (!/<sitemapindex\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(indexXml)) fail(issues, "sitemap.xml is not a valid sitemap index with expected namespace");
  if (indexXml.includes("<urlset")) fail(issues, "sitemap.xml must not be a urlset");

  const childUrls = locs(indexXml);
  const childFiles = childUrls.map((url) => url.replace(SITE, ""));
  const uniqueChildFiles = new Set(childFiles);
  if (childFiles.length !== uniqueChildFiles.size) fail(issues, "duplicate child sitemap references in sitemap.xml");
  for (const url of childUrls) {
    if (!url.startsWith(SITE)) fail(issues, "child sitemap URL is not HTTPS non-www AfterTaxTool URL", { url });
    if (legacyPattern.test(url.replace(SITE, ""))) fail(issues, "legacy sitemap referenced by sitemap.xml", { url });
  }
  for (const file of childFiles) {
    if (!(file in expectedFamilies)) fail(issues, "unexpected semantic child sitemap filename", { file });
    if (!fs.existsSync(path.join(sitemapDir, file))) fail(issues, "referenced child sitemap file missing", { file });
  }

  const sitemapFiles = fs.readdirSync(sitemapDir).filter((file) => /^sitemap.*\.xml$/.test(file));
  const allowedSitemapFiles = new Set(["sitemap.xml", ...Object.keys(expectedFamilies)]);
  const unexpectedSitemapFiles = sitemapFiles.filter((file) => !allowedSitemapFiles.has(file));
  if (unexpectedSitemapFiles.length) {
    fail(issues, "unexpected legacy or non-semantic sitemap files present", { unexpectedSitemapFiles });
  }
  const activeIndexes = sitemapFiles.filter((file) => {
    const xml = read(path.join(sitemapDir, file));
    return xml.includes("<sitemapindex");
  });
  if (activeIndexes.length !== 1 || activeIndexes[0] !== "sitemap.xml") {
    fail(issues, "expected exactly one active sitemap index named sitemap.xml", { activeIndexes });
  }
  for (const legacy of sitemapFiles.filter((file) => legacyPattern.test(file))) {
    fail(issues, "legacy sitemap file present in semantic sitemap directory", { legacy });
  }

  const urlOccurrences = new Map();
  const childCounts = {};
  const futureLastmods = [];
  const badLastmods = [];
  const today = new Date();

  for (const child of childFiles) {
    const xml = fs.existsSync(path.join(sitemapDir, child)) ? read(path.join(sitemapDir, child)) : "";
    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) fail(issues, "child missing expected XML declaration", { child });
    if (!/<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(xml)) fail(issues, "child is not a valid urlset with expected namespace", { child });
    if (xml.includes("<sitemapindex") || /<sitemap>/.test(xml)) fail(issues, "child sitemap contains sitemap index markup", { child });
    const childLocs = locs(xml);
    childCounts[child] = childLocs.length;
    if (childLocs.length > 50000) fail(issues, "child sitemap exceeds protocol URL limit", { child, count: childLocs.length });
    for (const url of childLocs) {
      if (!url.startsWith(SITE)) fail(issues, "sitemap URL is not HTTPS non-www AfterTaxTool URL", { child, url });
      if (url.includes("www.aftertaxtool.com") || url.startsWith("http://")) fail(issues, "sitemap URL uses forbidden host/protocol", { child, url });
      if (!canonicalUrls.has(url)) fail(issues, "sitemap URL is not a canonical indexable URL", { child, url });
      const file = fileForUrl(url);
      if (file && !fs.existsSync(path.join(repo, file))) fail(issues, "sitemap URL local file missing", { child, url, file });
      if (!urlOccurrences.has(url)) urlOccurrences.set(url, []);
      urlOccurrences.get(url).push(child);
    }
    for (const lastmod of lastmods(xml)) {
      const parsed = new Date(lastmod);
      if (Number.isNaN(parsed.getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(lastmod)) badLastmods.push({ child, lastmod });
      if (parsed > today) futureLastmods.push({ child, lastmod });
    }
  }

  const sitemapUrls = new Set(urlOccurrences.keys());
  const duplicates = [...urlOccurrences.entries()].filter(([, children]) => children.length > 1);
  const missing = [...canonicalUrls].filter((url) => !sitemapUrls.has(url));
  const extra = [...sitemapUrls].filter((url) => !canonicalUrls.has(url));

  if (duplicates.length) fail(issues, "duplicate URLs across semantic child sitemaps", { count: duplicates.length, sample: duplicates.slice(0, 10) });
  if (missing.length) fail(issues, "canonical URLs missing from semantic sitemap inventory", { count: missing.length, sample: missing.slice(0, 20) });
  if (extra.length) fail(issues, "extra non-canonical URLs in semantic sitemap inventory", { count: extra.length, sample: extra.slice(0, 20) });
  if (badLastmods.length) fail(issues, "invalid lastmod values", { badLastmods });
  if (futureLastmods.length) fail(issues, "future-dated lastmod values", { futureLastmods });

  const robotsPath = path.join(repo, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    const robots = read(robotsPath);
    const sitemapRefs = [...robots.matchAll(/^Sitemap:\s*(.+)$/gim)].map((m) => m[1].trim());
    if (sitemapRefs.length !== 1 || sitemapRefs[0] !== `${SITE}sitemap.xml`) {
      fail(issues, "robots.txt must reference only https://aftertaxtool.com/sitemap.xml", { sitemapRefs });
    }
  } else {
    fail(issues, "robots.txt missing");
  }

  const result = {
    repo,
    sitemapDir,
    canonicalIndexableUrlCount: canonicalUrls.size,
    sitemapUrlCount: sitemapUrls.size,
    childCounts,
    childSitemaps: childFiles,
    duplicateUrlCount: duplicates.length,
    missingCanonicalUrlCount: missing.length,
    extraUrlCount: extra.length,
    warnings,
    issues,
    pass: issues.length === 0,
    note: "Redirect checks require live HTTP verification after deployment; this audit proves local canonical inventory parity and semantic sitemap structure.",
  };

  console.log(JSON.stringify(result, null, 2));
  if (issues.length) process.exitCode = 1;
}

main();
