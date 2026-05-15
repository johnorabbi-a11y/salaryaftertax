const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "elite-five-pages");
fs.mkdirSync(outDir, { recursive: true });

function pounds(value) {
  return "&pound;" + Math.round(value).toLocaleString("en-GB");
}

function calc(salary) {
  const allowance = Math.max(0, 12570 - Math.max(0, salary - 100000) / 2);
  const taxable = Math.max(0, salary - allowance);
  const basic = Math.min(taxable, Math.max(0, 50270 - allowance));
  const higher = Math.min(Math.max(0, taxable - basic), 125140 - 50270);
  const additional = Math.max(0, taxable - basic - higher);
  const incomeTax = basic * 0.2 + higher * 0.4 + additional * 0.45;
  const ni = Math.min(Math.max(0, salary - 12570), 50270 - 12570) * 0.08 + Math.max(0, salary - 50270) * 0.02;
  const deductions = incomeTax + ni;
  const net = salary - deductions;
  return {
    salary,
    incomeTax,
    ni,
    deductions,
    netYear: net,
    grossMonth: salary / 12,
    grossWeek: salary / 52,
    netMonth: net / 12,
    netWeek: net / 52,
  };
}

const c = calc(35000);
const n34000 = calc(34000);
const n36000 = calc(36000);
const n30000 = calc(30000);
const n32000 = calc(32000);
const n40000 = calc(40000);

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>&pound;35,000 After Tax Weekly UK - Weekly Take-Home Pay</title>
<meta name="description" content="See &pound;35,000 after tax per week in the UK, with weekly take-home pay, tax deductions, monthly context, budget examples, salary comparisons and FAQs.">
<link rel="canonical" href="https://aftertaxtool.com/35000-after-tax-weekly.html">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#2563eb">
<style>
:root{--bg:#f6f8fb;--card:#ffffff;--text:#111827;--muted:#6b7280;--border:#e5e7eb;--primary:#2563eb;--primary-dark:#1d4ed8;--soft:#eff6ff}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
a{color:var(--primary);text-decoration:none}a:hover{text-decoration:underline}
.container{max-width:1120px;margin:0 auto;padding:24px}
.card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:26px;margin:22px 0;box-shadow:0 8px 24px rgba(15,23,42,.06)}
.breadcrumbs{font-size:.92rem;color:var(--muted);margin-bottom:16px}
.badge{display:inline-block;background:var(--soft);color:var(--primary-dark);padding:6px 10px;border-radius:999px;font-weight:700;font-size:.85rem;margin-bottom:12px}
h1{font-size:clamp(2rem,4vw,3.2rem);line-height:1.12;margin:0 0 16px}
h2{font-size:1.65rem;margin:0 0 14px}
h3{font-size:1.18rem;margin:20px 0 8px}
.lead{font-size:1.08rem;color:#374151}
.answer-box{background:linear-gradient(135deg,#eff6ff,#fff);border:1px solid #bfdbfe;border-radius:18px;padding:24px;margin-top:24px}
.answer-figure{font-size:2.3rem;font-weight:800;color:var(--primary-dark);margin:10px 0}
.grid{display:grid;gap:18px}.grid-4{grid-template-columns:repeat(4,1fr)}.grid-3{grid-template-columns:repeat(3,1fr)}
.stat{background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px}.stat span{display:block;color:var(--muted);font-size:.9rem}.stat strong{display:block;font-size:1.35rem;margin-top:6px}
.notice{background:#f8fafc;border-left:5px solid var(--primary);padding:18px;border-radius:12px}
.ad-slot{border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;text-align:center;padding:24px;border-radius:14px;margin:26px 0;font-size:.9rem}
table{width:100%;border-collapse:collapse;margin-top:14px;background:#fff;overflow:hidden;border-radius:14px}
th,td{border:1px solid var(--border);padding:13px;text-align:left;vertical-align:top}th{background:#f1f5f9}
.link-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.link-grid a{display:block;background:#f8fafc;border:1px solid var(--border);padding:13px;border-radius:12px}
footer{color:#6b7280;font-size:.9rem;padding:30px 0}
@media(max-width:850px){.grid-4,.grid-3,.link-grid{grid-template-columns:1fr}.container{padding:16px}}
</style>
</head>
<body>
<main class="container">
<section class="card">
  <nav class="breadcrumbs"><a href="/">Home</a> &rsaquo; <a href="/salary-after-tax-uk.html">UK salary after tax</a> &rsaquo; &pound;35,000 after tax weekly</nav>
  <span class="badge">UK weekly take-home pay guide</span>
  <h1>&pound;35,000 After Tax Weekly UK</h1>
  <p class="lead">A &pound;35,000 salary works out at about <strong>${pounds(c.netWeek)} per week after tax</strong> in the UK. That weekly figure is often easier to use than the annual salary when you are checking food costs, transport, savings, debt payments or how much room is left between payslips.</p>
  <p>The gross weekly salary is around ${pounds(c.grossWeek)} before deductions. After estimated income tax and National Insurance, the weekly take-home pay is lower, because PAYE deductions are taken before money reaches your bank account.</p>
  <p>Weekly take-home pages are useful when a job advert lists annual pay but your real budgeting happens week by week. On &pound;35k, the weekly amount can support a stable routine for many people, but rent, commuting, debt and pension contributions still decide how comfortable the month feels overall.</p>
  <p>This page keeps the focus on the weekly version of &pound;35,000: weekly net pay, weekly deductions, monthly context, practical budget pressure points, nearby weekly comparisons and links back to the annual and monthly breakdowns.</p>
  <div class="answer-box">
    <h2>Direct answer: &pound;35,000 after tax per week</h2>
    <p>Estimated weekly take-home pay from a &pound;35,000 UK salary is:</p>
    <div class="answer-figure">${pounds(c.netWeek)} per week after tax</div>
    <div class="grid grid-3">
      <div class="stat"><span>Gross weekly pay</span><strong>${pounds(c.grossWeek)}</strong></div>
      <div class="stat"><span>Estimated weekly deductions</span><strong>${pounds(c.deductions / 52)}</strong></div>
      <div class="stat"><span>Estimated weekly take-home</span><strong>${pounds(c.netWeek)}</strong></div>
    </div>
  </div>
</section>

<section class="card">
  <h2>Related &pound;35,000 breakdowns</h2>
  <p>For the full annual salary view, go back to <a href="/35000-salary-after-tax-uk.html">&pound;35,000 salary after tax UK</a>. If you prefer bills and rent planning by month, use <a href="/35000-after-tax-monthly.html">&pound;35,000 after tax monthly</a>.</p>
</section>

<div class="ad-slot">Advertisement</div>

<section class="card">
  <h2>Weekly, monthly and yearly breakdown</h2>
  <table>
    <thead><tr><th>Pay period</th><th>Gross pay</th><th>Estimated deductions</th><th>Estimated take-home pay</th></tr></thead>
    <tbody>
      <tr><td>Weekly</td><td>${pounds(c.grossWeek)}</td><td>${pounds(c.deductions / 52)}</td><td><strong>${pounds(c.netWeek)}</strong></td></tr>
      <tr><td>Monthly</td><td>${pounds(c.grossMonth)}</td><td>${pounds(c.deductions / 12)}</td><td><strong>${pounds(c.netMonth)}</strong></td></tr>
      <tr><td>Yearly</td><td>${pounds(c.salary)}</td><td>${pounds(c.deductions)}</td><td><strong>${pounds(c.netYear)}</strong></td></tr>
    </tbody>
  </table>
  <p>The weekly number is an equivalent based on annual salary. If you are paid monthly, your payslip will usually arrive as one monthly amount, but the weekly figure is still useful for comparing jobs and setting short-term spending limits.</p>
</section>

<section class="card">
  <h2>Estimated weekly deductions on &pound;35,000</h2>
  <table>
    <thead><tr><th>Deduction</th><th>Yearly estimate</th><th>Weekly estimate</th><th>What it means</th></tr></thead>
    <tbody>
      <tr><td>Income tax</td><td>${pounds(c.incomeTax)}</td><td>${pounds(c.incomeTax / 52)}</td><td>PAYE tax on earnings above the personal allowance.</td></tr>
      <tr><td>National Insurance</td><td>${pounds(c.ni)}</td><td>${pounds(c.ni / 52)}</td><td>Employee NI deducted through payroll.</td></tr>
      <tr><td>Total deductions</td><td><strong>${pounds(c.deductions)}</strong></td><td><strong>${pounds(c.deductions / 52)}</strong></td><td>The estimated difference between gross weekly pay and weekly take-home pay.</td></tr>
    </tbody>
  </table>
  <div class="notice"><strong>Important:</strong> pension contributions, student loan repayments, salary sacrifice, taxable benefits and tax code changes can reduce your actual weekly equivalent.</div>
</section>

<section class="card">
  <h2>What &pound;35,000 feels like by week</h2>
  <p>At about ${pounds(c.netWeek)} per week after tax, &pound;35k can feel steady if the big monthly commitments are under control. The weekly figure gives a clearer sense of what is available for food, travel, small bills and discretionary spending once rent or mortgage costs have been accounted for.</p>
  <p>The salary is more comfortable than &pound;30k, but it still benefits from a clear weekly rhythm. If debt repayments, commuting or rent are high, the weekly surplus can shrink quickly even when the annual salary looks solid.</p>
  <table>
    <thead><tr><th>Weekly situation</th><th>How it may feel</th></tr></thead>
    <tbody>
      <tr><td>Low rent or shared housing</td><td>More room for savings, food, travel and normal spending.</td></tr>
      <tr><td>High rent or solo household</td><td>The weekly amount can feel tighter once monthly bills are allocated.</td></tr>
      <tr><td>Regular commuting costs</td><td>Transport can take a noticeable share of weekly flexibility.</td></tr>
      <tr><td>Debt or childcare costs</td><td>Needs closer planning so weekly spending does not drift.</td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>Weekly budget context on &pound;35,000 after tax</h2>
  <p>This is not a rule for every household, but it shows how a weekly equivalent can be divided when you are trying to keep spending realistic.</p>
  <table>
    <thead><tr><th>Category</th><th>Example weekly amount</th><th>Comment</th></tr></thead>
    <tbody>
      <tr><td>Food and household</td><td>${pounds(65)}-${pounds(115)}</td><td>Usually one of the most visible weekly costs.</td></tr>
      <tr><td>Transport</td><td>${pounds(35)}-${pounds(95)}</td><td>Public transport, fuel, parking or commuting costs.</td></tr>
      <tr><td>Bills set aside weekly</td><td>${pounds(75)}-${pounds(120)}</td><td>A weekly share of council tax, utilities, broadband and mobile.</td></tr>
      <tr><td>Savings or debt repayment</td><td>${pounds(35)}-${pounds(90)}</td><td>More realistic when rent and commuting are controlled.</td></tr>
      <tr><td>Flexible spending</td><td>${pounds(45)}-${pounds(110)}</td><td>Clothes, subscriptions, social plans, hobbies and small surprises.</td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>&pound;35,000 weekly compared with nearby salaries</h2>
  <table>
    <thead><tr><th>Salary page</th><th>Estimated weekly take-home</th><th>Difference vs &pound;35,000</th><th>Why it matters</th></tr></thead>
    <tbody>
      <tr><td><a href="/34000-after-tax-weekly.html">&pound;34,000 after tax weekly</a></td><td>About ${pounds(n34000.netWeek)}</td><td>${pounds(c.netWeek - n34000.netWeek)} less/week</td><td>A small weekly gap, but it adds up across the year.</td></tr>
      <tr><td><strong>&pound;35,000 after tax weekly</strong></td><td><strong>About ${pounds(c.netWeek)}</strong></td><td>Baseline</td><td>A useful middle point for comparing weekly take-home pay.</td></tr>
      <tr><td><a href="/36000-after-tax-weekly.html">&pound;36,000 after tax weekly</a></td><td>About ${pounds(n36000.netWeek)}</td><td>${pounds(n36000.netWeek - c.netWeek)} more/week</td><td>Extra flexibility for bills, saving or debt reduction.</td></tr>
      <tr><td><a href="/30000-salary-after-tax-uk.html">&pound;30,000 salary after tax</a></td><td>About ${pounds(n30000.netWeek)}</td><td>${pounds(c.netWeek - n30000.netWeek)} less/week</td><td>Shows the weekly value of moving from &pound;30k to &pound;35k.</td></tr>
      <tr><td><a href="/40000-salary-after-tax-uk.html">&pound;40,000 salary after tax</a></td><td>About ${pounds(n40000.netWeek)}</td><td>${pounds(n40000.netWeek - c.netWeek)} more/week</td><td>A larger step up in weekly breathing room.</td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>Nearby weekly salary links</h2>
  <div class="link-grid">
    <a href="/34000-after-tax-weekly.html">&pound;34,000 after tax weekly</a>
    <a href="/36000-after-tax-weekly.html">&pound;36,000 after tax weekly</a>
    <a href="/35000-salary-after-tax-uk.html">&pound;35,000 salary after tax UK</a>
    <a href="/35000-after-tax-monthly.html">&pound;35,000 after tax monthly</a>
    <a href="/32000-salary-after-tax-uk.html">&pound;32,000 salary after tax UK</a>
    <a href="/40000-salary-after-tax-uk.html">&pound;40,000 salary after tax UK</a>
  </div>
</section>

<div class="ad-slot">Advertisement</div>

<section class="card">
  <h2>FAQ: &pound;35,000 after tax weekly</h2>
  <h3>How much is &pound;35,000 after tax per week?</h3>
  <p>A &pound;35,000 salary is approximately <strong>${pounds(c.netWeek)} per week after tax</strong>, using baseline UK income tax and National Insurance assumptions.</p>
  <h3>Is &pound;35,000 paid weekly or monthly?</h3>
  <p>Many salaried UK roles are paid monthly, but the weekly figure is a useful equivalent. If you are paid monthly, the estimated monthly take-home is about <strong>${pounds(c.netMonth)}</strong>.</p>
  <h3>How much tax is taken each week from &pound;35,000?</h3>
  <p>The estimated weekly deduction is about <strong>${pounds(c.deductions / 52)}</strong>, made up of income tax and National Insurance.</p>
  <h3>Does this include pension contributions?</h3>
  <p>No. Pension contributions, student loans, salary sacrifice and taxable benefits can change the amount you actually see on your payslip.</p>
  <h3>Is &pound;35,000 a good salary by week?</h3>
  <p>It can be a good weekly take-home figure when rent, commuting and debt are controlled. It feels strongest where fixed costs leave enough room for food, travel, savings and irregular expenses.</p>
</section>

<section class="card">
  <h2>Final summary</h2>
  <p>A &pound;35,000 salary gives estimated weekly take-home pay of around <strong>${pounds(c.netWeek)}</strong>, with monthly take-home of about <strong>${pounds(c.netMonth)}</strong> and yearly take-home of about <strong>${pounds(c.netYear)}</strong>. The weekly figure is useful for short-term budgeting, but your real payslip may change with pension contributions, student loans, tax code changes or salary sacrifice.</p>
  <p>For the broader view, use the <a href="/35000-salary-after-tax-uk.html">&pound;35,000 annual salary page</a>, compare <a href="/35000-after-tax-monthly.html">&pound;35,000 monthly take-home pay</a>, or return to the <a href="/salary-after-tax-uk.html">UK salary after tax hub</a>.</p>
</section>

<footer><p>Figures are estimates for general guidance and may not match your exact payslip.</p></footer>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "35000-after-tax-weekly.html"), html, "utf8");
console.log("Generated elite-five-pages/35000-after-tax-weekly.html");
