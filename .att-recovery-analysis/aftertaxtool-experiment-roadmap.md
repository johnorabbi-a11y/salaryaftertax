# Recovery Experiment Roadmap

## Ranked Experiments

1. **Priority cohort internal-importance experiment**
   - Hypothesis: Google needs a smaller, strongly signalled subset before it expands to the whole inventory.
   - Change: Select 100-200 existing pages from query-evidenced and commercially important families; add compact contextual routes from homepage, UK/US hubs, state gateway and relevant salary hubs.
   - Measurement window: 4-8 weeks.
   - Success: More deep URLs appear in GSC Pages report; homepage is replaced by intended URLs for exact salary/monthly/weekly/state queries; fresh crawls increase for cohort.
   - Risk: Low if kept compact.
   - Rollback: Remove cohort modules.

2. **Template differentiation test cohort**
   - Hypothesis: annual/monthly/weekly/state variants are too close for confident URL selection.
   - Change: Rewrite first-screen intent framing and FAQs for 20-50 existing pages across one salary band and one state/UK cohort.
   - Measurement window: 6-10 weeks.
   - Success: intended URL selection improves for matching modifiers.
   - Risk: Moderate; contaminates content and linking variables if combined with experiment 1.

3. **New flagship `/salary-calculator/` hub**
   - Hypothesis: a new clean entry point may receive a separate evaluation path from root.
   - Change: Create a non-programmatic flagship hub that routes to existing calculators and priority cohorts. Do not redirect root.
   - Measurement window: 6-12 weeks.
   - Success: new hub receives impressions and starts routing Google into deep pages.
   - Risk: Moderate; could split broad intent with homepage.

4. **Sitemap-only priority cohort**
   - Hypothesis: reducing submitted inventory could improve crawl focus.
   - Change: Do not delete/noindex pages; submit only a curated canonical sitemap subset.
   - Measurement window: 4-8 weeks.
   - Risk: Moderate-high because it creates another sitemap strategy change during recovery.

5. **Inventory pruning/noindex**
   - Hypothesis: the 25k lattice is suppressing trust and crawl demand.
   - Change: Remove/noindex large cohorts.
   - Measurement window: 8-16 weeks.
   - Risk: High and hard to interpret. Use only after smaller tests fail.

## Do Not Do Now

- Redirect `/` to another URL.
- Move the homepage to `/home/`.
- 404 or 410 the root URL.
- Bulk-touch sitemap lastmod dates.
- Change canonicals sitewide.
- Generate more salary inventory.
- Resubmit alternate sitemap formats repeatedly.
