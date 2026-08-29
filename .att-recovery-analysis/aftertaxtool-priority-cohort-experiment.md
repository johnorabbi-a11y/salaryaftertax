# AfterTaxTool Priority Cohort Recovery Experiment

Implementation date: 2026-08-29

## Cohort

- Exact cohort size: 152
- Tier 1 count: 33
- Tier 2 count: 84
- Tier 3 count: 35
- Control group size: 50

## Link Additions

- Homepage deep links in priority section: 24
- UK hub priority route links: 35
- US hub priority route links: 44
- State hub priority route links: 60 across California, New York, Texas, Florida and Illinois
- Authority contextual links: 43 across six support/authority pages
- Sibling navigation pages patched: 17
- Total cohort inbound-link uplift after final hub insertion: 169

## Link Metrics

- Average cohort inbound links before: 329.29
- Average cohort inbound links after: 330.40
- Average non-cohort inbound links after: 22.91
- P95 crawl depth after: 5
- Homepage-reachable canonical URLs after: 25,042
- Indexable unreachable URLs after: 0
- Known non-indexable excluded routes outside sitemap: `google045f4d6b341942cf.html`, `hourly-to-salary-UK-Us.html`

## Implementation Notes

- The first automated pass inserted the homepage, authority-page, sibling and Illinois routes.
- A follow-up insertion pass added the missing UK hub, US hub, California, New York, Texas and Florida priority sections after detecting wrapper differences.
- The compatibility route `hourly-to-salary-UK-Us.html` remains excluded from the sitemap because it canonicalises to `hourly-to-salary.html`.
- Confirmed visible encoding corruption in `salary-to-hourly.html` and homepage calculator strings was fixed as a technical defect.

## Tier Summary

| Tier | Count | Avg inbound before | Avg inbound after | Avg PageRank before | Avg PageRank after | Avg depth before | Avg depth after |
|---|---:|---:|---:|---:|---:|---:|---:|
| Tier 1 | 33 | 29.52 | 30.24 | 9.352284e-4 | 1.113230e-3 | 1.45 | 1.64 |
| Tier 2 | 84 | 575.75 | 575.94 | 1.219618e-3 | 1.250043e-3 | 1.60 | 1.79 |
| Tier 3 | 35 | 20.43 | 20.49 | 1.171243e-4 | 1.878813e-4 | 2.46 | 2.23 |

## Checkpoints

- Day 0: record GSC baseline for cohort and control URLs.
- Day 7: check fresh Googlebot crawling of cohort URLs.
- Day 14: compare cohort vs control URL Inspection samples.
- Day 28: review GSC Pages report for new cohort URL participation.
- Day 45: decide whether to continue observing, run template differentiation, or test a new flagship hub.

## Primary early measurement

Fresh Googlebot crawling of cohort URLs.

## Secondary measurements

- Indexed cohort URL count.
- Cohort URLs appearing in GSC Pages report.
- Deep URL impressions.
- Query-to-correct-page matching.
- Cohort participation compared with untouched control URLs.
