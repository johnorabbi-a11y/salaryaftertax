# AfterTaxTool Current State

Generated: 2026-08-29T09:54:38.519Z

## Inventory

- HTML/indexable files found locally: 25044
- Sitemap URLs: 25042
- Unique sitemap URLs: 25042
- Robots: User-agent: * / Allow: / /  / Sitemap: https://aftertaxtool.com/sitemap.xml
- Noindex pages found by static scan: 0

## Route Families

- state annual salary: 8224
- state weekly salary: 7838
- state monthly salary: 7837
- monthly salary: 381
- weekly salary: 381
- other: 129
- calculator/decision/support: 99
- annual salary: 60
- state hub: 55
- authority/trust/guide: 33
- core hub: 6
- homepage: 1

## Crawl Graph

- Reachable from homepage: 25042
- Unreachable routes: 2
- Average depth: 4.04
- Median depth: 4
- P95 depth: 5
- Maximum depth: 8

## Architecture Diagram

```
/ homepage
  -> salary-after-tax-us.html
      -> salary-after-tax-by-state.html
          -> 50 state hubs
              -> state annual salary pages
              -> state monthly salary pages
              -> state weekly salary pages
  -> salary-after-tax-uk.html / take-home-pay-uk.html
      -> UK salary, monthly, weekly and hourly pages
  -> planning-calculators.html / salary-guides.html
      -> salary increase, job offer, comparison, benefits and payroll ecosystems
  -> methodology.html / tax-assumptions.html / editorial-standards.html
```

## Interpretation

The site is technically exposed: the sitemap is large but valid as a classic URL set, the homepage can reach the inventory, and the route families are internally coherent. The important distinction is that technical reachability does not equal crawl demand or ranking selection. At this scale, each deep page can be reachable but still receive very little relative internal importance and very little perceived incremental value.
