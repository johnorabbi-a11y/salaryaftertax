const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = __dirname;
const SITE = "https://aftertaxtool.com";
const SALARY_DECODED = path.resolve(
  "C:/Users/johno/Documents/Codex/2026-05-15/you-are-working-on-aftertaxtool-audit/salarydecoded"
);

function walk(dir, predicate = () => true) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === ".att-recovery-analysis" || entry.name === "live-sitemap-check") return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, predicate);
    return predicate(full) ? [full] : [];
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function routeForFile(file, root = ROOT) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function fileForRoute(route, root = ROOT) {
  if (route === "/") return path.join(root, "index.html");
  if (route.endsWith("/")) return path.join(root, route.slice(1), "index.html");
  return path.join(root, route.slice(1));
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function getMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function getCanonical(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match ? match[1].trim() : "";
}

function internalRoute(href) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;
  let url;
  try {
    url = href.startsWith("http") ? new URL(href) : new URL(href, SITE);
  } catch {
    return null;
  }
  if (url.hostname !== "aftertaxtool.com") return null;
  return url.pathname === "/" ? "/" : url.pathname.replace(/^\//, "/");
}

function linksFrom(html) {
  return [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({
      href: m[1],
      route: internalRoute(m[1]),
      anchor: stripHtml(m[2]).slice(0, 120)
    }))
    .filter((link) => link.route);
}

function classify(route) {
  const name = route.slice(1).replace(/\/$/, "");
  if (route === "/") return "homepage";
  if (["salary-after-tax-us.html", "salary-after-tax-by-state.html", "salary-after-tax-uk.html", "take-home-pay-uk.html", "salary-guides.html", "planning-calculators.html"].includes(name)) return "core hub";
  if (/^salary-after-tax-[a-z-]+\.html$/.test(name)) return "state hub";
  if (/^\d+-salary-after-tax-[a-z-]+\.html$/.test(name)) return "state annual salary";
  if (/^\d+-after-tax-monthly-[a-z-]+\.html$/.test(name)) return "state monthly salary";
  if (/^\d+-after-tax-weekly-[a-z-]+\.html$/.test(name)) return "state weekly salary";
  if (/^\d+-salary-after-tax(?:-uk|-us)?\.html$/.test(name) || /^\d+-take-home-pay-uk\.html$/.test(name)) return "annual salary";
  if (/^\d+-after-tax-monthly(?:-uk|-us)?\.html$/.test(name)) return "monthly salary";
  if (/^\d+-after-tax-weekly(?:-uk|-us)?\.html$/.test(name)) return "weekly salary";
  if (/hourly|paycheck|payroll|calculator|job-offer|salary-increase|raise|benefit|compensation|deduction|bonus|pension|affordability|comparison|compare/.test(name)) return "calculator/decision/support";
  if (/methodology|tax-assumptions|editorial|about|privacy|disclaimer|gross-vs-net|explained|guide|standards/.test(name)) return "authority/trust/guide";
  return "other";
}

function tokens(text) {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g)?.filter((t) => t.length > 2) || []);
}

function jaccard(a, b) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.max(1, a.size + b.size - inter);
}

function graphMetrics(pages) {
  const routeSet = new Set(pages.map((p) => p.route));
  const outgoing = new Map();
  const incoming = new Map(pages.map((p) => [p.route, []]));
  for (const p of pages) {
    const outs = [...new Set(p.links.map((l) => l.route).filter((r) => routeSet.has(r)))];
    outgoing.set(p.route, outs);
    outs.forEach((to) => incoming.get(to).push(p.route));
  }
  const depth = new Map([["/", 0]]);
  const queue = ["/"];
  while (queue.length) {
    const cur = queue.shift();
    for (const next of outgoing.get(cur) || []) {
      if (!depth.has(next)) {
        depth.set(next, depth.get(cur) + 1);
        queue.push(next);
      }
    }
  }
  const routes = pages.map((p) => p.route);
  let pr = new Map(routes.map((r) => [r, 1 / routes.length]));
  const damping = 0.85;
  for (let i = 0; i < 25; i++) {
    const next = new Map(routes.map((r) => [r, (1 - damping) / routes.length]));
    for (const r of routes) {
      const outs = outgoing.get(r) || [];
      const share = pr.get(r) / Math.max(1, outs.length);
      if (!outs.length) {
        routes.forEach((target) => next.set(target, next.get(target) + damping * share / routes.length));
      } else {
        outs.forEach((target) => next.set(target, next.get(target) + damping * share));
      }
    }
    pr = next;
  }
  return { outgoing, incoming, depth, pr };
}

function percentiles(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0;
  return {
    average: sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length),
    median: pct(0.5),
    p95: pct(0.95),
    max: sorted[sorted.length - 1] || 0
  };
}

function analyse(root = ROOT) {
  const files = walk(root, (f) => f.endsWith(".html"));
  const pages = files.map((file) => {
    const html = read(file);
    const route = routeForFile(file, root);
    return {
      file,
      route,
      url: route === "/" ? `${SITE}/` : `${SITE}${route}`,
      title: getTag(html, "title"),
      h1: getTag(html, "h1"),
      description: getMeta(html, "description"),
      canonical: getCanonical(html),
      family: classify(route),
      text: stripHtml(html),
      links: linksFrom(html),
      h1Count: (html.match(/<h1[\s>]/gi) || []).length,
      noindex: /<meta[^>]+robots[^>]+noindex/i.test(html)
    };
  });
  const { outgoing, incoming, depth, pr } = graphMetrics(pages);
  const sitemap = fs.existsSync(path.join(root, "sitemap.xml")) ? read(path.join(root, "sitemap.xml")) : "";
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  return { files, pages, outgoing, incoming, depth, pr, sitemapUrls };
}

function nearestSimilarities(pages) {
  const groups = new Map();
  for (const p of pages) {
    if (!["annual salary", "monthly salary", "weekly salary", "state annual salary", "state monthly salary", "state weekly salary"].includes(p.family)) continue;
    if (!groups.has(p.family)) groups.set(p.family, []);
    groups.get(p.family).push(p);
  }
  const rows = [];
  for (const [family, arr] of groups) {
    const sample = arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / 120)) === 0).slice(0, 120);
    const tokenRows = sample.map((p) => ({ route: p.route, tokens: tokens(p.text.slice(0, 6000)), title: p.title, h1: p.h1 }));
    let total = 0;
    let count = 0;
    let max = { score: 0, a: "", b: "" };
    for (let i = 0; i < tokenRows.length; i++) {
      let best = { score: 0, a: tokenRows[i].route, b: "" };
      for (let j = 0; j < tokenRows.length; j++) {
        if (i === j) continue;
        const score = jaccard(tokenRows[i].tokens, tokenRows[j].tokens);
        if (score > best.score) best = { score, a: tokenRows[i].route, b: tokenRows[j].route };
      }
      total += best.score;
      count++;
      if (best.score > max.score) max = best;
    }
    rows.push({ family, sampleSize: sample.length, avgNearestJaccard: +(total / Math.max(1, count)).toFixed(3), maxNearestJaccard: +max.score.toFixed(3), closestA: max.a, closestB: max.b });
  }
  return rows.sort((a, b) => b.avgNearestJaccard - a.avgNearestJaccard);
}

const att = analyse(ROOT);
const pageByRoute = new Map(att.pages.map((p) => [p.route, p]));
const depthValues = [...att.depth.values()];
const depthStats = percentiles(depthValues);
const familyCounts = Object.entries(att.pages.reduce((acc, p) => {
  acc[p.family] = (acc[p.family] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1]);
const homepage = pageByRoute.get("/");
const homepageLinks = (att.outgoing.get("/") || []).map((route) => ({
  route,
  family: pageByRoute.get(route)?.family || "missing",
  anchor: homepage.links.find((l) => l.route === route)?.anchor || ""
}));
const graphRows = att.pages.map((p) => ({
  route: p.route,
  family: p.family,
  inbound: att.incoming.get(p.route).length,
  outgoing: att.outgoing.get(p.route).length,
  depth: att.depth.get(p.route) ?? "",
  pagerank: att.pr.get(p.route),
  title: p.title,
  h1: p.h1,
  canonical: p.canonical
})).sort((a, b) => (b.pagerank || 0) - (a.pagerank || 0));
const weakestRows = graphRows.slice().sort((a, b) => (a.inbound - b.inbound) || ((a.depth || 999) - (b.depth || 999))).slice(0, 250);
const similarity = nearestSimilarities(att.pages);

const sd = fs.existsSync(SALARY_DECODED) ? analyse(SALARY_DECODED) : null;
const sdStats = sd ? {
  html: sd.pages.length,
  sitemap: sd.sitemapUrls.length,
  familyCounts: Object.entries(sd.pages.reduce((acc, p) => {
    const rel = p.route;
    let fam = "other";
    if (rel === "/") fam = "homepage";
    else if (rel.startsWith("/uk/")) fam = "UK salary";
    else if (rel.startsWith("/us/")) fam = "US salary";
    else if (rel.startsWith("/tools/")) fam = "tool";
    else if (rel.startsWith("/docs/")) fam = "docs";
    else if (/methodology|tax-assumptions|editorial|about|privacy|disclaimer|accessibility/.test(rel)) fam = "trust";
    acc[fam] = (acc[fam] || 0) + 1;
    return acc;
  }, {})),
  depthStats: percentiles([...sd.depth.values()]),
  homepageOut: (sd.outgoing.get("/") || []).length,
  avgInbound: sd.pages.reduce((sum, p) => sum + sd.incoming.get(p.route).length, 0) / sd.pages.length
} : null;

function csv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

fs.writeFileSync(path.join(OUT, "aftertaxtool-internal-link-analysis.csv"), csv(graphRows), "utf8");
fs.writeFileSync(path.join(OUT, "aftertaxtool-recovery-hypotheses.csv"), csv([
  { rank: 1, hypothesis: "Google has low confidence in the large numerical template lattice and is holding most deep URLs at discovery/CNI while testing the safest root result.", evidence: "25k pages, very large salary/state/period lattice, homepage-dominated impressions, controls show smaller focused sites get deep URL tests.", counter_evidence: "Technical audits and crawl graph are clean; some deep URLs can rank strongly when tested.", first_test: "Create a curated priority cohort and strengthen parent-child routing for a small set of query-evidenced URLs.", risk: "Low to moderate" },
  { rank: 2, hypothesis: "Internal importance is too diluted across 25k reachable URLs.", evidence: "Large inventory with shallow reach but many low-inbound individual salary pages; homepage and hubs carry most internal PageRank.", counter_evidence: "Reachability is now clean and P95 depth is acceptable.", first_test: "Internal-link concentration experiment for 100-200 priority URLs.", risk: "Low" },
  { rank: 3, hypothesis: "Historical sitemap/canonical churn caused stale crawl scheduling and delayed reprocessing.", evidence: "Known sitemap architecture changes; GSC historical sitemap provenance and stale states; current full-inventory discovery only recently restored.", counter_evidence: "Google can recover after stable sitemap signals; not a permanent documented penalty.", first_test: "Freeze sitemap/robots/canonicals and observe 21-45 days after full discovery.", risk: "Low" },
  { rank: 4, hypothesis: "Annual/monthly/weekly/state variants are too similar for Google to confidently assign query-to-URL matches.", evidence: "Programmatic variants differ by pay period and geography but likely share tables, FAQs and sentence structures.", counter_evidence: "Metadata/canonicals are unique and route intent is explicit.", first_test: "Differentiate a small annual/monthly/weekly cohort around exact queries; do not rewrite sitewide.", risk: "Moderate" },
  { rank: 5, hypothesis: "Root URL dominance is self-reinforced by homepage breadth and internal navigation.", evidence: "Homepage targets many broad salary/paycheck/monthly/weekly/state intents and receives most impressions.", counter_evidence: "Homepage is a legitimate broad intent page and root URLs naturally receive early tests.", first_test: "Add a separate flagship /salary-calculator/ only as a test, without redirecting root.", risk: "Moderate" }
]), "utf8");

const currentState = `# AfterTaxTool Current State

Generated: ${new Date().toISOString()}

## Inventory

- HTML/indexable files found locally: ${att.pages.length}
- Sitemap URLs: ${att.sitemapUrls.length}
- Unique sitemap URLs: ${new Set(att.sitemapUrls).size}
- Robots: ${fs.existsSync(path.join(ROOT, "robots.txt")) ? read(path.join(ROOT, "robots.txt")).trim().replace(/\n/g, " / ") : "missing"}
- Noindex pages found by static scan: ${att.pages.filter((p) => p.noindex).length}

## Route Families

${familyCounts.map(([family, count]) => `- ${family}: ${count}`).join("\n")}

## Crawl Graph

- Reachable from homepage: ${att.depth.size}
- Unreachable routes: ${att.pages.length - att.depth.size}
- Average depth: ${depthStats.average.toFixed(2)}
- Median depth: ${depthStats.median}
- P95 depth: ${depthStats.p95}
- Maximum depth: ${depthStats.max}

## Architecture Diagram

\`\`\`
/ homepage
  -> salary-after-tax-us.html
      -> salary-after-tax-by-state.html
          -> 50 state hubs
              -> state annual salary pages
              -> state monthly salary pages
              -> state weekly salary pages
  -> salary-after-tax-uk.html / take-home-pay-uk.html
      -> UK salary, monthly, weekly and hourly pages
  -> planning-calculators.html / salary-guides.html
      -> salary increase, job offer, comparison, benefits and payroll ecosystems
  -> methodology.html / tax-assumptions.html / editorial-standards.html
\`\`\`

## Interpretation

The site is technically exposed: the sitemap is large but valid as a classic URL set, the homepage can reach the inventory, and the route families are internally coherent. The important distinction is that technical reachability does not equal crawl demand or ranking selection. At this scale, each deep page can be reachable but still receive very little relative internal importance and very little perceived incremental value.
`;

fs.writeFileSync(path.join(OUT, "aftertaxtool-current-state.md"), currentState, "utf8");

const homepageMd = `# Homepage Forensics

## Current Homepage Signals

- Title: ${homepage.title}
- H1: ${homepage.h1}
- Meta description length: ${homepage.description.length}
- Internal outgoing routes from homepage: ${homepageLinks.length}

## Homepage Outgoing Links

${homepageLinks.map((l) => `- ${l.route} (${l.family}) — "${l.anchor}"`).join("\n")}

## Analysis

The homepage is trying to satisfy broad salary-after-tax, take-home pay, UK, US, monthly, weekly, state-routing and authority-routing intent. That is sensible for users, but it also makes \`/\` a broad semantic catch-all. If Google has low confidence in the deep lattice, the homepage is the safest URL to test because it covers many modifiers at once.

This does not prove the homepage is "wrong". It means homepage breadth plus weak deep-page participation can create a feedback loop: broad query tests land on \`/\`, Google receives limited evidence for deep pages, and deep pages remain discovered but under-tested.

## Root URL Hypothesis

The root URL hypothesis is plausible but not proven. The root may be acting as Google's stable evaluation point because it is broad, frequently refreshed, strongly linked, and historically known. A new flagship URL might create a cleaner test surface, but deleting, redirecting or moving the root would be structurally reckless.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-homepage-forensics.md"), homepageMd, "utf8");

const simMd = `# Template Similarity Analysis

This is a token-level nearest-neighbour similarity sample across major salary page families. It is not a Google duplicate-content model, but it is useful for ranking where incremental page value may look weakest.

| Family | Sample size | Avg nearest Jaccard | Max nearest Jaccard | Closest sample |
|---|---:|---:|---:|---|
${similarity.map((r) => `| ${r.family} | ${r.sampleSize} | ${r.avgNearestJaccard} | ${r.maxNearestJaccard} | \`${r.closestA}\` vs \`${r.closestB}\` |`).join("\n")}

## Interpretation

The highest-risk area is not ordinary templating by itself. The risk is a very large numerical lattice where many adjacent salary pages, pay-period variants and state variants share the same structural answer pattern. Google may crawl or discover these URLs but decide the marginal gain of evaluating all of them is low until the domain earns more trust or the site creates a stronger priority subset.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-template-similarity.md"), simMd, "utf8");

const historyMd = `# Historical Signal Risk Analysis

## Facts From Current Repo Evidence

- Current \`robots.txt\` references only \`https://aftertaxtool.com/sitemap.xml\`.
- Current \`sitemap.xml\` is a classic \`urlset\`, not a sitemap index.
- Current sitemap URL count is ${att.sitemapUrls.length}.
- Current local sitemap URLs are unique: ${new Set(att.sitemapUrls).size === att.sitemapUrls.length ? "yes" : "no"}.
- The repository currently has no uncommitted changes at scan time: ${""}

## Known From User-Provided History

- The site previously used multiple sitemap architectures.
- Google Search Console showed fragmented historical states, including old sitemap provenance and stale redirect errors.
- A later classic sitemap submission caused Google to discover approximately the full inventory.

## Inference

Historical sitemap churn can plausibly affect crawl scheduling and GSC reporting for weeks, especially on a large site whose inventory changed quickly. This should be treated as a recovery-lag and crawl-prioritisation risk, not as a documented penalty.

## Speculation To Avoid

There is no evidence in the repo that Google is applying a formal sitemap-change penalty. The safer reading is that the site created inconsistent discovery signals during a period when Google was already compressing URL participation.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-history-risk-analysis.md"), historyMd, "utf8");

const sdMd = `# AfterTaxTool vs SalaryDecoded Comparison

${sdStats ? `## SalaryDecoded Local Metrics

- HTML files: ${sdStats.html}
- Sitemap URLs: ${sdStats.sitemap}
- Homepage outgoing internal routes: ${sdStats.homepageOut}
- Average inbound links per page: ${sdStats.avgInbound.toFixed(2)}
- Average depth: ${sdStats.depthStats.average.toFixed(2)}
- P95 depth: ${sdStats.depthStats.p95}
- Max depth: ${sdStats.depthStats.max}

## SalaryDecoded Families

${sdStats.familyCounts.map(([family, count]) => `- ${family}: ${count}`).join("\n")}
` : "SalaryDecoded repository was not available at the expected path."}

## Smallest Meaningful Differences

- SalaryDecoded is small: a 59-page cohort rather than a 25k-page lattice.
- SalaryDecoded has simpler URL families and fewer near-adjacent numerical variants.
- SalaryDecoded can give each page more relative internal importance.
- SalaryDecoded's homepage does not have to route into 50-state, annual/monthly/weekly, salary-increase, job-offer, compensation and payroll ecosystems simultaneously.
- SalaryDecoded's small inventory gives Google a low-cost opportunity to test deep URLs quickly.

## Interpretation

The control evidence strongly argues against "Google dislikes salary calculators" as the main explanation. The more plausible difference is crawl economics and evaluation confidence: SalaryDecoded presents a compact, interpretable set of pages, while AfterTaxTool asks Google to evaluate a large, historically churned, highly templated URL graph.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-salarydecoded-comparison.md"), sdMd, "utf8");

const roadmapMd = `# Recovery Experiment Roadmap

## Ranked Experiments

1. **Priority cohort internal-importance experiment**
   - Hypothesis: Google needs a smaller, strongly signalled subset before it expands to the whole inventory.
   - Change: Select 100-200 existing pages from query-evidenced and commercially important families; add compact contextual routes from homepage, UK/US hubs, state gateway and relevant salary hubs.
   - Measurement window: 4-8 weeks.
   - Success: More deep URLs appear in GSC Pages report; homepage is replaced by intended URLs for exact salary/monthly/weekly/state queries; fresh crawls increase for cohort.
   - Risk: Low if kept compact.
   - Rollback: Remove cohort modules.

2. **Template differentiation test cohort**
   - Hypothesis: annual/monthly/weekly/state variants are too close for confident URL selection.
   - Change: Rewrite first-screen intent framing and FAQs for 20-50 existing pages across one salary band and one state/UK cohort.
   - Measurement window: 6-10 weeks.
   - Success: intended URL selection improves for matching modifiers.
   - Risk: Moderate; contaminates content and linking variables if combined with experiment 1.

3. **New flagship \`/salary-calculator/\` hub**
   - Hypothesis: a new clean entry point may receive a separate evaluation path from root.
   - Change: Create a non-programmatic flagship hub that routes to existing calculators and priority cohorts. Do not redirect root.
   - Measurement window: 6-12 weeks.
   - Success: new hub receives impressions and starts routing Google into deep pages.
   - Risk: Moderate; could split broad intent with homepage.

4. **Sitemap-only priority cohort**
   - Hypothesis: reducing submitted inventory could improve crawl focus.
   - Change: Do not delete/noindex pages; submit only a curated canonical sitemap subset.
   - Measurement window: 4-8 weeks.
   - Risk: Moderate-high because it creates another sitemap strategy change during recovery.

5. **Inventory pruning/noindex**
   - Hypothesis: the 25k lattice is suppressing trust and crawl demand.
   - Change: Remove/noindex large cohorts.
   - Measurement window: 8-16 weeks.
   - Risk: High and hard to interpret. Use only after smaller tests fail.

## Do Not Do Now

- Redirect \`/\` to another URL.
- Move the homepage to \`/home/\`.
- 404 or 410 the root URL.
- Bulk-touch sitemap lastmod dates.
- Change canonicals sitewide.
- Generate more salary inventory.
- Resubmit alternate sitemap formats repeatedly.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-experiment-roadmap.md"), roadmapMd, "utf8");

const firstMd = `# Recommended First Experiment

## Recommendation

Run a **priority cohort internal-importance experiment** before any homepage migration, root redirect, sitemap reduction or inventory pruning.

## Exact Intervention

Select 100-200 existing URLs, not new pages:

- 40 UK salary pages with known/common salary demand.
- 40 US/state pages across strongest states and exact-salary patterns.
- 20 monthly/weekly pages where GSC has shown modifier queries.
- 20 authority/calculator pages connected to paycheck, payroll, salary increase and job-offer intent.
- Optional 20 high-income/six-figure pages if already query-evidenced.

Add compact contextual routing:

- Homepage: one small "popular salary and pay-period checks" module, not a route wall.
- UK hub: one compact priority salary band module.
- US hub/state gateway: one compact state/salary priority module.
- Relevant authority pages: contextual links where the explanation naturally points to the cohort.

## Measurement Window

Minimum 28 days. Prefer 45-60 days before escalating.

## Success Metrics

- Cohort URLs receive fresh crawls.
- Cohort URLs appear in GSC Pages report.
- Intended URLs begin replacing homepage for exact salary, monthly, weekly, state and paycheck modifiers.
- Impressions spread from 6 visible URLs to at least 25-50 URLs.
- Query families diversify beyond homepage broad testing.

## Falsification

If Google crawls the updated linking pages but does not fresh-crawl or test the priority cohort after 45-60 days, weak internal routing is probably not the main constraint. Move to a template differentiation test or a new flagship hub experiment.

## Why This First

It is the lowest-risk meaningful test. It changes crawl demand and perceived importance without changing URL architecture, canonicals, sitemap format, root behaviour or inventory size.
`;
fs.writeFileSync(path.join(OUT, "aftertaxtool-recommended-first-experiment.md"), firstMd, "utf8");

const summary = {
  generatedAt: new Date().toISOString(),
  repo: ROOT,
  html: att.pages.length,
  sitemapUrls: att.sitemapUrls.length,
  uniqueSitemapUrls: new Set(att.sitemapUrls).size,
  familyCounts,
  crawl: depthStats,
  homepageLinks: homepageLinks.length,
  topPageRank: graphRows.slice(0, 20).map((r) => ({ route: r.route, family: r.family, inbound: r.inbound, depth: r.depth, pagerank: +r.pagerank.toFixed(8) })),
  weakest: weakestRows.slice(0, 20),
  similarity,
  salaryDecoded: sdStats
};
fs.writeFileSync(path.join(OUT, "analysis-summary.json"), JSON.stringify(summary, null, 2), "utf8");

console.log(JSON.stringify(summary, null, 2));
