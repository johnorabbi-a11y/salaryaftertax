# Template Similarity Analysis

This is a token-level nearest-neighbour similarity sample across major salary page families. It is not a Google duplicate-content model, but it is useful for ranking where incremental page value may look weakest.

| Family | Sample size | Avg nearest Jaccard | Max nearest Jaccard | Closest sample |
|---|---:|---:|---:|---|
| annual salary | 60 | 0.925 | 0.944 | `/65000-take-home-pay-uk.html` vs `/67000-take-home-pay-uk.html` |
| weekly salary | 120 | 0.825 | 0.921 | `/30000-after-tax-weekly.html` vs `/36000-after-tax-weekly.html` |
| monthly salary | 120 | 0.82 | 0.961 | `/33000-after-tax-monthly.html` vs `/36000-after-tax-monthly.html` |
| state weekly salary | 120 | 0.809 | 0.921 | `/26000-after-tax-weekly-vermont.html` vs `/33000-after-tax-weekly-vermont.html` |
| state monthly salary | 120 | 0.804 | 0.913 | `/79000-after-tax-monthly-vermont.html` vs `/88000-after-tax-monthly-vermont.html` |
| state annual salary | 120 | 0.782 | 0.904 | `/35000-salary-after-tax-wyoming.html` vs `/78000-salary-after-tax-wyoming.html` |

## Interpretation

The highest-risk area is not ordinary templating by itself. The risk is a very large numerical lattice where many adjacent salary pages, pay-period variants and state variants share the same structural answer pattern. Google may crawl or discover these URLs but decide the marginal gain of evaluating all of them is low until the domain earns more trust or the site creates a stronger priority subset.
