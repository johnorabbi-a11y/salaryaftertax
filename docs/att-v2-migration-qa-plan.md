# AfterTaxTool V2 Migration QA Plan

## Inventory
- Final canonical inventory exactly matches `att-v2-final-url-inventory.csv`.
- Sitemap contains only intended canonical URLs.
- Removed URLs are absent from sitemap and internal links.
- Redirect map contains only approved substantial-equivalent destinations.

## Redirects
- Every redirect resolves to the expected destination.
- No redirect chains or loops.
- No inappropriate mass redirects to homepage or generic tools.

## Pages
- Surviving pages return 200.
- Canonicals self-reference unless a compatibility route is explicitly documented.
- No unintended noindex, nofollow or X-Robots blocking.
- Titles, descriptions and H1s are unique and intent-specific.
- Structured data parses and contains no broken URLs.
- Encoding and currency checks pass.

## Crawl Graph
- No orphan indexable pages.
- Homepage reaches all intended canonical URLs.
- Target P95 crawl depth: <= 4.
- Category hubs expose calculators and guides without route walls.

## Calculators
- Inputs validate blank, zero, negative and high-value cases.
- Explanatory content exists in static HTML.
- Formulas match documented methodology.
- Tax-year assumptions are visible where relevant.
- No sensitive input values are sent to analytics.
