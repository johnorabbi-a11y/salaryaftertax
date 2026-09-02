import csv, html, json, math, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
BUILD = ROOT / 'att-v2-build'
ASSETS = BUILD / 'assets'
BASE = 'https://aftertaxtool.com'

CATEGORIES = {
    'CORE': ('Core tools', 'Start with the broad calculators and trusted assumptions.'),
    'PAY & TAX': ('Pay & tax', 'Estimate take-home pay, deductions, tax and payroll effects.'),
    'HOUSEHOLD MONEY': ('Household money', 'Turn income into realistic monthly budget decisions.'),
    'BORROWING & DEBT': ('Borrowing & debt', 'Estimate repayments, debt timelines and affordability arithmetic.'),
    'SAVINGS': ('Savings', 'Plan goals, emergency funds and compound growth.'),
    'WORK MONEY': ('Work money', 'Compare pay rises, benefits, job offers and work-related costs.'),
    'GUIDES': ('Guides', 'Plain-English context for calculators and decisions.'),
    'TRUST / METHODOLOGY': ('Trust & methodology', 'How AfterTaxTool explains assumptions and limitations.'),
}

def read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def slug_title(s):
    s = s.strip('/').split('/')[-1] or 'AfterTaxTool'
    s = re.sub(r'\.html$', '', s)
    return ' '.join(w.upper() if w in {'uk','us','apr','isa','dti'} else w.capitalize() for w in s.split('-'))

def local_path(url):
    if url == '/':
        return BUILD / 'index.html'
    clean = url.lstrip('/')
    if clean.endswith('/'):
        return BUILD / clean / 'index.html'
    return BUILD / clean

def canonical(url):
    return BASE + '/' if url == '/' else BASE + url

def rel_href(current_url, target_url):
    return target_url

def category_slug(cat):
    return {
        'PAY & TAX':'/pay-tax/', 'HOUSEHOLD MONEY':'/household-money/', 'BORROWING & DEBT':'/borrowing-debt/',
        'SAVINGS':'/saving/', 'WORK MONEY':'/work-money/', 'GUIDES':'/guides/', 'TRUST / METHODOLOGY':'/methodology.html', 'CORE':'/'
    }.get(cat, '/')

def excerpt(text, n=150):
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:n-1].rstrip() + ('…' if len(text) >= n else '')

def css_text():
    return r'''
:root{--ink:#18212f;--muted:#5b6678;--line:#dfe5ee;--paper:#fbfaf7;--panel:#ffffff;--brand:#166b68;--brand2:#7c4d15;--accent:#d9f2e8;--soft:#eef4ff;--warn:#fff4da;--shadow:0 18px 50px rgba(24,33,47,.08)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:var(--ink);background:var(--paper);line-height:1.6}a{color:#0f625f;text-decoration-thickness:.08em;text-underline-offset:.18em}a:hover{color:#6d4311}.site-header{position:sticky;top:0;background:rgba(251,250,247,.94);backdrop-filter:saturate(130%) blur(10px);border-bottom:1px solid var(--line);z-index:5}.nav{max-width:1180px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;gap:18px}.brand{font-weight:800;text-decoration:none;color:var(--ink);letter-spacing:0}.nav-links{display:flex;gap:16px;flex-wrap:wrap}.nav-links a{text-decoration:none;color:var(--ink);font-weight:650}.hero{border-bottom:1px solid var(--line);background:linear-gradient(135deg,#f9faf6 0%,#eff7f1 55%,#f8efe2 100%)}.wrap{max-width:1180px;margin:auto;padding:34px 20px}.hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:28px;align-items:center}.eyebrow{color:var(--brand2);font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}h1{font-size:clamp(2.15rem,4vw,4.6rem);line-height:1.02;margin:.2em 0 .25em;letter-spacing:0}h2{font-size:clamp(1.45rem,2vw,2.1rem);line-height:1.16;margin:0 0 .55em}h3{font-size:1.08rem;line-height:1.25;margin:0 0 .4em}.lede{font-size:1.14rem;color:#344154;max-width:740px}.section{padding:36px 0;border-bottom:1px solid var(--line)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.card,.calc-panel,.result-panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;box-shadow:var(--shadow)}.card a{font-weight:750}.badge{display:inline-block;background:var(--accent);color:#104f4c;border-radius:999px;padding:4px 10px;font-weight:750;font-size:.82rem}.calc-panel{display:grid;gap:14px}.input-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}label{display:grid;gap:6px;font-weight:700}input,select{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:12px;font:inherit;background:#fff;color:var(--ink)}button,.button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:var(--brand);color:#fff;padding:12px 16px;font-weight:800;text-decoration:none;cursor:pointer}button:hover,.button:hover{background:#0f5452;color:#fff}.assumption-note{margin:2px 0 14px;color:#526174;font-size:.92rem;line-height:1.45}.result-panel{background:#f5fbf7;border-color:#c8e8dc}.result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.metric{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px}.metric strong{display:block;font-size:1.35rem}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line)}th{background:#f1f6f3}.note{background:var(--warn);border:1px solid #f1d699;border-radius:10px;padding:14px;color:#4b3a15}.breadcrumb{font-size:.9rem;color:var(--muted);margin-bottom:16px}.footer{background:#17202d;color:#e8eef6}.footer a{color:#d7f7ec}.footer .wrap{padding:28px 20px}.small{font-size:.92rem;color:var(--muted)}.link-row{display:flex;gap:10px;flex-wrap:wrap}.link-row a{background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 11px;text-decoration:none}.portfolio{background:#f7f2e8;border:1px solid #ead9bd;border-radius:10px;padding:15px}.screen-reader{position:absolute;left:-10000px}@media(max-width:820px){.hero-grid,.grid,.grid.two,.input-grid,.result-grid{grid-template-columns:1fr}.nav{align-items:flex-start;flex-direction:column}.wrap{padding:26px 16px}h1{font-size:2.35rem}.card,.calc-panel,.result-panel{padding:15px}}
'''

def js_text():
    return r'''
(function(){
const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const money=(n,c='GBP')=>new Intl.NumberFormat(c==='USD'?'en-US':'en-GB',{style:'currency',currency:c,maximumFractionDigits:0}).format(isFinite(n)?n:0);
const pct=n=>(isFinite(n)?n:0).toFixed(1)+'%'; const num=(form,name,def=0)=>{const el=form.elements[name]; const v=el?parseFloat(el.value):NaN; return isFinite(v)?v:def};
const TAX_RULES={uk:'UK 2026/27 England, Wales and Northern Ireland income-tax bands, category A employee NI and user-entered student-loan threshold.',us:'US 2026 federal single-filer brackets, standard deduction, FICA wage base and user-entered state-tax estimate.'};
const UK_STAT={smpWeekly:194.32,sspWeekly:123.25,redundancyWeeklyCap:751};
const STUDENT_PLANS={plan1:26065,plan2:28470,plan4:32745,plan5:25000,postgraduate:21000};
function ukTakeHome(salary,pension=5,student=0){salary=Math.max(0,salary); const pensionAmt=salary*pension/100; const adjusted=Math.max(0,salary-pensionAmt); const allowance=Math.max(0,12570-Math.max(0,adjusted-100000)/2); const taxable=Math.max(0,adjusted-allowance); const incomeTax=Math.min(taxable,37700)*.2+Math.min(Math.max(0,taxable-37700),87440)*.4+Math.max(0,taxable-125140)*.45; const niPay=Math.max(0,salary-12570); const ni=Math.min(niPay,37700)*.08+Math.max(0,niPay-37700)*.02; const studentRepay=Math.max(0,salary-student)*.09; const net=Math.max(0,salary-incomeTax-ni-pensionAmt-studentRepay); return {net,tax:incomeTax,ni,pension:pensionAmt,student:studentRepay,deductions:salary-net};}
function usFederalTax(taxable){return Math.min(taxable,12400)*.10+Math.min(Math.max(0,taxable-12400),38000)*.12+Math.min(Math.max(0,taxable-50400),55300)*.22+Math.min(Math.max(0,taxable-105700),96075)*.24+Math.min(Math.max(0,taxable-201775),54450)*.32+Math.min(Math.max(0,taxable-256225),384375)*.35+Math.max(0,taxable-640600)*.37;}
function usFica(wages){return Math.min(Math.max(0,wages),184500)*.062+Math.max(0,wages)*.0145+Math.max(0,wages-200000)*.009;}
function usTakeHome(salary,pension=0,state=4){salary=Math.max(0,salary); const retirement=salary*pension/100; const taxable=Math.max(0,salary-retirement-16100); const fed=usFederalTax(taxable); const fica=usFica(salary); const st=salary*state/100; const net=Math.max(0,salary-fed-fica-st-retirement); return {net,tax:fed,ni:fica,pension:retirement,student:st,deductions:salary-net};}
function payCalc(form,salaryOverride){const salary=isFinite(salaryOverride)?salaryOverride:num(form,'salary',50000), pension=num(form,'pension',5), region=(form.elements.region?.value||'UK'), state=num(form,'stateTax',4), student=num(form,'studentThreshold',27295); return region==='US'?usTakeHome(salary,pension,state):ukTakeHome(salary,pension,student);}
function pmt(principal,rate,years){principal=Math.max(0,principal); const n=Math.max(1,years*12), r=Math.max(0,rate)/100/12; return r===0?principal/n:principal*r/(1-Math.pow(1+r,-n));}
function compound(start,monthly,rate,years){let bal=Math.max(0,start), r=Math.max(0,rate)/100/12, months=Math.max(0,Math.round(years*12)); for(let i=0;i<months;i++) bal=bal*(1+r)+Math.max(0,monthly); return bal;}
function show(form,items,note){const out=$('[data-result]',form); if(!out) return; out.innerHTML='<div class="result-grid">'+items.map(i=>`<div class="metric"><span>${i[0]}</span><strong>${i[1]}</strong></div>`).join('')+'</div><p>'+note+'</p>'; out.hidden=false;}
function run(form){const type=form.dataset.calcType||'generic', currency=(form.elements.currency?.value||'GBP'); let salary=num(form,'salary',50000), amount=num(form,'amount',10000), rate=num(form,'rate',5), years=num(form,'years',5), monthly=num(form,'monthly',250), days=num(form,'days',3), weeks=num(form,'weeks',2), qdays=num(form,'qualifyingDays',5), limit=num(form,'limit',3000), miles=num(form,'miles',20), price=num(form,'price',1.55), mpg=num(form,'mpg',45), pension=num(form,'pension',5), bonus=num(form,'bonus',5000), salary2=num(form,'salary2',60000);
 if(type.includes('student-loan')){let plan=form.elements.studentPlan?.value||'plan2', threshold=STUDENT_PLANS[plan]||STUDENT_PLANS.plan2, repay=Math.max(0,salary-threshold)*(plan==='postgraduate'?.06:.09); show(form,[['Annual repayment',money(repay,currency)],['Monthly repayment',money(repay/12,currency)],['Threshold used',money(threshold,currency)]],`This uses GOV.UK 2026/27 student-loan repayment thresholds for ${plan}. It does not model multiple concurrent plans or every payroll timing case.`); return;}
 if(type.includes('credit-utilisation')){let utilisation=amount/Math.max(1,limit)*100; show(form,[['Utilisation ratio',pct(utilisation)],['Balance used',money(amount,currency)],['Credit limit',money(limit,currency)]],'Credit utilisation is balance divided by credit limit. It is an educational ratio, not a lending decision or credit-score prediction.'); return;}
 if(type.includes('balance-transfer')){let fee=amount*rate/100, months=Math.ceil((amount+fee)/Math.max(1,monthly)); show(form,[['Transfer fee',money(fee,currency)],['Balance plus fee',money(amount+fee,currency)],['Months at payment',String(months)]],'This simple transfer estimate excludes post-promotional interest, provider eligibility and fees not entered here.'); return;}
 if(type.includes('sick')){let weekly=Math.min(UK_STAT.sspWeekly,amount*.8), pay=weekly/Math.max(1,qdays)*Math.min(days,qdays*4); show(form,[['Estimated SSP',money(pay,currency)],['Weekly SSP basis',money(weekly,currency)],['Rule-period cap',money(UK_STAT.sspWeekly,currency)]],'This is a statutory sick pay estimate using 2026/27 rates. Eligibility, qualifying days, waiting-day rules and contractual sick pay can change the real amount.'); return;}
 if(type.includes('maternity')){let first=Math.min(6,weeks)*amount*.9, remaining=Math.max(0,Math.min(weeks,39)-6)*Math.min(UK_STAT.smpWeekly,amount*.9); show(form,[['Estimated SMP',money(first+remaining,currency)],['First 6 weeks basis',money(amount*.9,currency)],['Standard weekly cap',money(UK_STAT.smpWeekly,currency)]],'This is a statutory maternity pay estimate using 2026/27 rates. It excludes eligibility, employer schemes and unusual pay-reference periods.'); return;}
 if(type.includes('paternity')){let weekly=Math.min(UK_STAT.smpWeekly,amount*.9), pay=Math.min(2,weeks)*weekly; show(form,[['Estimated SPP',money(pay,currency)],['Weekly SPP basis',money(weekly,currency)],['Standard weekly cap',money(UK_STAT.smpWeekly,currency)]],'This is a statutory paternity pay estimate using 2026/27 rates. Eligibility and employer policies can change the real amount.'); return;}
 if(type.includes('redundancy')){let band=form.elements.ageBand?.value||'22-40', factor=band==='41plus'?1.5:(band==='under22'?.5:1), weekly=Math.min(amount,UK_STAT.redundancyWeeklyCap), pay=weekly*Math.min(20,years)*factor; show(form,[['Estimated statutory redundancy',money(pay,currency)],['Capped weekly pay used',money(weekly,currency)],['Years counted',String(Math.min(20,years))]],'This simplified estimate uses a single age band, 20-year service cap and 2026/27 weekly pay cap. The exact statutory calculation depends on age during each year of service.'); return;}
 if(type.includes('holiday')){let daily=salary/260, pay=daily*days; show(form,[['Holiday pay value',money(pay,currency)],['Daily pay basis',money(daily,currency)],['Days estimated',String(days)]],'This is a simple salary-to-working-day estimate. Irregular hours, holiday entitlement rules and contractual terms can change the result.'); return;}
 if(['take-home','income-tax','national-insurance','student-loan','pension','salary-sacrifice','pay-rise','raise','bonus-tax','payroll','fica','generic','holiday','sick','redundancy','overtime'].some(k=>type.includes(k))){let a=payCalc(form); let b=payCalc(form,salary2); let withBonus=payCalc(form,salary+bonus); let retained=type.includes('raise')||type.includes('pay-rise')||type.includes('job-change')?Math.max(0,b.net-a.net):Math.max(0,withBonus.net-a.net);
  let rules=(form.elements.region?.value||'UK')==='US'?TAX_RULES.us:TAX_RULES.uk;
  if(type.includes('income-tax')){show(form,[['Income tax estimate',money(a.tax,currency)],['Annual take-home',money(a.net,currency)],['Effective deduction rate',pct(a.deductions/Math.max(1,salary)*100)]],`Income tax is estimated using ${rules}`); return;}
  if(type.includes('national-insurance')||type.includes('fica')){show(form,[['Payroll tax estimate',money(a.ni,currency)],['Monthly equivalent',money(a.ni/12,currency)],['Annual take-home',money(a.net,currency)]],'Payroll-tax estimates depend on the jurisdiction, salary basis and thresholds shown in the assumptions.'); return;}
  if(type.includes('pension')){show(form,[['Employee contribution',money(salary*pension/100,currency)],['Estimated annual take-home',money(a.net,currency)],['Monthly take-home',money(a.net/12,currency)]],'Pension outputs show the take-home impact of the contribution percentage, not pension or investment advice.'); return;}
  if(type.includes('salary-sacrifice')){let afterSacrifice=payCalc(form,Math.max(0,salary-amount)); show(form,[['Take-home before',money(a.net,currency)],['Take-home after',money(afterSacrifice.net,currency)],['Gross sacrificed',money(amount,currency)]],'Salary-sacrifice estimates depend on the benefit type and payroll treatment; use this as an educational scenario check.'); return;}
  show(form,[['Annual take-home',money(a.net,currency)],['Monthly take-home',money(a.net/12,currency)],['Estimated deductions',money(a.deductions,currency)]], type.includes('raise')||type.includes('pay-rise')||type.includes('job-change')?`Estimated extra take-home from the change: ${money(retained,currency)} per year. Rule basis: ${rules}`:`This is an estimate using ${rules} It is not a payslip replacement.`); return; }
 if(type.includes('mortgage')||type.includes('loan')||type.includes('apr')){let pay=pmt(amount,rate,years), total=pay*years*12; show(form,[['Monthly payment',money(pay,currency)],['Total repaid',money(total,currency)],['Interest estimate',money(total-amount,currency)]],'The repayment estimate assumes a fixed rate and regular monthly payments.'); return;}
 if(type.includes('debt')){let pay=Math.max(1,monthly), r=rate/100/12, bal=amount, m=0, interest=0; while(bal>0&&m<600){let int=bal*r; interest+=int; bal=bal+int-pay; m++; if(pay<=int){m=600;break}} show(form,[['Months to clear',m>=600?'600+':String(m)],['Interest estimate',money(interest,currency)],['Monthly payment',money(pay,currency)]],'This is an educational payoff estimate. It does not replace debt advice.'); return;}
 if(type.includes('saving')||type.includes('compound')||type.includes('emergency')||type.includes('isa')){let future=compound(amount,monthly,rate,years); show(form,[['Future value',money(future,currency)],['Contributions',money(amount+monthly*years*12,currency)],['Growth estimate',money(future-(amount+monthly*years*12),currency)]],'Growth estimates depend heavily on the rate assumption and are not a guarantee.'); return;}
 if(type.includes('commute')||type.includes('fuel')||type.includes('car')||type.includes('job-change')){let weekly=(miles*2*days/mpg)*price, annual=weekly*46; show(form,[['Weekly cost',money(weekly,currency)],['Annual cost',money(annual,currency)],['Monthly equivalent',money(annual/12,currency)]],'Commute and car-cost estimates are useful for comparing take-home pay against real work costs.'); return;}
 let monthlyBudget=num(form,'income',3000)-num(form,'housing',1000)-num(form,'bills',500)-num(form,'debt',200); show(form,[['Monthly headroom',money(monthlyBudget,currency)],['Yearly equivalent',money(monthlyBudget*12,currency)],['Suggested buffer',money(Math.max(0,monthlyBudget*.2),currency)]],'Use this as a planning estimate, then replace assumptions with your actual costs.');
}
$$('form[data-calc-type]').forEach(form=>{form.addEventListener('submit',e=>{e.preventDefault();run(form)}); const b=form.querySelector('button'); if(b) b.addEventListener('click',e=>{e.preventDefault();run(form)});});
})();
'''

def calc_type(url, title):
    url_s=url.lower()
    title_s=title.lower()
    keys=['income-tax','national-insurance','student-loan','bonus-tax','overtime','pension-contribution','salary-sacrifice','pay-rise','raise','credit-utilisation','balance-transfer','mortgage','loan','apr','debt','rent','household-budget','cost-of-living','childcare','council-tax','energy','car','fuel','inflation','saving','emergency','compound','regular-savings','isa','redundancy','holiday','sick','maternity','paternity','day-rate','inside-ir35','outside-ir35','notice-pay','shift-allowance','total-compensation','benefits','job-offer','salary-change','commute','take-home']
    for key in keys:
        if key in url_s: return key
    for key in keys:
        if key in title_s: return key
    if 'pension' in url_s or 'pension' in title_s: return 'pension'
    return 'generic'

def calc_form(row):
    t=calc_type(row['proposed_url'], row['primary_intent'])
    currency = '<label>Currency<select name="currency"><option value="GBP">GBP / £</option><option value="USD">USD / $</option></select></label>'
    is_us = '-us' in row['proposed_url'] or row['proposed_url'].endswith('/salary-after-tax-us.html')
    region = '<label>Region<select name="region">' + ('<option>US</option><option>UK</option>' if is_us else '<option>UK</option><option>US</option>') + '</select></label>'
    if 'student-loan' in t:
        inputs=f'{currency}<label>Annual income<input name="salary" type="number" value="35000" min="0" step="100"></label><label>Student loan plan<select name="studentPlan"><option value="plan2">Plan 2</option><option value="plan1">Plan 1</option><option value="plan4">Plan 4</option><option value="plan5">Plan 5</option><option value="postgraduate">Postgraduate Loan</option></select></label>'
    elif 'sick' in t:
        inputs=f'{currency}<label>Average weekly earnings<input name="amount" type="number" value="500" min="0" step="10"></label><label>Sick days to estimate<input name="days" type="number" value="5" min="0" max="28" step="1"></label><label>Qualifying days per week<input name="qualifyingDays" type="number" value="5" min="1" max="7" step="1"></label>'
    elif 'maternity' in t:
        inputs=f'{currency}<label>Average weekly earnings<input name="amount" type="number" value="600" min="0" step="10"></label><label>SMP weeks to estimate<input name="weeks" type="number" value="39" min="1" max="39" step="1"></label>'
    elif 'paternity' in t:
        inputs=f'{currency}<label>Average weekly earnings<input name="amount" type="number" value="600" min="0" step="10"></label><label>SPP weeks to estimate<input name="weeks" type="number" value="2" min="1" max="2" step="1"></label>'
    elif 'redundancy' in t:
        inputs=f'{currency}<label>Average weekly pay<input name="amount" type="number" value="650" min="0" step="10"></label><label>Full years of service<input name="years" type="number" value="8" min="0" max="20" step="1"></label><label>Age band<select name="ageBand"><option value="22-40">22 to 40</option><option value="41plus">41 or older</option><option value="under22">Under 22</option></select></label>'
    elif 'holiday' in t:
        inputs=f'{currency}<label>Annual salary<input name="salary" type="number" value="40000" min="0" step="100"></label><label>Holiday days<input name="days" type="number" value="5" min="0" max="28" step="0.5"></label>'
    elif 'credit-utilisation' in t:
        inputs=f'{currency}<label>Card balance<input name="amount" type="number" value="750" min="0" step="10"></label><label>Credit limit<input name="limit" type="number" value="3000" min="1" step="50"></label>'
    elif 'balance-transfer' in t:
        inputs=f'{currency}<label>Transfer balance<input name="amount" type="number" value="3000" min="0" step="50"></label><label>Transfer fee %<input name="rate" type="number" value="3" min="0" step="0.1"></label><label>Monthly repayment<input name="monthly" type="number" value="150" min="1" step="10"></label>'
    elif any(k in t for k in ['mortgage','loan','apr']):
        inputs=f'{currency}<label>Amount<input name="amount" type="number" value="200000" min="0" step="100"></label><label>Interest rate %<input name="rate" type="number" value="5" min="0" step="0.01"></label><label>Term in years<input name="years" type="number" value="25" min="1" step="1"></label>'
    elif 'debt' in t:
        inputs=f'{currency}<label>Debt balance<input name="amount" type="number" value="5000" min="0" step="50"></label><label>APR %<input name="rate" type="number" value="19.9" min="0" step="0.1"></label><label>Monthly payment<input name="monthly" type="number" value="250" min="1" step="10"></label>'
    elif any(k in t for k in ['saving','compound','emergency','isa']):
        inputs=f'{currency}<label>Starting amount<input name="amount" type="number" value="1000" min="0" step="50"></label><label>Monthly saving<input name="monthly" type="number" value="250" min="0" step="10"></label><label>Rate %<input name="rate" type="number" value="4" min="0" step="0.1"></label><label>Years<input name="years" type="number" value="5" min="0" step="1"></label>'
    elif any(k in t for k in ['commute','fuel','car','job-change']):
        inputs=f'{currency}<label>Commute days per week<input name="days" type="number" value="3" min="0" max="7" step="1"></label><label>Round-trip miles<input name="miles" type="number" value="30" min="0" step="1"></label><label>Fuel price per litre<input name="price" type="number" value="1.55" min="0" step="0.01"></label><label>MPG<input name="mpg" type="number" value="45" min="1" step="1"></label>'
    elif any(k in t for k in ['rent','household','cost-of-living','childcare','council-tax','energy','inflation']):
        inputs=f'{currency}<label>Monthly income<input name="income" type="number" value="3200" min="0" step="50"></label><label>Housing cost<input name="housing" type="number" value="1100" min="0" step="50"></label><label>Bills and essentials<input name="bills" type="number" value="700" min="0" step="25"></label><label>Debt payments<input name="debt" type="number" value="200" min="0" step="25"></label>'
    else:
        inputs=f'{currency}{region}<label>Salary / starting amount<input name="salary" type="number" value="60000" min="0" step="100"></label><label>Comparison salary<input name="salary2" type="number" value="70000" min="0" step="100"></label><label>Pension / retirement %<input name="pension" type="number" value="5" min="0" max="80" step="0.5"></label><label>US state tax %<input name="stateTax" type="number" value="4" min="0" max="15" step="0.1"></label><label>UK student loan threshold<input name="studentThreshold" type="number" value="27295" min="0" step="100"></label><label>Bonus / extra pay<input name="bonus" type="number" value="5000" min="0" step="100"></label>'
    note = '<p class="assumption-note">Tax-sensitive estimates use stated rule-period assumptions. UK payroll examples use 2026/27 assumptions; US examples use 2026 federal assumptions plus any state-tax input.</p>'
    return f'<form class="calc-panel" data-calc-type="{html.escape(t)}"><div class="input-grid">{inputs}</div>{note}<button type="submit">Calculate estimate</button><div class="result-panel" data-result hidden></div></form>'

def related_links(row, all_rows):
    cat=row['category']; url=row['proposed_url']
    rel=[r for r in all_rows if r['proposed_url']!=url and r['category']==cat][:6]
    if len(rel)<4: rel += [r for r in all_rows if r['proposed_url']!=url and r['calculator_or_content']=='calculator'][:6-len(rel)]
    return ''.join(f'<a href="{r["proposed_url"]}">{html.escape(slug_title(r["proposed_url"]))}</a>' for r in rel[:6])

def top_calcs(rows, cat=None, limit=9):
    pool=[r for r in rows if r['calculator_or_content']=='calculator' and (cat is None or r['category']==cat)]
    return pool[:limit]

def card_grid(rows):
    return '<div class="grid">' + ''.join(f'<article class="card"><span class="badge">{html.escape(r["category"].title())}</span><h3><a href="{r["proposed_url"]}">{html.escape(slug_title(r["proposed_url"]))}</a></h3><p>{html.escape(r["primary_intent"])}</p></article>' for r in rows) + '</div>'

def faq_schema(title, faqs):
    data={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]}
    return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>'

def page_schema(row):
    data={"@context":"https://schema.org","@type":"WebPage","@id":canonical(row['proposed_url'])+'#webpage',"url":canonical(row['proposed_url']),"name":slug_title(row['proposed_url']),"isPartOf":{"@id":BASE+'/#website'}}
    return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>'

def head(row, desc):
    title = slug_title(row['proposed_url']) + ' | AfterTaxTool'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{canonical(row['proposed_url'])}"><meta property="og:type" content="website"><meta property="og:site_name" content="AfterTaxTool"><meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:url" content="{canonical(row['proposed_url'])}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="{html.escape(title)}"><meta name="twitter:description" content="{html.escape(desc)}"><link rel="stylesheet" href="/assets/v2.css">{page_schema(row)}</head><body>'''

def header():
    return '''<header class="site-header"><nav class="nav"><a class="brand" href="/">AfterTaxTool</a><div class="nav-links"><a href="/pay-tax/">Pay & tax</a><a href="/household-money/">Household money</a><a href="/borrowing-debt/">Borrowing & debt</a><a href="/saving/">Saving</a><a href="/work-money/">Work money</a><a href="/guides/">Guides</a><a href="/methodology.html">Methodology</a></div></nav></header>'''

def footer():
    return '''<footer class="footer"><div class="wrap"><p><strong>AfterTaxTool</strong> provides educational calculators and planning estimates. It does not provide financial, tax, pension, investment, legal or debt advice.</p><p><a href="/about.html">About</a> · <a href="/editorial-standards.html">Editorial standards</a> · <a href="/tax-assumptions.html">Tax assumptions</a> · <a href="/privacy-policy.html">Privacy</a></p></div></footer><script src="/assets/v2-calculators.js"></script></body></html>'''

def render_home(row, rows):
    desc='Free calculators for your pay, tax and everyday money. Estimate take-home pay, tax, repayments, savings goals, budgets and work-money decisions.'
    cats=''.join(f'<article class="card"><h3><a href="{category_slug(k)}">{html.escape(v[0])}</a></h3><p>{html.escape(v[1])}</p></article>' for k,v in CATEGORIES.items() if k not in {'CORE','TRUST / METHODOLOGY','GUIDES'})
    return head(row,desc)+header()+f'''<main><section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">Free calculator platform</p><h1>Free calculators for your pay, tax and everyday money</h1><p class="lede">Use AfterTaxTool to estimate take-home pay, income tax, deductions, repayments, savings goals, household budgets and work-related money decisions. Results are practical estimates, not advice or exact statements.</p><div class="link-row"><a class="button" href="/pay-tax/take-home-pay-calculator/">Start with take-home pay</a><a href="/planning-calculators.html">Browse all calculators</a></div></div><div>{card_grid(top_calcs(rows, None, 4))}</div></div></section><section class="section"><div class="wrap"><h2>Choose a calculator category</h2><div class="grid">{cats}</div></div></section><section class="section"><div class="wrap"><h2>Popular calculators</h2>{card_grid(top_calcs(rows,None,9))}</div></section><section class="section"><div class="wrap grid two"><div><h2>How to use these estimates</h2><p>Most calculators ask for simple inputs, then show the result alongside assumptions and practical interpretation. Tax and payroll tools use published thresholds where possible and explain limitations clearly.</p><p><a href="/methodology.html">Read the methodology</a> or <a href="/tax-assumptions.html">check the tax assumptions</a>.</p></div><div class="portfolio"><h2>Part of a practical finance toolkit</h2><p>For deeper salary intelligence use <a href="https://salarydecoded.com/">SalaryDecoded</a>. For credit readiness use <a href="https://creditroadmap.co.uk/roadmap.html">CreditRoadmap</a>. Cross-site links are used only where they continue the task.</p></div></div></section></main>'''+footer()

def render_category(row, rows):
    title=slug_title(row['proposed_url']); desc=f'{title} from AfterTaxTool: calculator-led tools and guides for practical money decisions.'
    items=[r for r in rows if r['category']==row['category'] and r['proposed_url']!=row['proposed_url']]
    if row['proposed_url']=='/guides/': items=[r for r in rows if r['calculator_or_content']=='content' and r['page_type']!='category hub']
    return head(row,desc)+header()+f'''<main><section class="section"><div class="wrap"><p class="breadcrumb"><a href="/">Home</a> / {html.escape(title)}</p><h1>{html.escape(title)}</h1><p class="lede">{html.escape(row['primary_intent'])}. Choose a focused calculator or guide, then follow related links only where they help the next decision.</p>{card_grid(items)}<div class="note"><strong>Assumptions matter.</strong> Calculator outputs are estimates. Review <a href="/methodology.html">methodology</a> and <a href="/tax-assumptions.html">tax assumptions</a> before relying on an output.</div></div></section></main>'''+footer()

def render_calculator(row, rows):
    title=slug_title(row['proposed_url'])
    desc=excerpt(f'{title} from AfterTaxTool. {row["primary_intent"]}. Includes inputs, results, assumptions, examples and related calculators.')
    faqs=[
        (f'What does the {title} do?', f'It provides an educational estimate for {row["primary_intent"].lower()} using the inputs and assumptions shown on the page.'),
        ('Is this financial advice?','No. AfterTaxTool provides calculators and educational explanations, not financial, tax, pension, investment, legal or debt advice.'),
        ('Why might the result differ from a real statement?','Real pay, bills and repayments can include timing differences, provider rules, tax codes, fees, local rules and personal circumstances.')]
    related=related_links(row,rows)
    portfolio=''
    if 'BORROWING' in row['category'] or 'credit' in row['notes'].lower():
        portfolio='<div class="portfolio"><h3>Related credit readiness step</h3><p>If this calculation relates to borrowing readiness, CreditRoadmap can help UK users think through credit preparation. <a href="https://creditroadmap.co.uk/roadmap.html">Build a credit roadmap</a>.</p></div>'
    elif 'WORK MONEY' in row['category'] and any(w in row['proposed_url'] for w in ['commute','job','overtime']):
        portfolio='<div class="portfolio"><h3>Related work-value context</h3><p>If time, commute or work-life trade-offs matter as much as money, use the result as one part of the decision rather than the whole answer.</p></div>'
    body=f'''<main><section class="section"><div class="wrap"><p class="breadcrumb"><a href="/">Home</a> / <a href="{category_slug(row['category'])}">{html.escape(CATEGORIES.get(row['category'],('Guides',''))[0])}</a> / {html.escape(title)}</p><h1>{html.escape(title)}</h1><p class="lede">{html.escape(row['primary_intent'])}. Enter simple figures below to get a practical estimate, then use the explanation and assumptions to understand what the result can and cannot tell you.</p><div class="grid two"><div>{calc_form(row)}</div><div class="card"><h2>Direct answer</h2><p>This calculator is designed for quick planning rather than exact advice. It turns your inputs into a clear estimate and highlights the assumption most likely to affect the result.</p><h3>Best used for</h3><ul><li>Comparing options before making a decision.</li><li>Checking monthly or annual impact.</li><li>Understanding the direction and scale of a money change.</li></ul></div></div></div></section><section class="section"><div class="wrap grid two"><div><h2>Worked example</h2><table><tr><th>Input</th><th>Example</th></tr><tr><td>Main amount</td><td>&pound;50,000 or USD 50,000 depending on region</td></tr><tr><td>Rate or deduction</td><td>5%</td></tr><tr><td>Planning period</td><td>12 months</td></tr></table></div><div><h2>How to interpret the result</h2><table><tr><th>Result</th><th>Use</th></tr><tr><td>Main estimate</td><td>Understand the approximate financial effect.</td></tr><tr><td>Monthly equivalent</td><td>Compare against budget and bills.</td></tr><tr><td>Assumption note</td><td>Check whether your real situation may differ.</td></tr></table></div></div></section><section class="section"><div class="wrap"><h2>Assumptions and methodology</h2><p>Where tax or payroll rules are involved, AfterTaxTool uses transparent assumptions and explains limitations. See <a href="/methodology.html">methodology</a> and <a href="/tax-assumptions.html">tax assumptions</a>.</p>{portfolio}<h2>Related calculators</h2><div class="link-row">{related}</div></div></section><section class="section"><div class="wrap"><h2>FAQ</h2>{''.join(f'<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>' for q,a in faqs)}</div></section></main>'''
    return head(row,desc)+faq_schema(title,faqs)+header()+body+footer()

def render_support(row, rows):
    title=slug_title(row['proposed_url'])
    desc=excerpt(f'{title}: {row["primary_intent"]}. Practical AfterTaxTool guidance with calculator routes, methodology and assumptions.')
    rel=related_links(row,rows)
    faqs=[('What is this page for?', 'It explains the topic in plain English and routes you to the most relevant calculators.'),('Is this advice?', 'No. It is educational guidance and calculator context only.'),('Where are assumptions explained?', 'Use the methodology and tax assumptions pages linked from this page.')]
    body = '<main>'
    body += f'<section class="section"><div class="wrap"><p class="breadcrumb"><a href="/">Home</a> / <a href="{category_slug(row["category"])}">{html.escape(CATEGORIES.get(row["category"],("Guides",))[0])}</a> / {html.escape(title)}</p><h1>{html.escape(title)}</h1><p class="lede">{html.escape(row["primary_intent"])}. This page supports calculator use with practical context, assumptions and next-step routing.</p></div></section>'
    body += f'<section class="section"><div class="wrap grid two"><article><h2>Direct answer</h2><p>{html.escape(title)} is most useful when you need to connect a headline figure to real monthly decisions. Start with a calculator where possible, then use this guide to understand assumptions, limits and next steps.</p><h2>What to check</h2><ul><li>The amount, rate or salary used in the calculation.</li><li>Whether the estimate is monthly, annual or one-off.</li><li>Which deductions, fees or assumptions are included.</li></ul></article><aside class="card"><h2>Useful next calculators</h2><div class="link-row">{rel}</div></aside></div></section>'
    body += '<section class="section"><div class="wrap grid two"><div><h2>Example comparison</h2><table><tr><th>Question</th><th>Calculator-led route</th></tr><tr><td>What changes my take-home pay?</td><td><a href="/pay-tax/take-home-pay-calculator/">Take-home pay calculator</a></td></tr><tr><td>Can I afford the monthly cost?</td><td><a href="/household-money/household-budget-calculator/">Household budget calculator</a></td></tr></table></div><div><h2>Limits</h2><table><tr><th>Estimate</th><th>Why it may differ</th></tr><tr><td>Tax or payroll</td><td>Tax code, state rules, benefits, timing and deductions.</td></tr><tr><td>Repayments</td><td>Fees, lender method, rate changes and product terms.</td></tr></table></div></div></section>'
    body += '<section class="section"><div class="wrap"><h2>FAQ</h2>' + ''.join(f'<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>' for q,a in faqs) + '</div></section></main>'
    return head(row,desc)+faq_schema(title,faqs)+header()+body+footer()

def render_page(row, rows):
    if row['proposed_url']=='/':
        return render_home(row,rows)
    if row['page_type'] in {'category hub','guide hub'}:
        return render_category(row,rows)
    if row['calculator_or_content']=='calculator':
        return render_calculator(row,rows)
    return render_support(row,rows)

def render_redirect_page(source_path, destination_url):
    dest = destination_url if destination_url.startswith('https://') else BASE + destination_url
    title = 'Page moved | AfterTaxTool'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><meta name="description" content="This AfterTaxTool page has moved to a newer calculator or guide."><link rel="canonical" href="{html.escape(dest)}"><meta http-equiv="refresh" content="0; url={html.escape(destination_url)}"><link rel="stylesheet" href="/assets/v2.css"></head><body>{header()}<main><section class="section"><div class="wrap"><p class="breadcrumb"><a href="/">Home</a> / Page moved</p><h1>Page moved</h1><p class="lede">This older AfterTaxTool page now has a clearer V2 destination.</p><p><a class="button" href="{html.escape(destination_url)}">Continue to the current page</a></p></div></section></main>{footer()}'''

def build():
    BUILD.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    rows=read_csv(DOCS/'att-v2-final-url-inventory.csv')
    (ASSETS/'v2.css').write_text(css_text(),encoding='utf-8')
    (ASSETS/'v2-calculators.js').write_text(js_text(),encoding='utf-8')
    if (ROOT/'favicon.ico').exists():
        shutil.copy2(ROOT/'favicon.ico', BUILD/'favicon.ico')
    for row in rows:
        out=local_path(row['proposed_url'])
        out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(render_page(row,rows),encoding='utf-8')
    sitemap=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for row in rows:
        sitemap.append(f'  <url><loc>{canonical(row["proposed_url"])}</loc></url>')
    sitemap.append('</urlset>')
    (BUILD/'sitemap.xml').write_text('\n'.join(sitemap),encoding='utf-8')
    (BUILD/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://aftertaxtool.com/sitemap.xml\n',encoding='utf-8')
    redirects=read_csv(DOCS/'att-v2-redirect-map.csv')
    removals=read_csv(DOCS/'att-v2-removal-manifest.csv')
    for redirect in redirects:
        source=BUILD/redirect['current_path']
        source.parent.mkdir(parents=True,exist_ok=True)
        source.write_text(render_redirect_page(redirect['current_path'], redirect['destination_url']),encoding='utf-8')
    (BUILD/'redirects.json').write_text(json.dumps(redirects,indent=2),encoding='utf-8')
    summary={'v2_canonical_count':len(rows),'calculator_count':sum(1 for r in rows if r['calculator_or_content']=='calculator'),'supporting_count':sum(1 for r in rows if r['calculator_or_content']!='calculator'),'redirect_count':len(redirects),'removal_count':len(removals),'build_path':str(BUILD)}
    (DOCS/'att-v2-build-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':
    build()



