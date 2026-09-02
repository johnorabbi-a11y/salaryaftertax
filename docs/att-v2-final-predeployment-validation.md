# AfterTaxTool V2 Final Pre-Deployment Validation

Date: 2026-09-02
Scope: isolated V2 build only (`att-v2-build/`). No production deployment, merge, push, sitemap submission or indexing action was performed.

## Summary Verdict

NOT READY FOR PRODUCTION MIGRATION

The V2 build is structurally strong and browser QA now passes, but final production migration should wait until the remaining statutory/employment calculator formulas receive a human rule review. This is a correctness gate, not a crawl or sitemap gate.

## Issues Found and Fixed in the Isolated Build

1. Calculator submit reliability: browser clicks reached the submit button but did not trigger results on many calculator pages. Fixed by making the button click call the calculator runner directly while preserving the form submit handler.
2. Calculator engine mutation risk: removed the prior `Object.assign(form, { elements: ... })` pattern and replaced it with a salary override argument.
3. US payroll constants: replaced older US federal/standard-deduction assumptions with labelled 2026 federal single-filer assumptions and capped FICA wage-base logic.
4. UK personal allowance taper: added the allowance taper above GBP 100,000 to the UK take-home estimate.
5. Tax-year/rule-period labelling: added static calculator-panel assumption notes and result-level rule-basis text.
6. Missing asset: copied existing `favicon.ico` into the isolated V2 build and updated the generator to preserve it.

## Visual and Console QA

PASS

Representative pages inspected at desktop and mobile widths:
- homepage
- all major category hubs
- take-home pay calculator
- income tax calculator
- National Insurance calculator
- student loan calculator
- salary sacrifice calculator
- mortgage calculator
- loan calculator
- debt calculator
- compound-interest calculator
- household/budget calculator
- one guide page
- methodology page
- privacy/trust page

Headless Chrome result:

```json
{
  "representativePages": 20,
  "calculatorPages": 46,
  "widths": [1366, 390],
  "visualIssueCount": 0,
  "calcIssueCount": 0,
  "consoleIssueCount": 0,
  "assetIssueCount": 0
}
```

No overflowing content, broken cards, bad mobile form layout, missing result panels, console errors or broken assets were detected after fixes.

## Calculator Verification

Interaction verification: PASS, 46/46 calculators individually submitted and produced visible results without `NaN`, `undefined` or `Infinity`.

Formula verification: FAIL pending human statutory review.

The generic educational formulas are now functional, labelled and bounded, but these calculators should not be production-migrated until their exact statutory/rule models are approved:

- `work-money/maternity-pay-calculator/`
- `work-money/paternity-pay-calculator/`
- `work-money/sick-pay-calculator/`
- `work-money/redundancy-pay-calculator/`
- `work-money/holiday-pay-calculator/`
- `work-money/inside-ir35-calculator/`
- `work-money/outside-ir35-calculator/`
- `pay-tax/student-loan-repayment-calculator/`
- `borrowing-debt/apr-calculator/`
- `borrowing-debt/credit-utilisation-calculator/`

These pages render and calculate, but their current simplified engines may not yet match user expectations from the page names closely enough for production.

## Tax-Year / Date Labelling

PASS for visibility; partial PASS for formula assurance.

Calculator panels now state:

> Tax-sensitive estimates use stated rule-period assumptions. UK payroll examples use 2026/27 assumptions; US examples use 2026 federal assumptions plus any state-tax input.

Result text also states the rule basis for salary/payroll outputs.

Remaining caution: statutory employment calculators need final rule-specific review before migration.

## Automated V2 QA

PASS

```json
{
  "intended_urls": 124,
  "html_files": 124,
  "sitemap_urls": 124,
  "issues": [],
  "issue_count": 0,
  "unreachable_count": 0,
  "zero_inbound_count": 0,
  "average_depth": 1.81,
  "median_depth": 2,
  "p95_depth": 2,
  "max_depth": 2,
  "external_links": 9,
  "duplicate_body_prefix_groups": 0,
  "calculator_pages": 46
}
```

JavaScript syntax check: PASS.

Static tax-assumption note check: PASS, 46/46 calculator pages include the note.

## Migration Safety Check

Current isolated package numbers:

- Final canonical URLs: 124
- Sitemap URLs: 124
- Approved redirects: 22
- Approved removals: 24,766
- Historical GSC exception URLs documented: 5/5
- Favicon present: yes

Removed numerical salary URLs are not mass redirected to unrelated calculators or the homepage.

## Historical GSC Exception Treatment

The five user-clicked GSC URLs remain documented as removal candidates unless independent evidence appears. User clarification says those clicks were from manual inspection, not organic demand.

## Deployment Plan Check

The deployment plan still needs to be one deliberate migration:

- one clean 124-URL canonical inventory
- one clean sitemap inventory
- no mixed 25k plus V2 production state
- no repeated sitemap experiments
- no deployment during this validation task

## Files Modified During Validation

- `att-v2-build/assets/v2-calculators.js`
- `att-v2-build/assets/v2.css`
- 46 calculator HTML files in `att-v2-build/` for static assumption-note insertion
- `att-v2-build/favicon.ico`
- `docs/att-v2-build-generator.py`
- `docs/att-v2-final-predeployment-validation.md`

## Unresolved Issues

Material before migration:
- final rule/formula review needed for the statutory/employment/specialist calculators listed above.

Non-material / operational:
- implementation remains in an isolated folder rather than a clean Git branch because local `.git` branch creation was previously permission-blocked.
- no production deployment has been performed.

NOT READY FOR PRODUCTION MIGRATION
