# AfterTaxTool V2 Deployment Checklist

Do not deploy without explicit approval.

1. Create a clean implementation branch or clean worktree once .git locking is resolved.
2. Confirm the final approved V2 inventory count.
3. Rebuild tt-v2-build/ from docs/att-v2-build-generator.py.
4. Run docs/att-v2-qa.py and confirm zero issues, zero unreachable URLs and zero zero-inbound URLs.
5. Run JavaScript syntax checks on ssets/v2-calculators.js.
6. Manually inspect homepage, one category hub, one pay/tax calculator, one borrowing calculator, one savings calculator, one support guide and methodology/trust page on desktop and mobile.
7. Review statutory calculator assumptions.
8. Approve redirect map.
9. Approve removal manifest and 404/410 behaviour.
10. Replace production files in one migration event.
11. Replace sitemap with V2 sitemap only.
12. Verify robots references the production sitemap.
13. Perform live checks for 200, canonical, noindex absence, sitemap parity and calculator function.
14. Observe GSC for 30-60 days.
