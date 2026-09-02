# AfterTaxTool V2 Migration Risk

## Main Risks

1. Crawl shock from removing roughly 24k URLs from the canonical inventory.
2. Temporary GSC noise as old salary URLs move out of sitemap and internal navigation.
3. Google interpreting the pivot as another unstable architecture change if implemented gradually or repeatedly.
4. Incorrect redirects creating soft-404 or irrelevant-canonical signals.
5. Losing any historical signals attached to broad salary pages if they are removed without sampling.

## Risk Reduction

- Make one deliberate migration, then keep it stable.
- Build V2 architecture before removing old inventory.
- Keep a precise URL-level disposition map.
- Preserve broad calculator and trust pages.
- Redirect only where there is a clear equivalent.
- Let irrelevant salary-number pages fall out cleanly rather than pointing them all at the homepage.
- Submit one clean sitemap after migration and avoid sitemap experiments.

## Expected Search Volatility

Short-term volatility is likely. The upside is not immediate traffic preservation; it is giving the domain a coherent future role after the original large salary inventory failed to earn broad trust.
