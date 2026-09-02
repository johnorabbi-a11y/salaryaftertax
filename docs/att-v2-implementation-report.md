# AfterTaxTool V2 Implementation Report

## Build State

V2 was built in an isolated local implementation folder: tt-v2-build/.

A git branch could not be created because .git/refs/heads was locked by the host filesystem, so no production branch, merge or deployment was performed. The production root remains intact and recoverable.

## V2 Positioning

Free calculators for your pay, tax and everyday money.

## Build Output

- V2 canonical URLs: 124
- Working calculator pages: 46
- Supporting pages: 78
- Redirect package entries: 22
- Removal manifest entries: 24766

## Files Built

- tt-v2-build/index.html
- tt-v2-build/assets/v2.css
- tt-v2-build/assets/v2-calculators.js
- tt-v2-build/sitemap.xml
- tt-v2-build/robots.txt
- tt-v2-build/redirects.json
- 123 additional V2 HTML documents from the approved inventory

## Notes

No destructive migration was applied to production. This is a reviewable replacement build.
