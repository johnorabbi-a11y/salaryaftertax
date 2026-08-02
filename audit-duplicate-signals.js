const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const EXCLUDED_HTML = new Set(['google045f4d6b341942cf.html']);
const LEGACY_CANONICAL_FILES = new Set(['hourly-to-salary-UK-Us.html']);

function strip(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getTitle(html) {
  return strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
}

function getDescription(html) {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  return (match ? match[1] : '').replace(/\s+/g, ' ').trim();
}

function getCanonical(html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  return match ? match[1].trim() : '';
}

function getH1(html) {
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  return h1s.join(' | ');
}

function grouped(entries) {
  const groups = new Map();
  for (const [file, value] of entries) {
    if (!value) continue;
    const list = groups.get(value) || [];
    list.push(file);
    groups.set(value, list);
  }
  return [...groups.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([value, files]) => ({ value, files }));
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !EXCLUDED_HTML.has(f));
const rows = files.map((file) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return {
    file,
    title: getTitle(html),
    description: getDescription(html),
    canonical: getCanonical(html),
    h1: getH1(html),
  };
});

const result = {
  htmlFilesChecked: files.length,
  duplicateTitles: grouped(rows.map((r) => [r.file, r.title])),
  duplicateDescriptions: grouped(rows.map((r) => [r.file, r.description])),
  duplicateCanonicals: grouped(rows.filter((r) => !LEGACY_CANONICAL_FILES.has(r.file)).map((r) => [r.file, r.canonical])),
  duplicateH1s: grouped(rows.map((r) => [r.file, r.h1])),
};

result.pass = result.duplicateTitles.length === 0
  && result.duplicateDescriptions.length === 0
  && result.duplicateCanonicals.length === 0
  && result.duplicateH1s.length === 0;

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
