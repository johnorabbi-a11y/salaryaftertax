import csv, io, json, re, zipfile
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
EXPORT=Path(r'C:\Users\johno\Downloads\aftertaxtool.com-Performance-on-Search-2026-09-02.zip')
BASE='https://aftertaxtool.com/'

KEEP_C=set('''
best-states-for-take-home-pay.html
bonus-vs-pay-rise.html
bonus-vs-salary-after-tax.html
child-benefit-tax-charge-explained.html
commuting-cost-vs-salary-increase.html
company-car-tax-explained.html
company-car-vs-car-allowance.html
company-car-vs-higher-salary.html
compare-salary-after-tax.html
contractor-vs-salaried-income.html
deposit-saving-calculator.html
emergency-tax-explained
emergency-tax-explained.html
employee-tax-deductions-explained.html
employer-benefits-tax-impact.html
employer-pension-contribution-explained.html
employer-pension-vs-pay-rise.html
federal-tax-withholding-explained.html
health-insurance-vs-higher-salary.html
high-income-by-state.html
high-income-cost-of-living-comparison.html
high-income-salary-after-tax.html
high-income-tax-explained.html
high-income-tax-planning-guide.html
high-salary-budgeting.html
higher-salary-vs-better-benefits.html
higher-salary-vs-shorter-commute.html
hourly-to-salary-us.html
hourly-to-salary.html
how-much-more-salary-is-worth-changing-jobs.html
how-much-of-a-raise-do-you-keep-after-tax.html
how-overtime-is-taxed-uk.html
how-pension-contributions-affect-take-home-pay.html
how-state-income-tax-affects-paychecks.html
how-take-home-pay-is-calculated.html
how-tax-bands-affect-pay-rises.html
how-to-compare-two-job-offers-after-tax.html
job-offer-checklist-after-tax.html
job-offer-take-home-pay-checklist.html
marriage-allowance-explained.html
minimum-wage-uk-salary.html
national-insurance-explained.html
national-insurance-rates.html
new-job-salary-after-tax-guide.html
overtime-tax-explained.html
paycheck-explainer-center.html
payroll-and-benefits-taxation.html
payroll-deduction-guides.html
payroll-deductions-vs-take-home-pay.html
payroll-tax-explained.html
payslip-explained.html
pension-and-benefits-planning.html
pension-contribution-vs-take-home-pay.html
pension-deductions-explained.html
pension-salary-sacrifice-explained.html
private-health-insurance-value.html
remote-job-vs-higher-salary.html
rsu-and-stock-compensation-tax.html
salary-after-tax-faq.html
student-loan-deductions-explained.html
taxable-benefits-explained.html
understanding-your-compensation-package.html
understanding-your-paycheck.html
understanding-your-payslip.html
understanding-paycheck-deductions.html
what-are-payroll-deductions.html
what-is-fica-tax.html
what-is-total-compensation.html
why-a-pay-rise-feels-smaller-than-expected.html
why-bonuses-are-taxed-differently.html
why-more-money-doesnt-always-mean-more-spending-power.html
why-salary-after-tax-differs-by-state.html
'''.split())

EXPLICIT_REDIRECTS={
 'salary-increase-calculator.html':'/pay-tax/pay-rise-calculator/',
 'pay-rise-calculator.html':'/pay-tax/pay-rise-calculator/',
 'raise-after-tax-calculator.html':'/pay-tax/raise-after-tax-calculator/',
 'salary-increase-after-tax.html':'/pay-tax/pay-rise-calculator/',
 'bonus-tax-impact-calculator.html':'/pay-tax/bonus-tax-calculator/',
 'bonus-vs-salary-increase-calculator.html':'/work-money/bonus-vs-salary-increase-calculator/',
 'pension-vs-salary-calculator.html':'/pay-tax/pension-contribution-calculator/',
 'salary-sacrifice-impact-calculator.html':'/pay-tax/salary-sacrifice-calculator/',
 'paycheck-deductions-calculator.html':'/pay-tax/take-home-pay-calculator/',
 'payroll-deduction-calculator.html':'/pay-tax/take-home-pay-calculator/',
 'mortgage-affordability-calculator.html':'/borrowing-debt/mortgage-payment-calculator/',
 'affordability-calculator.html':'/household-money/rent-affordability-calculator/',
 'job-offer-calculator.html':'/work-money/job-offer-calculator/',
 'job-offer-after-tax-calculator.html':'/work-money/job-offer-calculator/',
 'salary-change-calculator.html':'/work-money/job-change-break-even-calculator/',
 'salary-change-affordability-calculator.html':'/work-money/salary-change-affordability-calculator/',
 'total-compensation-calculator.html':'/work-money/total-compensation-calculator/',
 'benefits-vs-salary-calculator.html':'/work-money/benefits-vs-salary-calculator/',
 'employer-pension-value-calculator.html':'/work-money/employer-pension-value-calculator/',
 'debt-to-income-calculator.html':'/borrowing-debt/debt-to-income-calculator/',
 'emergency-fund-calculator.html':'/saving/emergency-fund-calculator/',
 'rent-affordability-calculator.html':'/household-money/rent-affordability-calculator/',
}

def norm_url(u):
    return u.replace('https://www.aftertaxtool.com/','https://aftertaxtool.com/').rstrip('/')+'/' if u.rstrip('/')=='https://aftertaxtool.com' else u.replace('https://www.aftertaxtool.com/','https://aftertaxtool.com/')

def path_from_url(u):
    u=norm_url(u)
    return 'index.html' if u.rstrip('/')=='https://aftertaxtool.com' else u.replace(BASE,'')

def read_csv(p):
    with open(p,encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
def write_csv(p,rows,fields=None):
    fields=fields or list(rows[0].keys())
    with open(p,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore'); w.writeheader(); w.writerows(rows)

with zipfile.ZipFile(EXPORT) as z:
    pages=list(csv.DictReader(io.StringIO(z.read('Pages.csv').decode('utf-8-sig'))))

gsc=[]
for r in pages:
    u=r['Top pages']; clicks=int(r['Clicks']); imps=int(r['Impressions']); pos=float(r['Position'])
    gsc.append({'gsc_url':u,'normalized_url':norm_url(u),'current_path':path_from_url(u),'clicks':clicks,'impressions':imps,'ctr':r['CTR'],'position':pos,'mandatory_human_review':'YES' if clicks>0 else 'NO'})
gsc_by_path={r['current_path']:r for r in gsc}

inv=read_csv(DOCS/'att-v2-final-url-inventory.csv')
revised=[]; rejected=[]
for r in inv:
    path='index.html' if r['proposed_url']=='/' else r['proposed_url'].lstrip('/')
    keep=True; reason='Retained.'
    if r['priority']=='C':
        if path in KEEP_C:
            keep=True; reason='Retained after support inventory review: clear standalone educational/calculator-adjacent intent.'
        else:
            keep=False; reason='Removed from V2 proposed inventory: weak standalone intent, salary-lattice overlap, duplicated old calculator route, or better handled inside a hub/calculator.'
    if keep:
        r['notes']=(r.get('notes','')+' Quality-review status: retained.').strip()
        revised.append(r)
    else:
        r['rejection_reason']=reason
        rejected.append(r)

v2_paths={('index.html' if r['proposed_url']=='/' else r['proposed_url'].lstrip('/')) for r in revised}
manifest=read_csv(DOCS/'att-v2-url-disposition-manifest.csv')
updated=[]
for r in manifest:
    p=r['current_path']
    if p in gsc_by_path:
        e=gsc_by_path[p]
        r['historical_value_risk']='High' if e['clicks']>0 else max(r['historical_value_risk'],'Medium')
        r['notes']=(r.get('notes','')+f" GSC 2026-09-02 evidence: clicks={e['clicks']}, impressions={e['impressions']}, position={e['position']}, source_url={e['gsc_url']}. {'Mandatory human-review exception due to historical clicks.' if e['clicks']>0 else 'Visible in Pages report but no clicks.'}").strip()
    if p not in v2_paths and r['disposition'] in {'KEEP','REPURPOSE'}:
        if p in EXPLICIT_REDIRECTS:
            r['disposition']='REDIRECT'; r['destination_url']=EXPLICIT_REDIRECTS[p]; r['destination_status']='substantial-equivalent'; r['reason']='Removed as a standalone V2 URL; legacy calculator has a materially equivalent V2 destination.'
        elif re.match(r'^\d',p) or 'salary-after-tax-' in p:
            r['disposition']='REMOVE'; r['destination_url']=''; r['destination_status']='no-equivalent-replacement'; r['reason']='Removed from revised V2 inventory after quality review; salary-number intent belongs on SalaryDecoded unless manually protected.'
        else:
            r['disposition']='CONSOLIDATE'; r['destination_url']='/guides/'; r['destination_status']='content-review-required'; r['reason']='Removed from revised V2 inventory after quality review; useful points should be folded into stronger V2 hubs/calculators if needed.'
    elif p in EXPLICIT_REDIRECTS and p not in v2_paths:
        r['disposition']='REDIRECT'; r['destination_url']=EXPLICIT_REDIRECTS[p]; r['destination_status']='substantial-equivalent'; r['reason']='Legacy calculator has a materially equivalent V2 destination.'
    updated.append(r)

write_csv(DOCS/'att-v2-final-url-inventory.csv',revised)
write_csv(DOCS/'att-v2-rejected-url-inventory.csv',rejected)
write_csv(DOCS/'att-v2-gsc-historical-overlay.csv',gsc,['gsc_url','normalized_url','current_path','clicks','impressions','ctr','position','mandatory_human_review'])
write_csv(DOCS/'att-v2-url-disposition-manifest.csv',updated)
redirects=[r for r in updated if r['disposition']=='REDIRECT']
removals=[]
for r in updated:
    if r['disposition']=='REMOVE':
        x=dict(r); x['recommended_http_status']='410 if hosting supports deliberate gone responses cleanly; otherwise 404 is acceptable for removed static pages'; removals.append(x)
write_csv(DOCS/'att-v2-redirect-map.csv',redirects,['current_url','current_path','destination_url','destination_status','reason','historical_value_risk','portfolio_overlap','notes'])
write_csv(DOCS/'att-v2-removal-manifest.csv',removals,['current_url','current_path','current_page_family','current_primary_intent','reason','historical_value_risk','portfolio_overlap','notes','recommended_http_status'])

counts=Counter(r['disposition'] for r in updated); calc_count=sum(1 for r in revised if r['calculator_or_content']=='calculator'); support=len(revised)-calc_count
clicked=[r for r in gsc if r['clicks']>0 and r['current_path']!='index.html']
zero=[r for r in gsc if r['clicks']==0]
flag_lines=['# AfterTaxTool V2 Human Review Flags','','Updated with GSC export: `aftertaxtool.com-Performance-on-Search-2026-09-02.zip`.','','## Mandatory GSC Click Exceptions','']
for e in clicked:
    m=next((r for r in updated if r['current_path']==e['current_path']),None)
    flag_lines.append(f"- `{e['current_path']}`: {e['clicks']} clicks, {e['impressions']} impressions, avg position {e['position']}. Current Phase 0 disposition: **{m['disposition'] if m else 'not matched'}**. Recommendation: human review required; do not automatically keep on ATT V2 because the intent is still old programmatic salary content unless a non-duplicative V2 role or exact SalaryDecoded handoff is approved.")
flag_lines += ['','## Zero-Click Visible Page Tests','']
for e in zero:
    m=next((r for r in updated if r['current_path']==e['current_path']),None)
    flag_lines.append(f"- `{e['current_path']}`: {e['impressions']} impression, avg position {e['position']}. Current Phase 0 disposition: **{m['disposition'] if m else 'not matched'}**.")
flag_lines += ['','## Other Human-Review Groups','', '- Any URL with external links, assisted conversions, or non-GSC historical value should be manually protected before implementation.', '- State hub consolidation remains a human-review item.', '- Numeric salary URLs should not be mass redirected to generic ATT calculators.']
(DOCS/'att-v2-human-review-flags.md').write_text('\n'.join(flag_lines),encoding='utf-8')

report=f'''# AfterTaxTool V2 Phase 0 Final Report

## Executive Summary

Phase 0 has now been overlaid with GSC historical-value evidence from `aftertaxtool.com-Performance-on-Search-2026-09-02.zip` and the proposed V2 inventory has been quality-reviewed.

No live pages, canonicals, robots rules, redirects, sitemap files or calculator logic were changed.

## Existing Canonical URL Count

- Existing canonical sitemap URLs: **{len(updated):,}**

## Exact Disposition Counts After GSC Overlay

- KEEP: **{counts['KEEP']:,}**
- REPURPOSE: **{counts['REPURPOSE']:,}**
- CONSOLIDATE: **{counts['CONSOLIDATE']:,}**
- REDIRECT: **{counts['REDIRECT']:,}**
- REMOVE: **{counts['REMOVE']:,}**

## Revised Proposed V2 Inventory

- Proposed V2 canonical URLs after quality review: **{len(revised):,}**
- Launch calculators: **{calc_count:,}**
- Supporting guides, hubs, examples and trust pages: **{support:,}**
- Removed from proposed inventory during quality review: **{len(rejected):,}**

The 160-220 URL range remains a guideline, not a quota. The revised inventory is smaller because weak salary-overlap pages, duplicated calculator routes and route-hub remnants were pruned.

## GSC Historical Overlay

Pages visible in the export: **{len(gsc)}**.
Pages with clicks: **{sum(1 for r in gsc if r['clicks']>0)}**.
Deep URLs with clicks: **{len(clicked)}**.

### Clicked Deep URLs

'''
for e in clicked:
    m=next((r for r in updated if r['current_path']==e['current_path']),{})
    report += f"- `{e['current_path']}`: {e['clicks']} clicks, {e['impressions']} impressions, avg position {e['position']}; disposition **{m.get('disposition','not matched')}**. Intent review: old programmatic salary/pay-period content. Mandatory human-review exception, but not an automatic KEEP because SalaryDecoded owns scalable salary depth.\n"
report += '''
## Quality Review Findings

Removed/rejected support candidates include numeric salary examples, salary-band guide remnants, most “is X a good salary” pages, duplicated old calculator URLs, and old ecosystem hub pages that would be better consolidated into V2 category hubs or calculator pages.

The remaining support inventory is focused on payroll, deductions, tax explanation, work-money decisions, borrowing arithmetic, household money and trust context.

## Redirect Position

Redirects remain conservative. A redirect is recommended only where the old URL has a substantial V2 equivalent. Do not redirect old salary-number URLs to the homepage or generic calculator pages.

## Migration Safety Verdict

After the GSC overlay and inventory-quality review, ATT V2 is **closer to implementation but still requires human approval before live migration**. The plan is deterministic, but clicked deep salary URLs and any externally linked URLs must be reviewed before deletion/removal.

## Recommended Next Step

Build a V2 implementation branch from the revised inventory. Before deleting legacy pages, overlay backlink data and any longer-range GSC exports so historically valuable salary URLs can be protected, redirected to exact equivalents, or deliberately retired with eyes open.
'''
(DOCS/'att-v2-phase0-final-report.md').write_text(report,encoding='utf-8')

summary={'gsc_export':'aftertaxtool.com-Performance-on-Search-2026-09-02.zip','gsc_pages_visible':len(gsc),'gsc_clicked_pages':sum(1 for r in gsc if r['clicks']>0),'gsc_clicked_deep_urls':[r for r in clicked],'revised_proposed_v2_canonical_count':len(revised),'launch_calculator_count':calc_count,'supporting_url_count':support,'rejected_from_previous_inventory':len(rejected),'disposition_counts_after_overlay':dict(counts),'redirect_count':len(redirects),'removal_count':len(removals)}
(DOCS/'att-v2-gsc-overlay-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
