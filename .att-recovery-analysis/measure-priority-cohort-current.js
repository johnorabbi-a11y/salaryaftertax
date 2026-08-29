const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = __dirname;
const site = 'https://aftertaxtool.com/';

function walk(dir, predicate, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, acc);
    else if (predicate(full)) acc.push(full);
  }
  return acc;
}

function routeForFile(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return '/' + rel;
}

function normaliseHref(href, fromRoute) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  let clean = href.split('#')[0].split('?')[0];
  if (clean.startsWith(site)) clean = clean.slice(site.length - 1);
  if (/^https?:\/\//i.test(clean) || clean.startsWith('//')) return null;
  if (!clean) return null;
  if (!clean.startsWith('/')) {
    const base = fromRoute === '/' ? '/' : fromRoute.replace(/[^/]+$/, '');
    clean = path.posix.normalize(base + clean);
    if (!clean.startsWith('/')) clean = '/' + clean;
  }
  if (clean === '/index.html') return '/';
  return clean;
}

function linksFrom(html, route) {
  const links = new Set();
  const hrefRe = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRe.exec(html))) {
    const href = normaliseHref(match[1], route);
    if (href && (href === '/' || href.endsWith('.html') || href.endsWith('.xml') || href.endsWith('.ico'))) {
      links.add(href);
    }
  }
  return [...links];
}

function buildGraph() {
  const files = walk(root, (f) => f.endsWith('.html'));
  const routes = new Set(files.map(routeForFile));
  const outgoing = new Map();
  const incoming = new Map([...routes].map((r) => [r, new Set()]));
  for (const file of files) {
    const route = routeForFile(file);
    const html = fs.readFileSync(file, 'utf8');
    const links = linksFrom(html, route).filter((l) => routes.has(l));
    outgoing.set(route, new Set(links));
    for (const link of links) incoming.get(link).add(route);
  }
  const depth = new Map();
  const queue = ['/'];
  depth.set('/', 0);
  while (queue.length) {
    const current = queue.shift();
    for (const next of outgoing.get(current) || []) {
      if (!depth.has(next)) {
        depth.set(next, depth.get(current) + 1);
        queue.push(next);
      }
    }
  }
  return { routes, incoming, outgoing, depth };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map((line) => {
    const values = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function writeCsv(file, rows) {
  const headers = Object.keys(rows[0] || {});
  fs.writeFileSync(file, [headers.join(','), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(','))].join('\n'));
}

const cohort = parseCsv(fs.readFileSync(path.join(out, 'aftertaxtool-priority-cohort.csv'), 'utf8'));
const graph = buildGraph();
const rows = cohort.map((row) => {
  const route = row.URL.replace(site.replace(/\/$/, ''), '');
  const currentInbound = graph.incoming.get(route)?.size || 0;
  const currentDepth = graph.depth.has(route) ? graph.depth.get(route) : '';
  return {
    ...row,
    'inbound after current': currentInbound,
    'inbound change current': currentInbound - Number(row["existing inbound link count"] || 0),
    'depth after current': currentDepth,
    'depth change current': currentDepth === '' ? '' : currentDepth - Number(row["existing crawl depth"] || 0)
  };
});

writeCsv(path.join(out, 'aftertaxtool-priority-link-impact-current.csv'), rows);

const depths = [...graph.depth.values()].sort((a, b) => a - b);
const p95 = depths[Math.floor(depths.length * 0.95)] || 0;
const unreachable = [...graph.routes].filter((r) => !graph.depth.has(r));
const zeroInbound = [...graph.routes].filter((r) => r !== '/' && (graph.incoming.get(r)?.size || 0) === 0);
const weakInbound = [...graph.routes].filter((r) => r !== '/' && (graph.incoming.get(r)?.size || 0) <= 2);

const summary = {
  cohortSize: cohort.length,
  cohortAvgInboundBefore: rows.reduce((s, r) => s + Number(r['existing inbound link count'] || 0), 0) / rows.length,
  cohortAvgInboundAfter: rows.reduce((s, r) => s + Number(r['inbound after current'] || 0), 0) / rows.length,
  newCohortInboundLinks: rows.reduce((s, r) => s + Number(r['inbound change current'] || 0), 0),
  reachableRoutes: graph.depth.size,
  unreachableRoutes: unreachable.length,
  zeroInboundRoutes: zeroInbound.length,
  weakInboundRoutes: weakInbound.length,
  p95Depth: p95,
  maxDepth: depths[depths.length - 1] || 0,
  unreachableSample: unreachable.slice(0, 10),
  zeroInboundSample: zeroInbound.slice(0, 10)
};

fs.writeFileSync(path.join(out, 'aftertaxtool-priority-current-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
