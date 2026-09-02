# AfterTaxTool V2 Proposed Architecture

## Recommended Concept

AfterTaxTool V2 should become: **Free calculators for your pay, tax and everyday money.**

It should solve distinct financial calculations rather than publish thousands of numerical variants.

## Recommended Initial Canonical Count

Recommended V2 launch size: **160-220 canonical URLs**.

This range is large enough to show a real calculator platform and small enough to avoid recreating the V1 repetition problem. If implementation discipline is high, 180-200 is the sweet spot.

## Top-Level Architecture

- `/` - calculator platform homepage
- `/pay-tax/` - income, deductions, tax and take-home calculators
- `/household-money/` - budgeting, bills, rent, cost and affordability calculators
- `/borrowing-debt/` - repayment, APR, debt payoff and mortgage calculators
- `/saving/` - savings, emergency fund, ISA and compound-interest calculators
- `/work-money/` - job-change, overtime, compensation, redundancy and pay-value calculators
- `/guides/` - evergreen explainers that support calculator interpretation
- `/methodology/` or existing `methodology.html` - calculation standards and assumptions

## URL Principle

Numbers, pay periods, terms and percentages should usually be inputs, not URLs. A separate URL should exist only when the calculation logic, assumptions, audience or decision problem is meaningfully different.
