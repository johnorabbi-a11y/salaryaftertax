# AfterTaxTool V2 Phase 0 Final Report

## Executive Summary

Phase 0 converts the V2 strategy into an executable migration planning package. No live pages, canonicals, robots rules, redirects or sitemap files were changed.

## Existing Canonical URL Count

- Existing canonical sitemap URLs: **25,042**

## Exact Disposition Counts

- KEEP: **167**
- REPURPOSE: **1**
- CONSOLIDATE: **136**
- REDIRECT: **2**
- REMOVE: **24,736**

Redirects are deliberately limited to substantial-equivalent destinations only. This avoids sending old salary-number pages to weak generic replacements.

## Proposed V2 Inventory

- Proposed V2 canonical URLs: **216**
- Launch calculators: **46**
- Supporting guides, hubs, examples and trust pages: **170**

## Old Salary Lattice Summary

```json
{
  "core_salary_hub": 7,
  "generic_salary_monthly": 381,
  "generic_salary_weekly": 381,
  "state_hub": 50,
  "uk_salary_annual": 381,
  "uk_take_home_salary": 60,
  "us_salary_annual": 156,
  "us_salary_monthly": 153,
  "us_salary_weekly": 154,
  "us_state_salary_annual": 7687,
  "us_state_salary_monthly": 7684,
  "us_state_salary_weekly": 7684
}
```

## Removal Behaviour

For retired programmatic URLs with no equivalent replacement, use **410 Gone** if the hosting/deployment layer can support it cleanly. If not, a normal **404** is acceptable for deleted static files. Do not create redirects where the destination does not substantially satisfy the old query.

## High-Risk Decisions

- Large-scale removal of the salary lattice.
- State hub consolidation.
- Any legacy URL with historical traffic, external links or unusual internal prominence.
- Any calculator that overlaps WorthMyTime, CreditRoadmap or SalaryDecoded.

## Proposed Pages Rejected for Portfolio Fit

- Large salary-number inventories belong on SalaryDecoded.
- Deep job/time-value content belongs on WorthMyTime.
- Credit readiness and adverse-credit content belongs on CreditRoadmap.
- Regulated debt, pension or investment advice should not be built on AfterTaxTool.

## Migration Safety Verdict

The migration is **not yet safe to implement directly**. It is ready for human review and then a separate V2 implementation branch. The manifest gives a deterministic plan, but human overrides are required before deleting or redirecting large URL groups.

## Recommended Implementation Sequence

1. Review the disposition manifest, redirect map and human-review flags.
2. Overlay GSC/backlink/analytics data and protect any historically valuable URLs.
3. Build the V2 branch with homepage, category hubs and calculator cohort.
4. Run the full migration QA plan.
5. Generate approved redirects only.
6. Remove retired pages and replace sitemap inventory.
7. Deploy once and observe for 30-60 days.
