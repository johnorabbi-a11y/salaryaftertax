# AfterTaxTool V2 Migration Sequence

1. Freeze Phase 0 manifests and human-review flags.
2. Apply manual overrides for URLs with known GSC traffic, backlinks or strategic value.
3. Build V2 in a separate branch without deleting legacy pages.
4. Build homepage, category hubs, trust pages and first calculator cohort.
5. Run calculator, metadata, link, structured-data and crawl graph QA against the branch.
6. Generate only approved redirects from `att-v2-redirect-map.csv`.
7. Remove retired pages according to `att-v2-removal-manifest.csv`.
8. Replace sitemap inventory with final intended canonical URLs only.
9. Verify canonicals, sitemap parity, robots, noindex absence and internal links.
10. Deploy once.
11. Perform live checks for homepage, category hub, calculator, guide, removed URL and redirected URL samples.
12. Observe for 30-60 days before further expansion.

Do not remove the old lattice before V2 branch QA passes. Do not redirect numeric salary pages to generic calculators. Do not run repeated sitemap/canonical experiments.
