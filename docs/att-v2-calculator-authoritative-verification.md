# AfterTaxTool V2 Calculator Authoritative Verification

Date: 2026-09-02
Scope: isolated V2 build only. No deployment, push, merge, production replacement, sitemap submission or indexing action was performed.

## Summary

Calculators reviewed: 46/46

- READY: 25
- READY_AS_ESTIMATE: 21
- REMOVE_FROM_LAUNCH: 0
- BLOCKED: 0

The full 46-calculator launch set is defensible for production as calculator-led educational tooling, provided the rule-dependent and specialist calculators remain visibly framed as estimates. No calculator required removal from the V2 launch inventory after correction.

## Errors Discovered

1. Several specific calculators were being classified as generic or take-home calculators because the build generator matched broad intent wording before URL-specific calculator names.
2. Student-loan repayment was using generic loan inputs rather than plan thresholds.
3. Credit-utilisation was being treated as debt-payoff.
4. Balance-transfer was being treated as debt-payoff.
5. Statutory employment calculators used generic salary/take-home inputs, which was not defensible for pages named sick pay, maternity pay, paternity pay, redundancy pay and holiday pay.
6. The UK personal allowance taper above GBP 100,000 was missing from the take-home/income-tax model.
7. The US payroll model used older federal tax constants before this verification pass.
8. Calculator buttons previously required a fragile submit path; the direct button click now runs the calculator as well.

## Errors Corrected

- URL-first calculator type detection added in the build generator.
- Student-loan calculator now supports Plan 1, Plan 2, Plan 4, Plan 5 and postgraduate loan thresholds.
- Credit-utilisation calculator now calculates balance divided by credit limit.
- Balance-transfer calculator now calculates transfer fee, balance plus fee and months at entered payment.
- SSP, SMP, SPP, redundancy and holiday-pay calculators now use more relevant inputs and visibly explain their simplified statutory scope.
- UK personal allowance taper above GBP 100,000 added.
- US federal single-filer 2026 brackets, 2026 standard deduction and FICA wage-base handling added.
- Static rule-period notes added to all 46 calculator panels.
- `favicon.ico` retained in the isolated V2 build.

## Current Tax / Rule Years Implemented

- UK Income Tax: 2026/27 England, Wales and Northern Ireland assumptions.
- UK employee National Insurance: 2026/27 category A employee assumptions.
- UK student loans: 2026/27 Plan 1, Plan 2, Plan 4, Plan 5 and postgraduate thresholds.
- UK SSP/SMP/SPP: 2026/27 statutory weekly-rate assumptions.
- UK statutory redundancy: 2026/27 weekly-pay cap assumption.
- US federal income tax: 2026 single-filer federal brackets and standard deduction.
- US FICA: 2026 Social Security wage base with Medicare and Additional Medicare estimate.
- Pure mathematical calculators: no fixed rule year; formulas use user-entered amounts, rates and periods.

## Authoritative Sources Used

- GOV.UK Income Tax rates and Personal Allowances: https://www.gov.uk/income-tax-rates
- GOV.UK employer rates and thresholds for 2026/27: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
- GOV.UK student loan repayment rules: https://www.gov.uk/repaying-your-student-loan/what-you-pay
- GOV.UK Statutory Sick Pay: https://www.gov.uk/statutory-sick-pay
- GOV.UK Statutory Maternity Pay: https://www.gov.uk/maternity-pay-leave/pay
- GOV.UK Statutory Paternity Pay: https://www.gov.uk/paternity-pay-leave/pay
- GOV.UK statutory redundancy calculator guidance: https://www.gov.uk/calculate-your-redundancy-pay
- GOV.UK holiday pay basics: https://www.gov.uk/holiday-entitlement-rights/holiday-pay-the-basics
- IRS 2026 tax inflation adjustments: https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026
- Social Security Administration 2026 contribution and benefit base: https://www.ssa.gov/news/press/releases/2025/#10-2025-2

## Independent Test Coverage

Representative independent expected-result tests were run before accepting implementation output:

- UK income-tax zero/threshold case at GBP 12,570.
- UK basic/higher-band ordinary case at GBP 50,000.
- UK personal allowance taper case at GBP 125,140.
- UK employee NI threshold/band case at GBP 50,270.
- UK student loan Plan 2 at threshold and GBP 10,000 over threshold.
- US 2026 federal/FICA single-filer salary case.
- Mortgage amortisation.
- Compound-interest projection.
- Credit-utilisation ratio.
- Balance-transfer fee.
- SSP estimate.
- SMP estimate.
- SPP estimate.
- Statutory redundancy simplified estimate.
- Holiday-pay working-day estimate.

Result: 16/16 representative expected-result tests passed.

## Production Status Matrix

The full CSV matrix is available at:

`docs/att-v2-calculator-authoritative-verification.csv`

Status summary:

- 25 calculators are READY because they are pure mathematical tools or standard arithmetic projections.
- 21 calculators are READY_AS_ESTIMATE because they rely on statutory, payroll, tax, employment, lender or decision assumptions and are now visibly limited.
- 0 calculators are marked REMOVE_FROM_LAUNCH.
- 0 calculators are marked BLOCKED.

## Annual Update Requirements

Annual tax-year review:

- UK salary after tax
- UK salary tax
- UK take-home pay
- income tax
- National Insurance
- student loan repayment
- bonus tax
- overtime tax
- pension contribution payroll impact
- salary sacrifice
- inside/outside IR35 estimate
- SSP
- SMP
- SPP
- redundancy pay

Occasional regulatory or product review:

- APR
- credit utilisation
- balance transfer
- mortgage repayment
- loan repayment
- debt payoff
- ISA contribution
- pension growth

No statutory update beyond formula/UX review:

- compound interest
- savings goal
- regular savings
- emergency fund
- household budget
- fuel cost
- commute cost
- day-rate conversion
- job-change break-even
- cost-of-living scenarios

## Final Counts

- Final canonical count: 124
- Final sitemap count: 124
- Calculator count: 46
- Redirect count: 22
- Removal count: 24,766

## Final QA Status

Full isolated V2 QA:

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

Browser/visual calculator smoke test:

```json
{
  "representativePages": 20,
  "calculatorPages": 46,
  "visualIssueCount": 0,
  "calcIssueCount": 0,
  "consoleIssueCount": 0,
  "assetIssueCount": 0
}
```

JavaScript syntax check: PASS.

Independent expected-result tests: PASS, 16/16.

READY FOR PRODUCTION MIGRATION
