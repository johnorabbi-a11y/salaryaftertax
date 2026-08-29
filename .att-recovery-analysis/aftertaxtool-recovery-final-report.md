# AfterTaxTool Recovery Analysis Final Report

Generated: 2026-08-29

## Executive Verdict

No evidence from this pass supports a remaining broad technical discovery blocker. The more plausible problem is a combination of weak Google confidence in a very large numerical lattice, diluted internal importance, historical discovery/sitemap churn, and homepage-root dominance during reassessment.

The site is technically crawlable, but Google may not yet see enough incremental value or priority differentiation to spend discovery crawl budget across 25k highly patterned URLs.

## Most Likely Root Cause

**Low confidence in the large numerical/template lattice.**

Evidence:
- Local HTML inventory: 25,044 HTML files.
- Indexable sitemap inventory: 25,042 canonical URLs.
- Route distribution is overwhelmingly programmatic: 8,224 state annual salary pages, 7,838 state weekly pages, 7,837 state monthly pages, plus UK monthly/weekly variants.
- Template similarity sample is high:
  - UK annual salary pages: average nearest-neighbour Jaccard 0.925.
  - UK monthly salary pages: 0.820.
  - UK weekly salary pages: 0.825.
  - State monthly/weekly pages: about 0.804-0.809.
- Control sites with smaller, clearer inventories are seeing healthier deep-page participation.

Evidence against:
- The site is not thin by local audit.
- Metadata, canonicals and duplicate-signal audits pass.
- Some deep URLs have shown strong position tests when Google chooses to test them.

## Second-Most Likely Cause

**Internal importance dilution across 25k reachable URLs.**

Evidence:
- Homepage inbound links: 24,734.
- Core/trust pages receive very high internal PageRank-style scores.
- Ordinary UK annual salary pages average only 2.32 inbound links.
- State monthly/weekly pages can be as low as 2 inbound links.
- P95 depth is acceptable at 5, but depth is not the same as priority.

Evidence against:
- There are no meaningful orphans.
- All indexable pages are reachable from the homepage crawl.
- State annual pages average 10.49 inbound links, so the issue is not total absence of routing.

## Third-Most Likely Cause

**Historical sitemap/canonical/discovery churn delaying stable reassessment.**

Evidence:
- Git history shows repeated sitemap-related commits, including `sitemap rennovation`, `sitemap audit`, and `sitemap final fix hopefully`.
- User-provided GSC history reports stale sitemap provenance, old redirect states, and fragmented URL knowledge.
- Google only recently discovered the full inventory again through the classic sitemap.

Evidence against:
- Current sitemap state is clean.
- Current `robots.txt` references only `https://aftertaxtool.com/sitemap.xml`.
- Sitemap segmentation/parity audit passes.
- No evidence supports a formal or permanent "sitemap penalty".

## Homepage / Root URL Hypothesis

Plausible, but not enough to justify dangerous root changes.

The homepage:
- Has 104 outgoing internal routes.
- Targets broad salary-after-tax, take-home-pay, UK, US, monthly, weekly, state, calculator and authority intent.
- Has enormous inbound reinforcement from the internal graph.
- Has been edited repeatedly in Git history.

This can make `/` Google's safest broad test URL. That does not mean `/` should be moved, deleted or redirected.

## Intervention Ranking

1. Priority cohort internal-importance experiment.
2. Template differentiation test cohort.
3. New `/salary-calculator/` flagship hub, no redirect.
4. Sitemap-only priority cohort.
5. Large inventory pruning/noindex.

## Recommended First Intervention

Create a 100-200 URL priority cohort from existing pages only, then strengthen contextual routing to that cohort from the homepage, UK hub, US hub, state gateway, selected state hubs and relevant authority pages.

Do not create new salary URLs.
Do not change canonicals.
Do not change sitemap architecture.
Do not redirect the homepage.

## Measurement Period

Minimum: 28 days.
Preferred: 45-60 days.

## Success Metrics

- Cohort URLs get fresh crawls.
- Cohort URLs appear in GSC Pages report.
- Intended deep URLs replace homepage for exact salary, monthly, weekly, state and paycheck modifier queries.
- Visible Pages report expands from a handful of URLs toward 25-50+ participating URLs.
- Query families begin mapping to specific pages rather than root.

## Falsification

If Google crawls the changed hub/linking pages but does not fresh-crawl or search-test the priority cohort after 45-60 days, internal-priority signalling is probably not the main constraint. Move to a controlled template differentiation cohort or a new flagship hub experiment.

## Inventory Reduction

Not warranted as the first move.

It remains plausible that 25k URLs are too many for current trust/crawl economics, but pruning is high-risk and hard to interpret. A priority cohort test can answer the same question with far less blast radius.

## Annual / Monthly / Weekly Consolidation

Not warranted sitewide yet.

The similarity signal is real, especially around UK annual/monthly/weekly pages, but these pages map to distinct query modifiers. Test differentiation on a small cohort before any consolidation.

## Confirmed Technical Defect Found During This Pass

`audit-currency-integrity.js` currently fails on `salary-to-hourly.html`:
- `??50,000`
- `??60,000`
- `??70,000`

These are corrupted pound-sign labels in monthly/weekly route links. This is not likely to explain broad Google non-participation, but it is a real production-quality defect and should be fixed in the next implementation pass. It was not fixed here because the brief explicitly said not to make changes yet.

## Current Audit Results

- Metadata audit: pass, 25,043 checked, 0 issues.
- Broken-link audit: pass, 25,044 checked, 0 broken internal links/assets, 0 monthly/weekly link issues.
- Thin-page audit: pass, 25,044/25,044.
- Sitemap segmentation audit: pass, classic URL set, 25,042 unique URLs, 25,042 local indexable HTML pages, expected exclusions only.
- Canonical/sitemap parity: pass, 25,042 sitemap URLs, no duplicate canonicals, no missing local files.
- Duplicate signals: pass, no duplicate titles, descriptions, H1s or canonicals.
- Discovery paths: pass, no hard issues; warnings remain for selected direct context-route gaps.
- Currency integrity: fail, 12 findings on `salary-to-hourly.html`.

## Should AfterTaxTool Remain Live While SalaryDecoded Develops?

Yes. AfterTaxTool should remain live and stable. SalaryDecoded is a valuable clean control because it overlaps topically but has a much smaller architecture. Do not contaminate that comparison by making simultaneous radical changes to AfterTaxTool.

## What Not To Do

- Do not redirect `/` to a new URL.
- Do not 404/410 the homepage.
- Do not move the homepage to `/home/`.
- Do not repeatedly change sitemap filename or format.
- Do not bulk-update lastmod dates.
- Do not change canonicals sitewide.
- Do not publish more salary inventory.
- Do not run multiple major experiments at once.

