# AfterTaxTool V2 Calculator Test Report

## Coverage

- Calculator pages expected: 46
- Calculator pages found with data-calc-type: 46
- Shared calculator engine: tt-v2-build/assets/v2-calculators.js
- JavaScript syntax check: PASS via 
ode --check

## Calculator Families Implemented

- Pay/tax/take-home estimates
- Income tax and payroll deduction estimates
- Bonus, raise, pension and salary-sacrifice estimates
- Mortgage, loan and APR-style repayment estimates
- Debt payoff estimates
- Household budget and affordability estimates
- Savings, emergency fund and compound growth estimates
- Commute, fuel and work-cost estimates

## Test Scope

The automated build QA confirms every calculator page has a form and result panel. JavaScript syntax passes. Formula-level tests are implemented through the shared engine categories, but statutory examples should receive manual review before production because official tax values can change annually.

## Result

PASS for implementation build. Manual statutory review remains required before production migration.
