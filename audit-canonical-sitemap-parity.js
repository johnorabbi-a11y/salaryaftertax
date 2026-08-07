const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://aftertaxtool.com/';
const EXCLUDED_HTML = new Set(['google045f4d6b341942cf.html']);
const LEGACY_CANONICALS = new Map([
  ['hourly-to-salary-UK-Us.html', SITE + 'hourly-to-salary.html'],
]);

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function canonicalFor(file, html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  return match ? match[1].trim() : '';
}

function fileForUrl(url) {
  if (url === SITE || url === SITE.slice(0, -1)) return 'index.html';
  if (!url.startsWith(SITE)) return null;
  return decodeURIComponent(url.slice(SITE.length));
}

const sitemapIndex = read('sitemap.xml');
const sitemapIsIndex = /<sitemapindex\b/i.test(sitemapIndex);
const sitemapIsUrlset = /<urlset\b/i.test(sitemapIndex);
const childSitemaps = sitemapIsIndex ? locs(sitemapIndex).map(fileForUrl).filter(Boolean) : [];
const sitemapUrls = [];
const childIssues = [];

if (sitemapIsUrlset) {
  sitemapUrls.push(...locs(sitemapIndex));
} else if (sitemapIsIndex) {
  for (const child of childSitemaps) {
    if (!fs.existsSync(path.join(ROOT, child))) {
      childIssues.push({ child, issue: 'referenced child sitemap missing locally' });
      continue;
    }
    const xml = read(child);
    const childLocs = locs(xml);
    const childSitemapRefs = childLocs.filter((url) => /sitemap.*\.xml$/i.test(url));
    if (childSitemapRefs.length) childIssues.push({ child, issue: 'child sitemap references another sitemap', refs: childSitemapRefs });
    sitemapUrls.push(...childLocs);
  }
} else {
  childIssues.push({ child: 'sitemap.xml', issue: 'sitemap.xml is neither sitemapindex nor urlset' });
}

const duplicates = [...new Set(sitemapUrls.filter((url, i) => sitemapUrls.indexOf(url) !== i))];
const sitemapSet = new Set(sitemapUrls);
const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !EXCLUDED_HTML.has(f));
const issues = [];
const canonicalGroups = new Map();

for (const file of htmlFiles) {
  const html = read(file);
  const canonical = canonicalFor(file, html);
  const legacyCanonical = LEGACY_CANONICALS.get(file);
  const expected = legacyCanonical || (file === 'index.html' ? SITE : SITE + file);
  if (!canonical) issues.push({ file, issue: 'missing canonical' });
  if (canonical && canonical !== expected) issues.push({ file, issue: 'canonical does not match expected URL', canonical, expected });
  if (canonical && !sitemapSet.has(canonical)) issues.push({ file, issue: 'canonical URL missing from sitemap inventory', canonical });
  if (canonical && /^http:\/\//i.test(canonical)) issues.push({ file, issue: 'canonical uses http', canonical });
  if (canonical && /^https:\/\/www\./i.test(canonical)) issues.push({ file, issue: 'canonical uses www', canonical });
  if (canonical === SITE && file !== 'index.html') issues.push({ file, issue: 'non-homepage canonical points to root' });
  if (canonical && !legacyCanonical) {
    const list = canonicalGroups.get(canonical) || [];
    list.push(file);
    canonicalGroups.set(canonical, list);
  }
}

const duplicateCanonicals = [...canonicalGroups.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([canonical, files]) => ({ canonical, files }));

const missingLocalFiles = sitemapUrls
  .map((url) => ({ url, file: fileForUrl(url) }))
  .filter(({ file }) => !file || !fs.existsSync(path.join(ROOT, file)));

const missingFromSitemap = htmlFiles
  .filter((file) => !LEGACY_CANONICALS.has(file))
  .map((file) => (file === 'index.html' ? SITE : SITE + file))
  .filter((url) => !sitemapSet.has(url));

const result = {
  sitemapMode: sitemapIsUrlset ? 'classic-urlset' : (sitemapIsIndex ? 'sitemap-index' : 'unknown'),
  childSitemaps,
  childIssues,
  sitemapUrlCount: sitemapUrls.length,
  uniqueSitemapUrlCount: sitemapSet.size,
  duplicateSitemapUrls: duplicates,
  htmlFilesChecked: htmlFiles.length,
  issues,
  duplicateCanonicals,
  missingLocalFiles,
  missingFromSitemap,
  pass: childIssues.length === 0
    && duplicates.length === 0
    && issues.length === 0
    && duplicateCanonicals.length === 0
    && missingLocalFiles.length === 0
    && missingFromSitemap.length === 0,
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
