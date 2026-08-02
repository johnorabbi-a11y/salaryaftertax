#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE = 'https://aftertaxtool.com/';
const INDEX = path.join(ROOT, 'index.html');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function tag(html, re) {
  const match = html.match(re);
  return match ? match[1].trim().replace(/\s+/g, ' ') : '';
}

function attrs(markup) {
  const out = {};
  for (const match of markup.matchAll(/\s([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    out[match[1].toLowerCase()] = match[3] ?? match[4] ?? '';
  }
  return out;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

const html = read(INDEX);
const failures = [];
const warnings = [];

const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
if (titles.length !== 1) failures.push(`homepage should have exactly one title, found ${titles.length}`);
if (titles[0] && (titles[0].length < 45 || titles[0].length > 70)) warnings.push(`homepage title length is ${titles[0].length}`);

const description = tag(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)
  || tag(html, /<meta\s+content=["']([^"']*)["']\s+name=["']description["'][^>]*>/i);
if (!description) failures.push('homepage meta description missing');
if (description && (description.length < 120 || description.length > 170)) warnings.push(`homepage description length is ${description.length}`);

const canonical = tag(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)
  || tag(html, /<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i);
if (canonical !== SITE) failures.push(`homepage canonical should be ${SITE}, found ${canonical || '(missing)'}`);

const h1s = [...html.matchAll(/<h1\b[^>]*>/gi)];
if (h1s.length !== 1) failures.push(`homepage should have exactly one H1, found ${h1s.length}`);
if (titles[0] && tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) === titles[0]) {
  warnings.push('homepage H1 exactly matches title');
}

const imageFindings = [];
for (const file of walk(ROOT)) {
  const page = read(file);
  for (const match of page.matchAll(/<img\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    if (!Object.prototype.hasOwnProperty.call(a, 'alt')) {
      imageFindings.push({ file: rel(file), img: match[0].slice(0, 160) });
    }
  }
}
if (imageFindings.length) failures.push(`images missing alt attributes: ${imageFindings.length}`);

const jsonLdBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
let organizationCount = 0;
let websiteCount = 0;
for (const [i, block] of jsonLdBlocks.entries()) {
  let parsed;
  try {
    parsed = JSON.parse(block);
  } catch (err) {
    failures.push(`homepage JSON-LD block ${i + 1} is malformed: ${err.message}`);
    continue;
  }
  const nodes = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
  for (const node of nodes) {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.includes('Organization')) organizationCount += 1;
    if (types.includes('WebSite')) websiteCount += 1;
    if (node.potentialAction && JSON.stringify(node.potentialAction).includes('SearchAction')) {
      failures.push('homepage includes SearchAction but no internal site search was verified');
    }
  }
}
if (organizationCount !== 1) failures.push(`homepage should expose one Organization node, found ${organizationCount}`);
if (websiteCount !== 1) failures.push(`homepage should expose one WebSite node, found ${websiteCount}`);

const ogUrl = tag(html, /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["'][^>]*>/i)
  || tag(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:url["'][^>]*>/i);
if (ogUrl && ogUrl !== canonical) failures.push(`og:url disagrees with canonical: ${ogUrl} vs ${canonical}`);

const ogImage = tag(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i);
const twitterImage = tag(html, /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/i);
for (const [label, imageUrl] of [['og:image', ogImage], ['twitter:image', twitterImage]]) {
  if (!imageUrl) continue;
  if (!imageUrl.startsWith(SITE)) {
    failures.push(`${label} is not an aftertaxtool.com URL: ${imageUrl}`);
    continue;
  }
  const file = imageUrl === SITE ? 'index.html' : decodeURIComponent(new URL(imageUrl).pathname.replace(/^\//, ''));
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`${label} points to missing local file: ${imageUrl}`);
}

for (const fakeSocial of ['twitter:site', 'fb:app_id', 'sameAs']) {
  if (html.includes(fakeSocial)) failures.push(`homepage contains unsupported social/account metadata: ${fakeSocial}`);
}

const requiredStaticRoutes = [
  '/salary-after-tax-us.html',
  '/salary-after-tax-uk.html',
  '/salary-after-tax-by-state.html',
  '/planning-calculators.html',
  '/methodology.html',
  '/tax-assumptions.html',
  '/editorial-standards.html',
  '/salary-tax-calculator-uk.html',
  '/monthly-pay-after-tax-calculator.html',
];
for (const href of requiredStaticRoutes) {
  if (!html.includes(`href="${href}"`)) failures.push(`important homepage route is not present in static HTML: ${href}`);
}

const result = {
  title: titles[0] || '',
  titleLength: titles[0] ? titles[0].length : 0,
  description,
  descriptionLength: description.length,
  canonical,
  h1Count: h1s.length,
  homepageImgCount: [...html.matchAll(/<img\b[^>]*>/gi)].length,
  missingAltCount: imageFindings.length,
  jsonLdBlocks: jsonLdBlocks.length,
  organizationCount,
  websiteCount,
  ogUrl: ogUrl || null,
  ogImage: ogImage || null,
  twitterImage: twitterImage || null,
  warnings,
  failures,
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
