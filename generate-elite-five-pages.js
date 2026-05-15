const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "elite-five-pages");
fs.mkdirSync(outDir, { recursive: true });

function pounds(value) {
  return "&pound;" + Math.round(value).toLocaleString("en-GB");
}

function textPounds(value) {
  return "&pound;" + Math.round(value).toLocaleString("en-GB");
}

function ukTax(salary) {
  const allowance = Math.max(0, 12570 - Math.max(0, salary - 100000) / 2);
  const taxable = Math.max(0, salary - allowance);
  const basicTaxable = Math.min(taxable, Math.max(0, 50270 - allowance));
  const higherTaxable = Math.min(Math.max(0, taxable - basicTaxable), 125140 - 50270);
  const additionalTaxable = Math.max(0, taxable - basicTaxable - higherTaxable);
  const incomeTax = basicTaxable * 0.2 + higherTaxable * 0.4 + additionalTaxable * 0.45;
  const ni = Math.min(Math.max(0, salary - 12570), 50270 - 12570) * 0.08 + Math.max(0, salary - 50270) * 0.02;
  const deductions = incomeTax + ni;
  return {
    salary,
    incomeTax,
    ni,
    deductions,
    netYear: salary - deductions,
    grossMonth: salary / 12,
    grossWeek: salary / 52,
    netMonth: (salary - deductions) / 12,
    netWeek: (salary - deductions) / 52,
  };
}

const pages = {
  27000: {
    badge: "Lower-mid UK salary guide",
    h1: "£27,000 After Tax UK",
    titleSuffix: "Monthly Take-Home Pay and Real Budget View",
    intro: [
      "A £27,000 salary in the UK is the kind of income where the monthly number matters more than the headline figure. After income tax and National Insurance, the estimated take-home pay is about {netYear} a year, which is roughly {netMonth} a month.",
      "That monthly figure can cover normal living costs, but it does not leave unlimited room for mistakes. Rent, transport, council tax, energy bills and debt repayments can quickly decide whether £27k feels manageable or tight.",
      "The useful way to judge this salary is to look at the gap between fixed costs and flexible money. A low rent, short commute or shared household can make £27,000 feel steady; a high rent or car payment can make the same income feel much more pressured.",
      "This page focuses on the practical version of the answer: what lands in your bank account, what is deducted, how the salary compares with nearby incomes and what a realistic monthly budget might look like.",
    ],
    feelHeading: "What £27,000 feels like month to month",
    feel: [
      "At around {netMonth} after tax, £27k is workable for many people, especially outside the most expensive areas. It usually asks for some structure: rent needs to be kept sensible, recurring subscriptions need watching and savings may have to be built gradually.",
      "For a single person in a lower-cost town, this can be a stable salary. In London, the South East or any household with high transport or debt costs, it can feel much closer to the edge.",
    ],
    comparisonLead: "Small salary movements matter at this level because an extra £1,000 or £2,000 can translate into money for food, utilities, travel or savings rather than abstract annual income.",
    budgetNote: "A £27k budget works best when essentials are predictable. The danger zone is a rent or commute that leaves too little room for irregular costs like car repairs, dental bills or replacing household items.",
    faqStyle: "plain",
  },
  28000: {
    badge: "UK take-home pay guide",
    h1: "£28,000 After Tax UK",
    titleSuffix: "Yearly, Monthly and Weekly Breakdown",
    intro: [
      "On a £28,000 salary in the UK, estimated take-home pay is around {netYear} per year after income tax and National Insurance. Broken down monthly, that is about {netMonth} landing in your bank account before any personal deductions such as pension or student loan repayments.",
      "This is a salary where the difference between gross and net pay is easy to underestimate. £28,000 sounds like {grossMonth} a month before deductions, but the usable figure is lower once PAYE has done its work.",
      "In practical terms, £28k can be a solid base if housing costs are under control. It is often enough for ordinary bills and modest saving, but it may feel stretched if you are renting alone in a high-cost area or carrying regular debt repayments.",
      "The sections below give the direct answer, the tax breakdown, monthly budget pressure points, nearby salary comparisons and the dedicated monthly and weekly versions for this exact income.",
    ],
    feelHeading: "How strong is £28,000 in real life?",
    feel: [
      "A £28,000 salary is often enough to feel stable when fixed costs are reasonable. The salary becomes more fragile when rent, travel, debt or childcare take a large share before the month has properly started.",
      "Compared with £27,000, the improvement is not dramatic, but it is still useful. The extra take-home can cover a bill increase, a better savings habit or a little more breathing room at the end of the month.",
    ],
    comparisonLead: "The closest comparisons are useful because many job offers and pay rises sit only a few thousand pounds apart. Looking at the monthly difference makes the trade-off clearer.",
    budgetNote: "For £28k, budgeting is less about extreme frugality and more about controlling the big fixed lines. A cheaper commute or shared housing arrangement can change the whole feel of the salary.",
    faqStyle: "conversational",
  },
  30000: {
    badge: "Important UK salary milestone",
    h1: "£30,000 After Tax UK",
    titleSuffix: "Monthly Take-Home Pay, Tax and Budget Guide",
    intro: [
      "A £30,000 salary is a common UK milestone, and the after-tax figure is the part that matters for day-to-day planning. After income tax and National Insurance, estimated take-home pay is about {netYear} a year, or roughly {netMonth} per month.",
      "The gross salary works out at {grossMonth} a month before deductions, so the net figure can feel noticeably different from the headline number. That gap is normal: PAYE deductions are taking income tax and employee National Insurance before pay reaches your account.",
      "For many workers, £30k is the point where budgeting begins to feel a little less fragile, but it is not automatically comfortable everywhere. Housing costs, commuting, debt and whether you live alone or share bills make a big difference.",
      "This rebuilt page replaces the incorrect old content and gives a UK-specific answer with salary tables, deductions, budget context, nearby salary links, monthly and weekly versions and a deeper FAQ.",
    ],
    feelHeading: "What £30,000 usually feels like",
    feel: [
      "£30,000 can feel like a decent, workable salary in much of the UK. It gives more room than the high-£20k range, but it still rewards careful choices around rent, transport and recurring payments.",
      "For someone sharing housing costs or living outside expensive cities, the monthly take-home can support bills, normal spending and some savings. Renting alone in a costly area can make the same salary feel much tighter.",
    ],
    comparisonLead: "Because £30k is a benchmark salary, it is especially worth comparing against £28k, £29k, £31k and £32k. The monthly differences are modest individually, but they add up over a full year.",
    budgetNote: "A sensible £30k budget should leave some room for savings or debt reduction. If the budget only works perfectly on paper, fixed costs are probably too high for the take-home pay.",
    faqStyle: "milestone",
  },
  32000: {
    badge: "UK salary affordability guide",
    h1: "£32,000 After Tax UK",
    titleSuffix: "Take-Home Pay, Deductions and Living Costs",
    intro: [
      "If you earn £32,000 in the UK, estimated take-home pay after income tax and National Insurance is around {netYear} per year. That gives an estimated monthly take-home figure of about {netMonth}.",
      "At this level, the salary starts to feel more flexible than the late-£20k range, but the monthly budget still depends heavily on housing. A manageable rent or mortgage can make £32k feel comfortable; high fixed costs can absorb the improvement quickly.",
      "The gross monthly salary is around {grossMonth}, so the difference between gross and take-home pay is meaningful. Pension contributions, student loan repayments and benefit deductions can reduce the visible monthly amount further.",
      "Use this page to see the direct take-home answer, the deduction estimate, realistic living-cost context, nearby salary comparisons and the monthly and weekly pages for the same salary.",
    ],
    feelHeading: "How £32,000 fits into a UK budget",
    feel: [
      "£32,000 is often a stable salary for a single person outside the most expensive locations. It can support normal bills and some financial progress if the biggest costs are kept in proportion.",
      "The salary may still feel limited for someone renting alone in a major city, supporting children or paying down debt. The key question is not only whether bills are covered, but whether there is a repeatable surplus after essentials.",
    ],
    comparisonLead: "The move from £30k to £32k is noticeable over a year, even if the monthly increase does not feel dramatic at first glance.",
    budgetNote: "With £32k, the budget has more elasticity. That makes it a good point to protect savings before lifestyle upgrades quietly consume the extra take-home pay.",
    faqStyle: "practical",
  },
  35000: {
    badge: "UK salary comfort guide",
    h1: "£35,000 After Tax UK",
    titleSuffix: "Monthly Pay, Weekly Pay and Budget Context",
    intro: [
      "A £35,000 salary in the UK gives estimated take-home pay of about {netYear} per year after income tax and National Insurance. That is roughly {netMonth} per month, before pension contributions, student loans or other personal deductions.",
      "This salary is a clear step up from £30k and can feel meaningfully better in everyday life. The extra monthly take-home can help with rent, savings, debt repayment or simply having less pressure around ordinary bills.",
      "It is still not a salary where location stops mattering. In lower-cost areas, £35k can feel comfortable and steady; in London or a high-rent household, the same income may still need careful planning.",
      "Below you will find the direct answer, yearly/monthly/weekly breakdown, tax deductions, realistic budget examples, nearby salary comparisons, monthly and weekly links, and salary-specific FAQs.",
    ],
    feelHeading: "Is £35,000 comfortable in the UK?",
    feel: [
      "For many people, £35,000 is where the monthly budget starts to feel less squeezed. It can leave space for savings if housing costs are reasonable and debt is not taking too much of the pay packet.",
      "The salary is strongest when paired with controlled rent, a predictable commute and a clear plan for the extra monthly money compared with £30k or £32k.",
    ],
    comparisonLead: "£35k sits in a useful comparison zone: above common entry and mid-level salaries, but still close enough to £32k and £40k that the monthly difference is worth checking.",
    budgetNote: "At £35k, a budget should ideally include a real savings line rather than only covering bills. If it does not, the issue is usually housing, transport, debt or lifestyle creep.",
    faqStyle: "comfort",
  },
};

function applyVars(text, c) {
  return text
    .replaceAll("{netYear}", pounds(c.netYear))
    .replaceAll("{netMonth}", pounds(c.netMonth))
    .replaceAll("{netWeek}", pounds(c.netWeek))
    .replaceAll("{grossMonth}", pounds(c.grossMonth));
}

function budgetRows(amount, c) {
  const lowRent = amount < 30000 ? 500 : amount < 33000 ? 600 : 700;
  const highRent = amount < 30000 ? 850 : amount < 33000 ? 1000 : 1200;
  const savingsLow = amount < 30000 ? 50 : amount < 33000 ? 100 : 150;
  const savingsHigh = amount < 30000 ? 180 : amount < 33000 ? 280 : 400;
  return [
    ["Rent or mortgage", lowRent, highRent, amount < 30000 ? "Needs to be kept controlled; high solo rent can make the salary tight." : "The biggest line in the budget and the clearest comfort divider."],
    ["Council tax and utilities", 230, amount < 33000 ? 380 : 430, "Council tax, gas, electricity, water, broadband and mobile."],
    ["Food and household", amount < 30000 ? 220 : 260, amount < 33000 ? 420 : 480, "Shopping habits and household size make this line move quickly."],
    ["Transport", amount < 30000 ? 120 : 150, amount < 33000 ? 330 : 420, "Public transport, fuel, insurance, parking, servicing or commuting."],
    ["Savings or debt repayment", savingsLow, savingsHigh, "The target surplus after essentials, even if it starts modestly."],
    ["Flexible spending", amount < 30000 ? 120 : 170, amount < 33000 ? 320 : 450, "Clothes, subscriptions, meals out, hobbies and irregular costs."],
  ].map(([name, low, high, note]) => `<tr><td>${name}</td><td>${pounds(low)}-${pounds(high)}</td><td>${note}</td></tr>`).join("\n");
}

function nearby(amount) {
  const custom = {
    27000: [25000, 28000, 29000, 30000, 32000],
    28000: [25000, 27000, 29000, 30000, 32000],
  };
  if (custom[amount]) {
    return custom[amount].map((n) => ({ n, c: ukTax(n) }));
  }
  const nums = [amount - 2000, amount - 1000, amount + 1000, amount + 2000, amount + 5000]
    .filter((n) => n > 0 && n !== amount);
  return nums.map((n) => ({ n, c: ukTax(n) }));
}

function page(amount, data) {
  const c = ukTax(amount);
  const near = nearby(amount);
  const intro = data.intro.map((p, i) => `<p${i === 0 ? ' class="lead"' : ""}>${applyVars(p, c)}</p>`).join("\n  ");
  const feel = data.feel.map((p) => `<p>${applyVars(p, c)}</p>`).join("\n  ");
  const comparisonRows = near.map(({ n, c: nc }) => {
    const diff = nc.netMonth - c.netMonth;
    const wording = diff > 0 ? `${pounds(diff)} more/month` : `${pounds(Math.abs(diff))} less/month`;
    const meaning = diff > 0 ? "A little more room for savings, bills or debt repayment." : "Slightly less flexibility once fixed costs are paid.";
    return `<tr><td><a href="/${n}-salary-after-tax-uk.html">${pounds(n)}</a></td><td>About ${pounds(nc.netMonth)}</td><td>${wording}</td><td>${meaning}</td></tr>`;
  }).join("\n");
  const linkGrid = near.map(({ n }) => `<a href="/${n}-salary-after-tax-uk.html">${pounds(n)} after tax UK</a>`).join("\n    ");
  const rangeLow = Math.floor(amount / 10000) * 10000;
  const rangeHigh = rangeLow + 10000;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${textPounds(amount)} After Tax UK - ${data.titleSuffix}</title>
<meta name="description" content="See ${textPounds(amount)} after tax in the UK with yearly, monthly and weekly take-home pay, deductions, budget context, nearby salary comparisons and FAQs.">
<link rel="canonical" href="https://aftertaxtool.com/${amount}-salary-after-tax-uk.html">
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
  <nav class="breadcrumbs"><a href="/">Home</a> &rsaquo; <a href="/salary-after-tax-uk.html">UK salary after tax</a> &rsaquo; ${pounds(amount)} salary after tax</nav>
  <span class="badge">${data.badge}</span>
  <h1>${data.h1}</h1>
  ${intro}
  <div class="answer-box">
    <h2>Direct answer: ${pounds(amount)} after tax</h2>
    <p>Estimated take-home pay on a ${pounds(amount)} UK salary is:</p>
    <div class="answer-figure">${pounds(c.netMonth)} per month after tax</div>
    <div class="grid grid-3">
      <div class="stat"><span>Yearly take-home</span><strong>${pounds(c.netYear)}</strong></div>
      <div class="stat"><span>Monthly take-home</span><strong>${pounds(c.netMonth)}</strong></div>
      <div class="stat"><span>Weekly take-home</span><strong>${pounds(c.netWeek)}</strong></div>
    </div>
  </div>
</section>

<section class="card">
  <h2>Check this salary another way</h2>
  <p>Use the main <a href="/">salary after tax calculator</a> to change assumptions, or compare with the <a href="/monthly-pay-after-tax-calculator.html">monthly pay after tax calculator</a> if bills and affordability are your main concern.</p>
  <p>For this exact income, see <a href="/${amount}-after-tax-monthly.html">${pounds(amount)} after tax monthly</a> and <a href="/${amount}-after-tax-weekly.html">${pounds(amount)} after tax weekly</a>.</p>
</section>

<div class="ad-slot">Advertisement</div>

<section class="card">
  <h2>${pounds(amount)} salary breakdown: yearly, monthly and weekly</h2>
  <table>
    <thead><tr><th>Pay period</th><th>Gross income</th><th>Estimated deductions</th><th>Estimated take-home pay</th></tr></thead>
    <tbody>
      <tr><td>Yearly</td><td>${pounds(amount)}</td><td>${pounds(c.deductions)}</td><td><strong>${pounds(c.netYear)}</strong></td></tr>
      <tr><td>Monthly</td><td>${pounds(c.grossMonth)}</td><td>${pounds(c.deductions / 12)}</td><td><strong>${pounds(c.netMonth)}</strong></td></tr>
      <tr><td>Weekly</td><td>${pounds(c.grossWeek)}</td><td>${pounds(c.deductions / 52)}</td><td><strong>${pounds(c.netWeek)}</strong></td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>Estimated deductions from ${pounds(amount)}</h2>
  <table>
    <thead><tr><th>Deduction</th><th>Yearly estimate</th><th>Monthly estimate</th><th>What it means</th></tr></thead>
    <tbody>
      <tr><td>Income tax</td><td>${pounds(c.incomeTax)}</td><td>${pounds(c.incomeTax / 12)}</td><td>PAYE tax on earnings above the personal allowance.</td></tr>
      <tr><td>National Insurance</td><td>${pounds(c.ni)}</td><td>${pounds(c.ni / 12)}</td><td>Employee NI deducted through payroll.</td></tr>
      <tr><td>Total deductions</td><td><strong>${pounds(c.deductions)}</strong></td><td><strong>${pounds(c.deductions / 12)}</strong></td><td>The estimated difference between gross pay and take-home pay.</td></tr>
    </tbody>
  </table>
  <div class="notice"><strong>Note:</strong> pension contributions, salary sacrifice, student loans, taxable benefits and tax code changes can alter your actual monthly pay.</div>
</section>

<section class="card">
  <h2>${data.feelHeading}</h2>
  ${feel}
  <table>
    <thead><tr><th>Situation</th><th>Likely feel</th></tr></thead>
    <tbody>
      <tr><td>Single person, lower-cost area</td><td>More manageable when rent and transport stay modest.</td></tr>
      <tr><td>Single person, expensive city</td><td>Usually tighter because rent takes a larger share of take-home pay.</td></tr>
      <tr><td>Shared household</td><td>Can feel stronger when bills and rent are split.</td></tr>
      <tr><td>Household with debt or childcare</td><td>Needs closer planning because fixed costs reduce flexibility.</td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>Example monthly budget on ${pounds(amount)} after tax</h2>
  <p>${data.budgetNote}</p>
  <table>
    <thead><tr><th>Category</th><th>Example monthly spend</th><th>Comment</th></tr></thead>
    <tbody>
      ${budgetRows(amount, c)}
    </tbody>
  </table>
</section>

<section class="card">
  <h2>${pounds(amount)} compared with nearby salaries</h2>
  <p>${data.comparisonLead}</p>
  <table>
    <thead><tr><th>Salary</th><th>Estimated monthly take-home</th><th>Difference vs ${pounds(amount)}</th><th>Practical meaning</th></tr></thead>
    <tbody>
      ${comparisonRows}
    </tbody>
  </table>
</section>

<section class="card">
  <h2>Nearby salary links</h2>
  <div class="link-grid">
    ${linkGrid}
    <a href="/${amount}-after-tax-monthly.html">${pounds(amount)} after tax monthly</a>
    <a href="/${amount}-after-tax-weekly.html">${pounds(amount)} after tax weekly</a>
    <a href="/salary-after-tax-${rangeLow}-${rangeHigh}-uk.html">${pounds(rangeLow)}-${pounds(rangeHigh)} salary range</a>
  </div>
</section>

<section class="card">
  <h2>Related UK salary resources</h2>
  <div class="link-grid">
    <a href="/">Salary after tax calculator</a>
    <a href="/salary-after-tax-uk.html">UK salary after tax hub</a>
    <a href="/salary-after-tax-by-income.html">Salary after tax by income</a>
    <a href="/monthly-pay-after-tax-calculator.html">Monthly pay after tax calculator</a>
    <a href="/uk-income-tax-explained.html">UK income tax explained</a>
    <a href="/salary-after-tax-faq.html">Salary after tax FAQ</a>
  </div>
</section>

<div class="ad-slot">Advertisement</div>

<section class="card">
  <h2>FAQ: ${pounds(amount)} after tax UK</h2>
  <h3>How much is ${pounds(amount)} after tax in the UK?</h3>
  <p>A ${pounds(amount)} salary gives estimated take-home pay of around <strong>${pounds(c.netYear)} per year</strong>, or about <strong>${pounds(c.netMonth)} per month</strong>, after income tax and National Insurance.</p>
  <h3>How much is ${pounds(amount)} after tax monthly?</h3>
  <p>The monthly estimate is <strong>${pounds(c.netMonth)}</strong>. For a pay-period focused version, use <a href="/${amount}-after-tax-monthly.html">${pounds(amount)} after tax monthly</a>.</p>
  <h3>How much is ${pounds(amount)} after tax weekly?</h3>
  <p>The weekly estimate is about <strong>${pounds(c.netWeek)}</strong>. The dedicated weekly page is <a href="/${amount}-after-tax-weekly.html">${pounds(amount)} after tax weekly</a>.</p>
  <h3>Is ${pounds(amount)} a good salary in the UK?</h3>
  <p>${applyVars(data.feel[0], c)}</p>
  <h3>Why might my payslip be different?</h3>
  <p>Your real pay can change because of pension contributions, student loan deductions, tax code changes, salary sacrifice, benefits, bonuses or overtime.</p>
  <h3>What should I compare ${pounds(amount)} with?</h3>
  <p>Start with ${near.map(({ n }) => `<a href="/${n}-salary-after-tax-uk.html">${pounds(n)} after tax</a>`).join(", ")} because these show the closest monthly differences.</p>
</section>

<section class="card">
  <h2>Final summary</h2>
  <p>A ${pounds(amount)} salary in the UK is estimated at <strong>${pounds(c.netYear)} per year</strong>, <strong>${pounds(c.netMonth)} per month</strong> or <strong>${pounds(c.netWeek)} per week</strong> after income tax and National Insurance. Whether it feels comfortable depends less on the headline salary and more on rent, commuting, bills, debt, pension deductions and where you live.</p>
  <p>For more context, compare the <a href="/${amount}-after-tax-monthly.html">monthly breakdown</a>, check the <a href="/${amount}-after-tax-weekly.html">weekly breakdown</a>, or return to the <a href="/salary-after-tax-uk.html">UK salary after tax hub</a>.</p>
</section>

<footer><p>Figures are estimates for general guidance and may not match your exact payslip.</p></footer>
</main>
</body>
</html>
`;
}

for (const [amountText, data] of Object.entries(pages)) {
  const amount = Number(amountText);
  fs.writeFileSync(path.join(outDir, `${amount}-salary-after-tax-uk.html`), page(amount, data), "utf8");
}

console.log(`Generated ${Object.keys(pages).length} elite UK salary pages in ${outDir}`);
