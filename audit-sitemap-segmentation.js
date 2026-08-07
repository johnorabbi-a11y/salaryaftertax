const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const HOST = "https://aftertaxtool.com/";

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function canonicalOf(html) {
  return (
    html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ||
    html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1] ||
    null
  );
}

function fileForUrl(url) {
  if (!url.startsWith(HOST)) return null;
  const pathname = new URL(url).pathname;
  return pathname === "/" ? "index.html" : decodeURIComponent(pathname.replace(/^\//, ""));
}

function isExcluded(file) {
  return /^google[\w-]*\.html$/i.test(file) || file === "404.html" || file.endsWith(".xml.html");
}

function indexableFiles() {
  const files = fs.readdirSync(ROOT).filter((file) => file.endsWith(".html")).sort();
  const indexable = [];
  const excluded = [];

  for (const file of files) {
    if (isExcluded(file)) {
      excluded.push({ file, reason: "technical or verification HTML" });
      continue;
    }

    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    const canonical = canonicalOf(html) || (file === "index.html" ? HOST : HOST + file);
    const mapped = fileForUrl(canonical);

    if (!canonical.startsWith(HOST)) {
      excluded.push({ file, reason: `non-aftertaxtool canonical: ${canonical}` });
      continue;
    }
    if (!mapped || !fs.existsSync(path.join(ROOT, mapped))) {
      excluded.push({ file, reason: `canonical target missing locally: ${canonical}` });
      continue;
    }
    if (mapped !== file) {
      excluded.push({ file, reason: `canonicalises to ${mapped}` });
      continue;
    }

    indexable.push({ file, url: canonical });
  }

  return { files, indexable, excluded };
}

const rootFiles = fs.readdirSync(ROOT);
const lowerFileMap = new Map(rootFiles.map((file) => [file.toLowerCase(), file]));
const sitemapFiles = rootFiles.filter((file) => /^sitemap.*\.xml$/i.test(file)).sort();
const sitemapXml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = locs(sitemapXml).sort();
const sitemapSet = new Set(sitemapUrls);
const { files: htmlFiles, indexable, excluded } = indexableFiles();
const expectedUrls = indexable.map((item) => item.url).sort();
const expectedSet = new Set(expectedUrls);

const duplicates = [...sitemapUrls.reduce((map, url) => {
  map.set(url, (map.get(url) || 0) + 1);
  return map;
}, new Map()).entries()]
  .filter(([, count]) => count > 1)
  .map(([url, count]) => ({ url, count }));

const malformed = sitemapUrls.filter((url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol !== "https:" || parsed.hostname !== "aftertaxtool.com" || /\s/.test(url) || url.includes("www.");
  } catch {
    return true;
  }
});

const missingFiles = [];
const caseMismatches = [];
for (const url of sitemapUrls) {
  const file = fileForUrl(url);
  if (!file || !fs.existsSync(path.join(ROOT, file))) {
    missingFiles.push({ url, file });
  } else {
    const actual = lowerFileMap.get(file.toLowerCase());
    if (actual && actual !== file) caseMismatches.push({ url, file, actual });
  }
}

const missingFromSitemap = expectedUrls.filter((url) => !sitemapSet.has(url));
const extraInSitemap = sitemapUrls.filter((url) => !expectedSet.has(url));
const requiredMajor = [
  "https://aftertaxtool.com/",
  "https://aftertaxtool.com/salary-after-tax-us.html",
  "https://aftertaxtool.com/salary-after-tax-by-state.html",
  "https://aftertaxtool.com/salary-after-tax-uk.html",
  "https://aftertaxtool.com/planning-calculators.html"
];
const missingMajor = requiredMajor.filter((url) => !sitemapSet.has(url));
const robots = fs.existsSync(path.join(ROOT, "robots.txt")) ? fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8") : "";
const robotsSitemaps = [...robots.matchAll(/^Sitemap:\s*(\S+)/gmi)].map((match) => match[1]);

const result = {
  mode: "classic-urlset",
  sitemapFiles,
  sitemapXmlIsUrlset: /<urlset\b/.test(sitemapXml),
  sitemapXmlIsIndex: /<sitemapindex\b/.test(sitemapXml),
  totalSitemapUrls: sitemapUrls.length,
  uniqueSitemapUrls: sitemapSet.size,
  localHtmlCount: htmlFiles.length,
  localIndexableHtmlCount: indexable.length,
  excludedFiles: excluded,
  duplicates,
  missingFiles,
  caseMismatches,
  malformed,
  missingFromSitemap,
  extraInSitemap,
  missingMajor,
  robotsSitemaps,
  robotsOk: robotsSitemaps.length === 1 && robotsSitemaps[0] === HOST + "sitemap.xml",
  noLastmod: !/<lastmod>/i.test(sitemapXml)
};

console.log(JSON.stringify(result, null, 2));

if (
  sitemapFiles.length !== 1 ||
  sitemapFiles[0] !== "sitemap.xml" ||
  !result.sitemapXmlIsUrlset ||
  result.sitemapXmlIsIndex ||
  duplicates.length ||
  missingFiles.length ||
  caseMismatches.length ||
  malformed.length ||
  missingFromSitemap.length ||
  extraInSitemap.length ||
  missingMajor.length ||
  !result.robotsOk ||
  !result.noLastmod
) {
  process.exitCode = 1;
}
