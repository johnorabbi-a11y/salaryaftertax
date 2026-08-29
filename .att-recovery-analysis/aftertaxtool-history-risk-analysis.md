# Historical Signal Risk Analysis

## Facts From Current Repo Evidence

- Current `robots.txt` references only `https://aftertaxtool.com/sitemap.xml`.
- Current `sitemap.xml` is a classic `urlset`, not a sitemap index.
- Current sitemap URL count is 25042.
- Current local sitemap URLs are unique: yes.
- The repository currently has no uncommitted changes at scan time: 

## Known From User-Provided History

- The site previously used multiple sitemap architectures.
- Google Search Console showed fragmented historical states, including old sitemap provenance and stale redirect errors.
- A later classic sitemap submission caused Google to discover approximately the full inventory.

## Inference

Historical sitemap churn can plausibly affect crawl scheduling and GSC reporting for weeks, especially on a large site whose inventory changed quickly. This should be treated as a recovery-lag and crawl-prioritisation risk, not as a documented penalty.

## Speculation To Avoid

There is no evidence in the repo that Google is applying a formal sitemap-change penalty. The safer reading is that the site created inconsistent discovery signals during a period when Google was already compressing URL participation.
