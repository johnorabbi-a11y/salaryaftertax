const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = __dirname;
const SITE = "https://aftertaxtool.com";
const DATE = "2026-08-29";

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

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function routeToFile(route) {
  if (route === "/") return path.join(ROOT, "index.html");
  return path.join(ROOT, route.replace(/^\//, ""));
}

function exists(route) {
  return fs.existsSync(routeToFile(route));
}

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function linksFrom(html) {
  return [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => {
      let url;
      try {
        url = m[1].startsWith("http") ? new URL(m[1]) : new URL(m[1], SITE);
      } catch {
        return null;
      }
      if (url.hostname !== "aftertaxtool.com") return null;
      return { route: url.pathname === "/" ? "/" : url.pathname, anchor: stripHtml(m[2]) };
    })
    .filter(Boolean);
}

function routeForFile(file) {
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");
  return rel === "index.html" ? "/" : `/${rel}`;
}

function classify(route) {
  const name = route.slice(1);
  if (route === "/") return "homepage";
  if (/^\d+-salary-after-tax-uk\.html$/.test(name) || /^\d+-take-home-pay-uk\.html$/.test(name)) return "UK annual salary";
  if (/^\d+-after-tax-monthly\.html$/.test(name)) return "UK monthly salary";
  if (/^\d+-after-tax-weekly\.html$/.test(name)) return "UK weekly salary";
  if (/^\d+-salary-after-tax-us\.html$/.test(name)) return "US annual salary";
  if (/^\d+-after-tax-monthly-us\.html$/.test(name)) return "US monthly salary";
  if (/^\d+-after-tax-weekly-us\.html$/.test(name)) return "US weekly salary";
  if (/^\d+-salary-after-tax-[a-z-]+\.html$/.test(name)) return "state annual salary";
  if (/^\d+-after-tax-monthly-[a-z-]+\.html$/.test(name)) return "state monthly salary";
  if (/^\d+-after-tax-weekly-[a-z-]+\.html$/.test(name)) return "state weekly salary";
  if (/^salary-after-tax-[a-z-]+\.html$/.test(name)) return "state hub";
  if (/calculator|paycheck|payroll|increase|raise|job-offer|comparison|compare|benefit|compensation|deduction|bonus|pension|affordability/.test(name)) return "calculator/support";
  if (/methodology|tax-assumptions|gross-vs-net|explained|guide|state-tax|income-tax|salary-sacrifice|student-loan/.test(name)) return "authority/support";
  return "other";
}

function buildGraph() {
  const htmlFiles = walk(ROOT, (f) => f.endsWith(".html"));
  const routes = htmlFiles.map(routeForFile);
  const routeSet = new Set(routes);
  const outgoing = new Map();
  const incoming = new Map(routes.map((r) => [r, []]));
  for (const file of htmlFiles) {
    const route = routeForFile(file);
    const outs = [...new Set(linksFrom(read(file)).map((l) => l.route).filter((r) => routeSet.has(r)))];
    outgoing.set(route, outs);
    outs.forEach((to) => incoming.get(to).push(route));
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
  let pr = new Map(routes.map((r) => [r, 1 / routes.length]));
  const damping = 0.85;
  for (let i = 0; i < 25; i++) {
    const next = new Map(routes.map((r) => [r, (1 - damping) / routes.length]));
    for (const r of routes) {
      const outs = outgoing.get(r) || [];
      const share = pr.get(r) / Math.max(1, outs.length);
      if (!outs.length) routes.forEach((target) => next.set(target, next.get(target) + damping * share / routes.length));
      else outs.forEach((target) => next.set(target, next.get(target) + damping * share));
    }
    pr = next;
  }
  return { routes, outgoing, incoming, depth, pr };
}

function csv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

function addCandidate(list, route, tier, reason, linkSources, countryState = "", intent = "") {
  if (!exists(route)) return;
  if (list.some((item) => item.route === route)) return;
  list.push({
    route,
    url: `${SITE}${route}`,
    family: classify(route),
    countryState,
    intent,
    reason,
    proposedNewLinkSources: linkSources.join("; "),
    priorityTier: tier,
    historicalGscEvidence: "No URL-level GSC export used for this implementation; selected from forensic architecture, common-query demand and weak-link evidence."
  });
}

function cards(items) {
  return `<div class="link-grid">\n${items.map((i) => `        <a class="link-card" href="${i.href}"><strong>${i.label}</strong><span>${i.note}</span></a>`).join("\n")}\n      </div>`;
}

function chips(items) {
  return `<div class="link-chips">\n${items.map((i) => `        <a href="${i.href}">${i.label}</a>`).join("\n")}\n      </div>`;
}

function replaceMarked(file, start, end, block, before = "</main>") {
  const full = path.join(ROOT, file);
  let html = read(full);
  const pattern = new RegExp(`\\n?<!-- ${start} -->[\\s\\S]*?<!-- ${end} -->\\n?`, "m");
  if (pattern.test(html)) {
    html = html.replace(pattern, `\n<!-- ${start} -->\n${block}\n<!-- ${end} -->\n`);
  } else {
    html = html.replace(before, `<!-- ${start} -->\n${block}\n<!-- ${end} -->\n${before}`);
  }
  write(full, html);
}

function patchCurrency() {
  const file = path.join(ROOT, "salary-to-hourly.html");
  let html = read(file);
  html = html.replace(/\?\?(50,000|60,000|70,000)/g, "&pound;$1");
  html = html.replace(/([^?])\?(50,000|60,000|70,000)/g, "$1&pound;$2");
  write(file, html);
}

const before = buildGraph();
patchCurrency();

const cohort = [];
const commonUk = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 90000, 100000, 120000, 125000, 150000, 200000];
const commonUs = [30000, 40000, 50000, 60000, 70000, 75000, 80000, 90000, 100000, 120000, 125000, 150000, 175000, 200000, 250000];
const payPeriod = [40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000];
const states = ["california", "new-york", "texas", "florida", "illinois"];
const stateLabel = { california: "California", "new-york": "New York", texas: "Texas", florida: "Florida", illinois: "Illinois" };
const stateAmounts = [60000, 75000, 80000, 100000, 120000, 150000, 175000, 200000];

commonUk.forEach((s) => addCandidate(cohort, `/${s}-salary-after-tax-uk.html`, s >= 100000 ? "Tier 1" : "Tier 1", `Common UK exact salary demand around £${s.toLocaleString("en-GB")}.`, ["homepage", "salary-after-tax-uk.html"], "UK", "annual salary after tax"));
commonUs.forEach((s) => addCandidate(cohort, `/${s}-salary-after-tax-us.html`, "Tier 1", `Common US exact salary demand around $${s.toLocaleString("en-US")}.`, ["homepage", "salary-after-tax-us.html"], "US", "annual salary after tax"));
payPeriod.forEach((s) => {
  addCandidate(cohort, `/${s}-after-tax-monthly.html`, "Tier 2", `Distinct monthly take-home-pay modifier for £${s.toLocaleString("en-GB")}.`, ["homepage", "salary-after-tax-uk.html"], "UK", "monthly pay after tax");
  addCandidate(cohort, `/${s}-after-tax-weekly.html`, "Tier 2", `Distinct weekly take-home-pay modifier for £${s.toLocaleString("en-GB")}.`, ["homepage", "salary-after-tax-uk.html"], "UK", "weekly pay after tax");
  addCandidate(cohort, `/${s}-after-tax-monthly-us.html`, "Tier 2", `Distinct monthly take-home-pay modifier for $${s.toLocaleString("en-US")}.`, ["salary-after-tax-us.html"], "US", "monthly pay after tax");
  addCandidate(cohort, `/${s}-after-tax-weekly-us.html`, "Tier 2", `Distinct weekly take-home-pay modifier for $${s.toLocaleString("en-US")}.`, ["salary-after-tax-us.html"], "US", "weekly pay after tax");
});
states.forEach((state) => {
  stateAmounts.forEach((s) => {
    addCandidate(cohort, `/${s}-salary-after-tax-${state}.html`, s >= 100000 ? "Tier 2" : "Tier 3", `Representative ${stateLabel[state]} salary query with state-level tax/cost context.`, ["salary-after-tax-us.html", `salary-after-tax-${state}.html`], stateLabel[state], "state annual salary after tax");
    if ([100000, 200000].includes(s)) {
      addCandidate(cohort, `/${s}-after-tax-monthly-${state}.html`, "Tier 3", `Monthly ${stateLabel[state]} pay-period route for a priority state salary.`, [`salary-after-tax-${state}.html`], stateLabel[state], "state monthly salary after tax");
      addCandidate(cohort, `/${s}-after-tax-weekly-${state}.html`, "Tier 3", `Weekly ${stateLabel[state]} pay-period route for a priority state salary.`, [`salary-after-tax-${state}.html`], stateLabel[state], "state weekly salary after tax");
    }
  });
});
[
  "/salary-tax-calculator-uk.html",
  "/take-home-pay-uk.html",
  "/monthly-pay-after-tax-calculator.html",
  "/weekly-pay-after-tax-calculator.html",
  "/paycheck-deductions-calculator.html",
  "/payroll-deduction-calculator.html",
  "/salary-increase-calculator.html",
  "/raise-after-tax-calculator.html",
  "/job-offer-calculator.html",
  "/compare-salary-after-tax.html",
  "/six-figure-salary-after-tax.html",
  "/high-income-by-state.html",
  "/high-salary-budgeting.html",
  "/gross-vs-net-pay.html",
  "/how-take-home-pay-is-calculated.html",
  "/understanding-paycheck-deductions.html",
  "/federal-tax-withholding-explained.html",
  "/national-insurance-explained.html",
  "/student-loan-deductions-explained.html",
  "/salary-sacrifice-tax-explained.html"
].forEach((route) => addCandidate(cohort, route, "Tier 2", "High-value calculator or authority page connected to salary/take-home/payroll intent.", ["homepage", "salary-after-tax-uk.html", "salary-after-tax-us.html", "authority pages"], route.includes("us") || route.includes("federal") || route.includes("paycheck") ? "US/UK" : "UK/US", "calculator or authority"));

const cohortSet = new Set(cohort.map((c) => c.route));

const homepageSection = `<section class="feature-card priority-cohort-routes" id="popular-salary-calculations">
      <p class="eyebrow">Popular salary calculations</p>
      <h2>Start with the salary routes people check most often</h2>
      <p>Use these curated examples to move from the broad calculator into exact UK, US, monthly, weekly and state salary pages. This is a short starting set, not a full directory.</p>
      ${cards([
        { href: "/30000-salary-after-tax-uk.html", label: "£30,000 salary after tax UK", note: "Common UK benchmark for annual take-home pay." },
        { href: "/40000-salary-after-tax-uk.html", label: "£40,000 salary after tax UK", note: "Useful mid-salary UK estimate." },
        { href: "/50000-salary-after-tax-uk.html", label: "£50,000 salary after tax UK", note: "Popular UK salary and monthly planning point." },
        { href: "/60000-salary-after-tax-uk.html", label: "£60,000 salary after tax UK", note: "Higher-rate threshold context for UK pay." },
        { href: "/75000-salary-after-tax-uk.html", label: "£75,000 salary after tax UK", note: "Upper-middle UK salary checkpoint." },
        { href: "/100000-salary-after-tax-uk.html", label: "£100,000 salary after tax UK", note: "Six-figure UK take-home-pay route." },
        { href: "/125000-salary-after-tax-uk.html", label: "£125,000 salary after tax UK", note: "Personal-allowance taper context." },
        { href: "/150000-salary-after-tax-uk.html", label: "£150,000 salary after tax UK", note: "High-income UK salary route." },
        { href: "/50000-salary-after-tax-us.html", label: "$50,000 salary after tax US", note: "Common US salary benchmark." },
        { href: "/75000-salary-after-tax-us.html", label: "$75,000 salary after tax US", note: "Useful US job-offer comparison point." },
        { href: "/100000-salary-after-tax-us.html", label: "$100,000 salary after tax US", note: "Core US six-figure salary route." },
        { href: "/150000-salary-after-tax-us.html", label: "$150,000 salary after tax US", note: "Higher-income US salary estimate." },
        { href: "/200000-salary-after-tax-us.html", label: "$200,000 salary after tax US", note: "US high-income endpoint route." },
        { href: "/100000-salary-after-tax-california.html", label: "$100,000 salary in California", note: "State-specific tax and cost context." },
        { href: "/100000-salary-after-tax-new-york.html", label: "$100,000 salary in New York", note: "State-specific salary route." },
        { href: "/100000-salary-after-tax-texas.html", label: "$100,000 salary in Texas", note: "No broad state wage-income-tax context." },
        { href: "/100000-salary-after-tax-florida.html", label: "$100,000 salary in Florida", note: "State salary route with household-cost context." },
        { href: "/50000-after-tax-monthly.html", label: "£50,000 after tax monthly", note: "Monthly UK take-home-pay route." },
        { href: "/100000-after-tax-monthly.html", label: "£100,000 after tax monthly", note: "Six-figure monthly planning route." },
        { href: "/50000-after-tax-weekly.html", label: "£50,000 after tax weekly", note: "Weekly take-home-pay route." },
        { href: "/100000-after-tax-weekly.html", label: "£100,000 after tax weekly", note: "Weekly six-figure salary view." },
        { href: "/salary-tax-calculator-uk.html", label: "UK salary tax calculator", note: "PAYE, National Insurance and take-home pay." },
        { href: "/paycheck-deductions-calculator.html", label: "Paycheck deductions calculator", note: "Understand deductions behind net pay." },
        { href: "/salary-increase-calculator.html", label: "Salary increase calculator", note: "Estimate the value of a raise after tax." }
      ])}
    </section>`;

replaceMarked("index.html", "PRIORITY_COHORT_ROUTES_START", "PRIORITY_COHORT_ROUTES_END", homepageSection, '<section class="feature-card" id="popular-examples">');
// Remove the older broader popular-examples block if the new priority block was inserted before it.
{
  const file = path.join(ROOT, "index.html");
  let html = read(file);
  html = html.replace(/\n\s*<section class="feature-card" id="popular-examples">[\s\S]*?<\/section>\s*\n/, "\n");
  write(file, html);
}

const ukSection = `<section class="feature-card priority-cohort-routes" id="priority-uk-salary-routes">
  <h2>Popular UK salary checkpoints</h2>
  <p>These exact salary routes cover common UK take-home-pay questions and help connect broad salary planning with annual, monthly and weekly examples.</p>
  ${chips([20000,25000,30000,35000,40000,45000,50000,55000,60000,65000,70000,75000,80000,90000,100000,120000,125000,150000,200000].map((s) => ({ href: `/${s}-salary-after-tax-uk.html`, label: `£${s.toLocaleString("en-GB")} after tax` })))}
  <h3>Monthly and weekly pay routes</h3>
  ${chips([40000,50000,60000,70000,80000,100000,150000,200000].flatMap((s) => [
    { href: `/${s}-after-tax-monthly.html`, label: `£${s.toLocaleString("en-GB")} monthly` },
    { href: `/${s}-after-tax-weekly.html`, label: `£${s.toLocaleString("en-GB")} weekly` }
  ]))}
</section>`;
replaceMarked("salary-after-tax-uk.html", "PRIORITY_COHORT_UK_START", "PRIORITY_COHORT_UK_END", ukSection);

const usSection = `<section class="card priority-cohort-routes" id="priority-us-salary-routes">
  <h2>Popular US salary checkpoints</h2>
  <p>These routes give users a cleaner path into common US salary, monthly, weekly and state-specific take-home-pay examples.</p>
  ${chips([30000,40000,50000,60000,70000,75000,80000,90000,100000,120000,125000,150000,175000,200000,250000].map((s) => ({ href: `/${s}-salary-after-tax-us.html`, label: `$${s.toLocaleString("en-US")} after tax US` })))}
  <h3>Monthly and weekly US routes</h3>
  ${chips([50000,60000,75000,100000,120000,150000,200000].flatMap((s) => [
    { href: `/${s}-after-tax-monthly-us.html`, label: `$${s.toLocaleString("en-US")} monthly` },
    { href: `/${s}-after-tax-weekly-us.html`, label: `$${s.toLocaleString("en-US")} weekly` }
  ]))}
  <h3>Priority state examples</h3>
  ${chips(["california","new-york","texas","florida","illinois"].flatMap((state) => [100000,150000,200000].map((s) => ({ href: `/${s}-salary-after-tax-${state}.html`, label: `$${s.toLocaleString("en-US")} in ${stateLabel[state]}` }))))}
</section>`;
replaceMarked("salary-after-tax-us.html", "PRIORITY_COHORT_US_START", "PRIORITY_COHORT_US_END", usSection);

states.forEach((state) => {
  const section = `<section class="feature-card priority-cohort-routes" id="priority-${state}-salary-routes">
<h2>Priority ${stateLabel[state]} salary checkpoints</h2>
<p>These selected ${stateLabel[state]} routes connect the state hub to common salary decisions without turning the page into a full salary directory.</p>
${cards([60000,75000,80000,100000,120000,150000,175000,200000].map((s) => ({ href: `/${s}-salary-after-tax-${state}.html`, label: `$${s.toLocaleString("en-US")} in ${stateLabel[state]}`, note: "Annual state salary route with monthly and weekly onward links." })))}
${chips([100000,200000].flatMap((s) => [
  { href: `/${s}-after-tax-monthly-${state}.html`, label: `$${s.toLocaleString("en-US")} monthly in ${stateLabel[state]}` },
  { href: `/${s}-after-tax-weekly-${state}.html`, label: `$${s.toLocaleString("en-US")} weekly in ${stateLabel[state]}` }
]))}
</section>`;
  replaceMarked(`salary-after-tax-${state}.html`, `PRIORITY_COHORT_${state.toUpperCase().replace(/-/g, "_")}_START`, `PRIORITY_COHORT_${state.toUpperCase().replace(/-/g, "_")}_END`, section);
});

const authoritySections = {
  "gross-vs-net-pay.html": `<section class="feature-card priority-cohort-routes" id="gross-net-examples">
  <h2>Salary examples for gross-to-net pay</h2>
  <p>Examples make the gross-to-net difference easier to judge. Start with common UK and US salaries, then compare monthly and weekly views where cash-flow timing matters.</p>
  ${chips([
    { href: "/50000-salary-after-tax-uk.html", label: "£50,000 salary after tax UK" },
    { href: "/100000-salary-after-tax-uk.html", label: "£100,000 salary after tax UK" },
    { href: "/50000-salary-after-tax-us.html", label: "$50,000 salary after tax US" },
    { href: "/100000-salary-after-tax-us.html", label: "$100,000 salary after tax US" },
    { href: "/50000-after-tax-monthly.html", label: "£50,000 monthly after tax" },
    { href: "/50000-after-tax-weekly.html", label: "£50,000 weekly after tax" }
  ])}
</section>`,
  "us-state-tax-explained.html": `<section class="feature-card priority-cohort-routes" id="state-tax-examples">
  <h2>State salary examples to compare</h2>
  <p>State tax is easiest to understand when identical salaries are compared across major state examples.</p>
  ${chips(["california","new-york","texas","florida","illinois"].flatMap((state) => [
    { href: `/100000-salary-after-tax-${state}.html`, label: `$100,000 in ${stateLabel[state]}` },
    { href: `/200000-salary-after-tax-${state}.html`, label: `$200,000 in ${stateLabel[state]}` }
  ]))}
</section>`,
  "six-figure-salary-after-tax.html": `<section class="feature-card priority-cohort-routes" id="six-figure-examples">
  <h2>Six-figure salary checkpoints</h2>
  <p>Use these examples to compare the practical effect of six-figure salaries across UK, US and selected state routes.</p>
  ${chips([
    { href: "/100000-salary-after-tax-uk.html", label: "£100,000 after tax UK" },
    { href: "/120000-salary-after-tax-uk.html", label: "£120,000 after tax UK" },
    { href: "/150000-salary-after-tax-uk.html", label: "£150,000 after tax UK" },
    { href: "/100000-salary-after-tax-us.html", label: "$100,000 after tax US" },
    { href: "/120000-salary-after-tax-us.html", label: "$120,000 after tax US" },
    { href: "/150000-salary-after-tax-us.html", label: "$150,000 after tax US" }
  ])}
</section>`,
  "high-income-by-state.html": `<section class="feature-card priority-cohort-routes" id="high-income-state-examples">
  <h2>High-income state examples</h2>
  <p>Compare selected high-income state pages where federal, FICA, state tax and household-cost pressure can produce different net-pay outcomes.</p>
  ${chips(["california","new-york","texas","florida","illinois"].flatMap((state) => [
    { href: `/150000-salary-after-tax-${state}.html`, label: `$150,000 in ${stateLabel[state]}` },
    { href: `/200000-salary-after-tax-${state}.html`, label: `$200,000 in ${stateLabel[state]}` }
  ]))}
</section>`,
  "high-salary-budgeting.html": `<section class="feature-card priority-cohort-routes" id="high-salary-budget-examples">
  <h2>High-salary budgeting examples</h2>
  <p>Higher gross pay is still a budgeting question. These examples connect high salary estimates with monthly and weekly planning routes.</p>
  ${chips([
    { href: "/100000-after-tax-monthly.html", label: "£100,000 monthly after tax" },
    { href: "/150000-after-tax-monthly.html", label: "£150,000 monthly after tax" },
    { href: "/200000-after-tax-monthly.html", label: "£200,000 monthly after tax" },
    { href: "/100000-after-tax-monthly-us.html", label: "$100,000 monthly after tax US" },
    { href: "/150000-after-tax-monthly-us.html", label: "$150,000 monthly after tax US" },
    { href: "/200000-after-tax-monthly-us.html", label: "$200,000 monthly after tax US" }
  ])}
</section>`,
  "how-take-home-pay-is-calculated.html": `<section class="feature-card priority-cohort-routes" id="take-home-calculation-examples">
  <h2>Worked salary routes</h2>
  <p>These example routes show how salary, deductions and pay frequency turn into practical take-home-pay estimates.</p>
  ${chips([
    { href: "/40000-salary-after-tax-uk.html", label: "£40,000 after tax UK" },
    { href: "/60000-salary-after-tax-uk.html", label: "£60,000 after tax UK" },
    { href: "/100000-salary-after-tax-uk.html", label: "£100,000 after tax UK" },
    { href: "/60000-salary-after-tax-us.html", label: "$60,000 after tax US" },
    { href: "/100000-salary-after-tax-us.html", label: "$100,000 after tax US" }
  ])}
</section>`
};
Object.entries(authoritySections).forEach(([file, section]) => {
  if (fs.existsSync(path.join(ROOT, file))) replaceMarked(file, "PRIORITY_COHORT_CONTEXT_START", "PRIORITY_COHORT_CONTEXT_END", section);
});

const siblingGroups = {
  "50000-salary-after-tax-uk.html": [40000, 50000, 60000, 75000],
  "75000-salary-after-tax-uk.html": [60000, 70000, 75000, 80000, 90000],
  "100000-salary-after-tax-uk.html": [90000, 100000, 120000, 125000],
  "150000-salary-after-tax-uk.html": [120000, 150000, 200000],
  "200000-salary-after-tax-uk.html": [150000, 200000],
  "50000-salary-after-tax-us.html": [40000, 50000, 60000, 75000],
  "100000-salary-after-tax-us.html": [90000, 100000, 120000, 125000],
  "150000-salary-after-tax-us.html": [120000, 150000, 175000, 200000],
  "200000-salary-after-tax-us.html": [150000, 175000, 200000, 250000]
};
Object.entries(siblingGroups).forEach(([file, amounts]) => {
  const isUk = file.includes("-uk");
  const section = `<section class="feature-card priority-cohort-routes" id="nearby-priority-salaries">
  <h2>Nearby priority salary checks</h2>
  <p>Compare this salary with nearby common checkpoints before moving into monthly or weekly planning.</p>
  ${chips(amounts.map((s) => ({ href: `/${s}-salary-after-tax-${isUk ? "uk" : "us"}.html`, label: `${isUk ? "£" : "$"}${s.toLocaleString(isUk ? "en-GB" : "en-US")} after tax ${isUk ? "UK" : "US"}` })))}
</section>`;
  if (fs.existsSync(path.join(ROOT, file))) replaceMarked(file, "PRIORITY_COHORT_SIBLINGS_START", "PRIORITY_COHORT_SIBLINGS_END", section);
});

["california","new-york","texas","florida"].forEach((state) => {
  [100000, 200000].forEach((amount) => {
    const file = `${amount}-salary-after-tax-${state}.html`;
    const section = `<section class="feature-card priority-cohort-routes" id="priority-state-sibling-routes">
  <h2>Related ${stateLabel[state]} salary routes</h2>
  <p>Use the annual page for the headline salary, then compare monthly and weekly take-home pay for cash-flow planning.</p>
  ${chips([
    { href: `/${amount}-after-tax-monthly-${state}.html`, label: `$${amount.toLocaleString("en-US")} monthly in ${stateLabel[state]}` },
    { href: `/${amount}-after-tax-weekly-${state}.html`, label: `$${amount.toLocaleString("en-US")} weekly in ${stateLabel[state]}` },
    { href: `/salary-after-tax-${state}.html`, label: `${stateLabel[state]} salary hub` },
    { href: "/salary-after-tax-by-state.html", label: "Compare salary after tax by state" }
  ])}
</section>`;
    if (fs.existsSync(path.join(ROOT, file))) replaceMarked(file, "PRIORITY_COHORT_SIBLINGS_START", "PRIORITY_COHORT_SIBLINGS_END", section);
  });
});

const after = buildGraph();
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
const impact = cohort.map((c) => {
  const inboundBefore = before.incoming.get(c.route)?.length ?? 0;
  const inboundAfter = after.incoming.get(c.route)?.length ?? 0;
  const prBefore = before.pr.get(c.route) ?? 0;
  const prAfter = after.pr.get(c.route) ?? 0;
  return {
    URL: c.url,
    "inbound links before": inboundBefore,
    "inbound links after": inboundAfter,
    change: inboundAfter - inboundBefore,
    "depth before": before.depth.get(c.route) ?? "",
    "depth after": after.depth.get(c.route) ?? "",
    "internal PageRank-style metric before": prBefore,
    "internal PageRank-style metric after": prAfter,
    "PageRank-style change": prAfter - prBefore,
    Tier: c.priorityTier
  };
});

const control = [];
[61000, 62000, 63000, 64000, 66000, 67000, 68000, 69000, 71000, 72000, 73000, 74000, 76000, 77000, 78000, 79000, 81000, 82000, 83000, 84000].forEach((s) => {
  [`/${s}-salary-after-tax-uk.html`, `/${s}-after-tax-monthly.html`, `/${s}-after-tax-weekly.html`].forEach((route) => {
    if (exists(route) && !cohortSet.has(route) && control.length < 50) control.push(route);
  });
});
["ohio", "north-carolina", "virginia", "arizona", "colorado"].forEach((state) => {
  [61000, 62000, 83000, 84000, 130000, 131000].forEach((s) => {
    [`/${s}-salary-after-tax-${state}.html`, `/${s}-after-tax-monthly-${state}.html`, `/${s}-after-tax-weekly-${state}.html`].forEach((route) => {
      if (exists(route) && !cohortSet.has(route) && control.length < 50) control.push(route);
    });
  });
});

const manifest = cohort.map((c) => ({
  URL: c.url,
  family: c.family,
  "country/state": c.countryState,
  "salary/pay intent": c.intent,
  "existing inbound link count": before.incoming.get(c.route)?.length ?? 0,
  "existing crawl depth": before.depth.get(c.route) ?? "",
  "reason selected": c.reason,
  "historical GSC evidence": c.historicalGscEvidence,
  "proposed new link sources": c.proposedNewLinkSources,
  "priority tier": c.priorityTier
}));
write(path.join(OUT, "aftertaxtool-priority-cohort.csv"), csv(manifest));
write(path.join(OUT, "aftertaxtool-control-group.csv"), csv(control.map((route) => ({
  URL: `${SITE}${route}`,
  family: classify(route),
  "salary/state type": classify(route),
  "current inbound links": before.incoming.get(route)?.length ?? 0,
  "crawl depth": before.depth.get(route) ?? ""
}))));
write(path.join(OUT, "aftertaxtool-priority-link-impact.csv"), csv(impact));

const tierSummary = ["Tier 1", "Tier 2", "Tier 3"].map((tier) => {
  const rows = impact.filter((r) => r.Tier === tier);
  return {
    tier,
    count: rows.length,
    avgInboundBefore: avg(rows.map((r) => Number(r["inbound links before"]))).toFixed(2),
    avgInboundAfter: avg(rows.map((r) => Number(r["inbound links after"]))).toFixed(2),
    avgPrBefore: avg(rows.map((r) => Number(r["internal PageRank-style metric before"]))).toExponential(6),
    avgPrAfter: avg(rows.map((r) => Number(r["internal PageRank-style metric after"]))).toExponential(6),
    avgDepthBefore: avg(rows.map((r) => Number(r["depth before"] || 0))).toFixed(2),
    avgDepthAfter: avg(rows.map((r) => Number(r["depth after"] || 0))).toFixed(2)
  };
});

const cohortInboundBefore = avg(impact.map((r) => Number(r["inbound links before"])));
const cohortInboundAfter = avg(impact.map((r) => Number(r["inbound links after"])));
const nonCohortRoutes = after.routes.filter((r) => !cohortSet.has(r) && !["/", "/google045f4d6b341942cf.html", "/hourly-to-salary-UK-Us.html"].includes(r));
const nonCohortAvgInbound = avg(nonCohortRoutes.map((r) => after.incoming.get(r)?.length ?? 0));
const newLinks = impact.reduce((sum, r) => sum + Number(r.change), 0);
const depthValues = [...after.depth.values()].sort((a, b) => a - b);
const p95 = depthValues[Math.floor((depthValues.length - 1) * 0.95)] ?? 0;

const experimentMd = `# AfterTaxTool Priority Cohort Recovery Experiment

Implementation date: ${DATE}

## Cohort

- Exact cohort size: ${cohort.length}
- Tier 1 count: ${cohort.filter((c) => c.priorityTier === "Tier 1").length}
- Tier 2 count: ${cohort.filter((c) => c.priorityTier === "Tier 2").length}
- Tier 3 count: ${cohort.filter((c) => c.priorityTier === "Tier 3").length}
- Control group size: ${control.length}

## Link Additions

- Homepage deep links in priority section: 24
- UK hub priority route links: 35
- US hub priority route links: 44
- State hub priority route links: 60 across California, New York, Texas, Florida and Illinois
- Authority contextual links: 43 across six support/authority pages
- Sibling navigation pages patched: 17
- Total cohort inbound-link uplift: ${newLinks}

## Link Metrics

- Average cohort inbound links before: ${cohortInboundBefore.toFixed(2)}
- Average cohort inbound links after: ${cohortInboundAfter.toFixed(2)}
- Average non-cohort inbound links after: ${nonCohortAvgInbound.toFixed(2)}
- P95 crawl depth after: ${p95}

## Tier Summary

| Tier | Count | Avg inbound before | Avg inbound after | Avg PageRank before | Avg PageRank after | Avg depth before | Avg depth after |
|---|---:|---:|---:|---:|---:|---:|---:|
${tierSummary.map((r) => `| ${r.tier} | ${r.count} | ${r.avgInboundBefore} | ${r.avgInboundAfter} | ${r.avgPrBefore} | ${r.avgPrAfter} | ${r.avgDepthBefore} | ${r.avgDepthAfter} |`).join("\n")}

## Checkpoints

- Day 0: record GSC baseline for cohort and control URLs.
- Day 7: check fresh Googlebot crawling of cohort URLs.
- Day 14: compare cohort vs control URL Inspection samples.
- Day 28: review GSC Pages report for new cohort URL participation.
- Day 45: decide whether to continue observing, run template differentiation, or test a new flagship hub.

## Primary early measurement

Fresh Googlebot crawling of cohort URLs.

## Secondary measurements

- Indexed cohort URL count.
- Cohort URLs appearing in GSC Pages report.
- Deep URL impressions.
- Query-to-correct-page matching.
- Cohort participation compared with untouched control URLs.
`;
write(path.join(OUT, "aftertaxtool-priority-cohort-experiment.md"), experimentMd);

console.log(JSON.stringify({
  cohortSize: cohort.length,
  controlSize: control.length,
  tierSummary,
  cohortInboundBefore: +cohortInboundBefore.toFixed(2),
  cohortInboundAfter: +cohortInboundAfter.toFixed(2),
  nonCohortAvgInbound: +nonCohortAvgInbound.toFixed(2),
  newCohortInboundLinks: newLinks,
  p95DepthAfter: p95
}, null, 2));
