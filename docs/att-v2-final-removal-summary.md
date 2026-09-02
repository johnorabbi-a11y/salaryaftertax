# AfterTaxTool V2 Final Removal Summary

## Removal Count

- Removal manifest entries: 24766

## Recommended Behaviour

Use 410 Gone for deliberately retired programmatic URLs if the hosting/deployment layer can support it cleanly. If not, normal 404 behaviour is acceptable for deleted static files.

Do not mass redirect retired salary-number URLs to the homepage or to generic calculator pages.

## Rationale

Most removed URLs are old programmatic salary variants. SalaryDecoded now owns scalable salary-depth content, while AfterTaxTool V2 is calculator-first.
