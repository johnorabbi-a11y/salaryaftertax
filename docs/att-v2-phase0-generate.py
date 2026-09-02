import csv, json, re
from pathlib import Path
from xml.etree import ElementTree as ET
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
BASE = "https://aftertaxtool.com/"
STATES = "alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada new-hampshire new-jersey new-mexico new-york north-carolina north-dakota ohio oklahoma oregon pennsylvania rhode-island south-carolina south-dakota tennessee texas utah vermont virginia washington west-virginia wisconsin wyoming".split()
STATE_RE = "(?:" + "|".join(re.escape(s) for s in sorted(STATES, key=len, reverse=True)) + ")"

BASE_EXISTING = [
    ("index.html", "/", "homepage", "CORE", "Broad calculator platform entry point", "KEEP"),
    ("salary-after-tax-uk.html", "/salary-after-tax-uk.html", "calculator/hub", "PAY & TAX", "UK salary after tax and take-home pay", "KEEP"),
    ("salary-tax-calculator-uk.html", "/salary-tax-calculator-uk.html", "calculator", "PAY & TAX", "UK salary tax calculator", "KEEP"),
    ("take-home-pay-uk.html", "/take-home-pay-uk.html", "calculator/hub", "PAY & TAX", "UK take-home pay calculator", "KEEP"),
    ("salary-after-tax-us.html", "/salary-after-tax-us.html", "calculator/hub", "PAY & TAX", "US salary after tax calculator", "KEEP"),
    ("salary-after-tax-by-state.html", "/salary-after-tax-by-state.html", "hub", "PAY & TAX", "Compact US state-tax comparison hub", "REPURPOSE"),
    ("planning-calculators.html", "/planning-calculators.html", "hub", "CORE", "Calculator library and planning gateway", "KEEP"),
    ("salary-guides.html", "/salary-guides.html", "hub", "GUIDES", "Salary and pay guide library", "KEEP"),
    ("methodology.html", "/methodology.html", "trust", "TRUST / METHODOLOGY", "Calculation methodology", "KEEP"),
    ("tax-assumptions.html", "/tax-assumptions.html", "trust", "TRUST / METHODOLOGY", "Tax assumptions and limitations", "KEEP"),
    ("editorial-standards.html", "/editorial-standards.html", "trust", "TRUST / METHODOLOGY", "Editorial standards", "KEEP"),
    ("about.html", "/about.html", "trust", "TRUST / METHODOLOGY", "About AfterTaxTool", "KEEP"),
    ("gross-vs-net-pay.html", "/gross-vs-net-pay.html", "guide", "PAY & TAX", "Gross pay vs net pay explained", "KEEP"),
    ("us-state-tax-explained.html", "/us-state-tax-explained.html", "guide", "PAY & TAX", "US state income tax explained", "KEEP"),
    ("why-your-paycheck-is-different.html", "/why-your-paycheck-is-different.html", "guide", "PAY & TAX", "Why US paycheck estimates differ", "KEEP"),
    ("why-your-payslip-is-different.html", "/why-your-payslip-is-different.html", "guide", "PAY & TAX", "Why UK payslip estimates differ", "KEEP"),
    ("credit-readiness-resources.html", "/credit-readiness-resources.html", "bridge", "BORROWING & DEBT", "Income, affordability and credit readiness", "KEEP"),
]
CATEGORY_HUBS = [
    ("/pay-tax/", "category hub", "PAY & TAX", "Pay, tax and take-home pay calculators"),
    ("/household-money/", "category hub", "HOUSEHOLD MONEY", "Household budget and living-cost calculators"),
    ("/borrowing-debt/", "category hub", "BORROWING & DEBT", "Borrowing, repayment and debt calculators"),
    ("/saving/", "category hub", "SAVINGS", "Savings and goal calculators"),
    ("/work-money/", "category hub", "WORK MONEY", "Work, benefits and job-money calculators"),
    ("/guides/", "guide hub", "GUIDES", "Plain-English money guide library"),
]

def sitemap_urls():
    xml = ET.fromstring((ROOT / "sitemap.xml").read_text(encoding="utf-8-sig"))
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    if not xml.tag.endswith("urlset"):
        raise SystemExit("Expected sitemap.xml urlset for Phase 0 inventory")
    return sorted({n.find("sm:loc", ns).text.strip() for n in xml.findall("sm:url", ns) if n.find("sm:loc", ns) is not None})

def url_path(url):
    return "index.html" if url.rstrip("/") == BASE.rstrip("/") else url.replace(BASE, "")

def slug(path):
    return path[:-5] if path.endswith(".html") else path

def page_family(path):
    s = slug(path)
    if path == "index.html":
        return "homepage"
    if re.match(rf"^salary-after-tax-{STATE_RE}$", s):
        return "state_hub"
    if s in {"salary-after-tax-us", "salary-after-tax-by-state", "salary-after-tax-uk", "salary-tax-calculator-uk", "take-home-pay-uk", "planning-calculators", "salary-guides"}:
        return "core_salary_hub"
    patterns = [
        (rf"^\d+-salary-after-tax-{STATE_RE}$", "us_state_salary_annual"),
        (rf"^\d+-after-tax-monthly-{STATE_RE}$", "us_state_salary_monthly"),
        (rf"^\d+-after-tax-weekly-{STATE_RE}$", "us_state_salary_weekly"),
        (r"^\d+-salary-after-tax-uk$", "uk_salary_annual"),
        (r"^\d+-after-tax-monthly-uk$", "uk_salary_monthly"),
        (r"^\d+-after-tax-weekly-uk$", "uk_salary_weekly"),
        (r"^\d+-take-home-pay-uk$", "uk_take_home_salary"),
        (r"^\d+-salary-after-tax-us$", "us_salary_annual"),
        (r"^\d+-after-tax-monthly-us$", "us_salary_monthly"),
        (r"^\d+-after-tax-weekly-us$", "us_salary_weekly"),
        (r"^\d+-after-tax-monthly$", "generic_salary_monthly"),
        (r"^\d+-after-tax-weekly$", "generic_salary_weekly"),
        (r"^\d+-salary-after-tax$", "generic_salary_annual"),
        (r"^\d+-hourly-rate-uk$", "uk_hourly"),
    ]
    for pattern, name in patterns:
        if re.match(pattern, s):
            return name
    if "calculator" in s:
        return "calculator_tool"
    if re.search(r"vs|compare|comparison", s):
        return "comparison_decision"
    if re.search(r"guide|explained|why-|what-|how-|should-|worth|planning|checklist|deductions|benefits|bonus|pension|payroll|paycheck|payslip", s):
        return "guide_or_authority"
    if path in {"privacy-policy.html", "terms.html", "contact.html", "llms.txt"}:
        return "trust_authority"
    return "other_support"

def primary_intent(family):
    lookup = {
        "homepage": "Broad salary-after-tax and calculator entry point",
        "state_hub": "State salary-after-tax navigation and interpretation",
        "core_salary_hub": "Major UK/US salary-after-tax hub or planning gateway",
        "uk_take_home_salary": "UK take-home-pay estimate for a salary",
        "uk_hourly": "UK hourly-pay salary equivalent",
        "calculator_tool": "Interactive calculator/tool intent",
        "comparison_decision": "Compare two financial options",
        "guide_or_authority": "Educational explanation or decision guidance",
    }
    if family in lookup:
        return lookup[family]
    if "monthly" in family:
        return "Monthly take-home pay estimate"
    if "weekly" in family:
        return "Weekly take-home pay estimate"
    if "annual" in family:
        return "Annual salary-after-tax estimate"
    return "Supporting informational or trust page"

def category_for(path):
    p = path.lower()
    if any(w in p for w in ["mortgage", "loan", "debt", "apr", "credit"]):
        return "BORROWING & DEBT"
    if any(w in p for w in ["budget", "rent", "cost-of-living", "energy", "childcare", "car", "fuel", "inflation"]):
        return "HOUSEHOLD MONEY"
    if any(w in p for w in ["saving", "compound", "isa", "emergency"]):
        return "SAVINGS"
    if any(w in p for w in ["job", "commute", "benefit", "bonus", "rise", "raise", "compensation", "pension", "overtime", "sacrifice"]):
        return "WORK MONEY"
    if any(w in p for w in ["tax", "pay", "salary", "withholding", "fica", "national-insurance", "student-loan"]):
        return "PAY & TAX"
    return "GUIDES"

def write_csv(path, rows, fields=None):
    fields = fields or list(rows[0].keys())
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

def add_unique(rows, row):
    if row["proposed_url"] not in {r["proposed_url"] for r in rows}:
        rows.append(row)

def build_proposed(urls):
    proposed = []
    for src, url, page_type, category, intent, disposition in BASE_EXISTING:
        add_unique(proposed, {
            "proposed_url": url,
            "page_type": page_type,
            "category": category,
            "primary_intent": intent,
            "existing_or_new": "repurpose" if disposition == "REPURPOSE" else "existing",
            "source_old_url_if_any": src,
            "calculator_or_content": "calculator" if "calculator" in page_type else "content",
            "priority": "A",
            "official_data_dependency": "Yes" if any(w in intent.lower() for w in ["tax", "pay"]) else "No",
            "update_frequency": "Annual",
            "portfolio_overlap_risk": "Medium",
            "notes": "Legacy URL survives V2.",
        })
    for url, page_type, category, intent in CATEGORY_HUBS:
        add_unique(proposed, {
            "proposed_url": url,
            "page_type": page_type,
            "category": category,
            "primary_intent": intent,
            "existing_or_new": "new",
            "source_old_url_if_any": "",
            "calculator_or_content": "content",
            "priority": "A",
            "official_data_dependency": "No",
            "update_frequency": "Low",
            "portfolio_overlap_risk": "Low",
            "notes": "New V2 category hub.",
        })
    with (DOCS / "att-v2-calculator-opportunities.csv").open(encoding="utf-8-sig", newline="") as handle:
        for item in list(csv.DictReader(handle))[:42]:
            add_unique(proposed, {
                "proposed_url": item["proposed_url"],
                "page_type": "calculator",
                "category": (item.get("cluster") or category_for(item["proposed_url"])).upper(),
                "primary_intent": item["primary_search_intent"],
                "existing_or_new": "new",
                "source_old_url_if_any": "",
                "calculator_or_content": "calculator",
                "priority": item.get("priority", "A") or "A",
                "official_data_dependency": item.get("official_data_required", "Maybe"),
                "update_frequency": item.get("update_frequency", "Annual"),
                "portfolio_overlap_risk": item.get("portfolio_overlap_risk", "Low"),
                "notes": f"User problem: {item.get('user_problem','')}. Inputs: {item.get('required_inputs','')}. Outputs: {item.get('expected_outputs','')}.",
            })
    planned_calc_old_paths = {r["proposed_url"].strip("/").split("/")[-1] + ".html" for r in proposed if r["calculator_or_content"] == "calculator"}
    selected = []
    base_paths = {item[0] for item in BASE_EXISTING}
    for url in urls:
        path = url_path(url)
        fam = page_family(path)
        if path in base_paths or path in planned_calc_old_paths or re.match(r"^\d", path):
            continue
        if fam in {"calculator_tool", "comparison_decision", "guide_or_authority", "trust_authority", "other_support"}:
            selected.append(path)
    for path in sorted(selected)[:135]:
        add_unique(proposed, {
            "proposed_url": "/" + path,
            "page_type": "guide/tool candidate",
            "category": category_for(path),
            "primary_intent": slug(path).replace("-", " ").capitalize(),
            "existing_or_new": "existing",
            "source_old_url_if_any": path,
            "calculator_or_content": "content",
            "priority": "C",
            "official_data_dependency": "Maybe",
            "update_frequency": "Annual",
            "portfolio_overlap_risk": "Medium",
            "notes": "Candidate for compact V2 inventory; review before implementation.",
        })
    for amount in [30000, 40000, 50000, 60000, 80000, 100000, 150000, 200000]:
        for suffix, label in [("uk", "UK"), ("us", "US")]:
            path = f"{amount}-salary-after-tax-{suffix}.html"
            if (ROOT / path).exists():
                add_unique(proposed, {
                    "proposed_url": "/" + path,
                    "page_type": "example",
                    "category": "PAY & TAX",
                    "primary_intent": f"{label} salary after tax example for {amount:,}",
                    "existing_or_new": "existing",
                    "source_old_url_if_any": path,
                    "calculator_or_content": "content",
                    "priority": "C",
                    "official_data_dependency": "Yes",
                    "update_frequency": "Annual",
                    "portfolio_overlap_risk": "High with SalaryDecoded",
                    "notes": "Keep only as a small flagship example set if human review approves.",
                })
    return proposed

def build_manifest(urls, proposed):
    v2_paths = {"index.html" if r["proposed_url"] == "/" else r["proposed_url"].lstrip("/") for r in proposed}
    calc_dest = {r["proposed_url"].strip("/").split("/")[-1] + ".html": r["proposed_url"] for r in proposed if r["calculator_or_content"] == "calculator"}
    rows = []
    for url in urls:
        path = url_path(url)
        fam = page_family(path)
        dest = ""
        dest_status = ""
        if path in v2_paths:
            prop = next((r for r in proposed if ("index.html" if r["proposed_url"] == "/" else r["proposed_url"].lstrip("/")) == path), {})
            disposition = "REPURPOSE" if prop.get("existing_or_new") == "repurpose" else "KEEP"
            dest = "/" if path == "index.html" else "/" + path
            dest_status = "survives"
            reason = "Existing URL survives V2 as a core page, calculator, guide, trust page or selected example."
        elif path in calc_dest:
            disposition = "REDIRECT"
            dest = calc_dest[path]
            dest_status = "substantial-equivalent"
            reason = "Legacy calculator has a materially equivalent V2 calculator destination."
        elif fam == "state_hub":
            disposition = "CONSOLIDATE"
            dest = "/salary-after-tax-by-state.html"
            dest_status = "content-incorporated-not-automatic-redirect"
            reason = "State comparison intent survives in compact V2 form, but hub redirects require human review."
        elif fam == "core_salary_hub":
            disposition = "CONSOLIDATE"
            dest = "/pay-tax/take-home-pay-calculator/"
            dest_status = "content-review-required"
            reason = "Core pay intent survives, but exact URL handling needs human review."
        elif fam in {"calculator_tool", "comparison_decision", "guide_or_authority", "other_support"} and not re.match(r"^\d", path):
            disposition = "CONSOLIDATE"
            dest = "/guides/" if fam != "calculator_tool" else "/planning-calculators.html"
            dest_status = "content-review-required"
            reason = "Potentially useful non-lattice content should be reviewed and incorporated or retired."
        else:
            disposition = "REMOVE"
            reason = "Programmatic or low-fit legacy URL with no sufficiently equivalent V2 replacement. Do not force a vague redirect."
        historical = "High" if path in {"index.html", "salary-after-tax-uk.html", "salary-tax-calculator-uk.html", "take-home-pay-uk.html", "salary-after-tax-us.html", "salary-after-tax-by-state.html"} else ("Medium" if disposition in {"KEEP", "REPURPOSE", "REDIRECT", "CONSOLIDATE"} else "Low")
        overlap = "High with SalaryDecoded" if "salary" in path and fam not in {"calculator_tool", "guide_or_authority"} else ("Medium with WorthMyTime/CreditRoadmap" if any(x in path for x in ["job", "commute", "mortgage", "credit", "debt"]) else "Low")
        rows.append({
            "current_url": url,
            "current_path": path,
            "current_page_family": fam,
            "current_primary_intent": primary_intent(fam),
            "disposition": disposition,
            "destination_url": dest,
            "destination_status": dest_status,
            "reason": reason,
            "historical_value_risk": historical,
            "portfolio_overlap": overlap,
            "notes": "Phase 0 planning classification. Human review required before implementation.",
        })
    return rows

def write_docs(rows, proposed):
    counts = Counter(r["disposition"] for r in rows)
    family_counts = Counter(r["current_page_family"] for r in rows)
    salary_families = {k: v for k, v in sorted(family_counts.items()) if "salary" in k or k in {"state_hub", "uk_hourly", "uk_take_home_salary", "generic_salary_monthly", "generic_salary_weekly", "generic_salary_annual"}}
    redirects = [r for r in rows if r["disposition"] == "REDIRECT"]
    removals = []
    for r in rows:
        if r["disposition"] == "REMOVE":
            item = dict(r)
            item["recommended_http_status"] = "410 if hosting supports deliberate gone responses cleanly; otherwise 404 is acceptable for removed static pages"
            removals.append(item)
    launch = [r for r in proposed if r["calculator_or_content"] == "calculator" and r["priority"] in {"A", "B"}]

    write_csv(DOCS / "att-v2-url-disposition-manifest.csv", rows)
    write_csv(DOCS / "att-v2-final-url-inventory.csv", proposed)
    write_csv(DOCS / "att-v2-redirect-map.csv", redirects, ["current_url", "current_path", "destination_url", "destination_status", "reason", "historical_value_risk", "portfolio_overlap", "notes"])
    write_csv(DOCS / "att-v2-removal-manifest.csv", removals, ["current_url", "current_path", "current_page_family", "current_primary_intent", "reason", "historical_value_risk", "portfolio_overlap", "notes", "recommended_http_status"])

    calc_lines = ["# AfterTaxTool V2 Launch Calculator Specification", "", f"Launch calculator count: {len(launch)}", "", "Selected for distinct functionality, search intent, brand fit and portfolio separation. Build with crawlable explanatory content and JavaScript-enhanced calculations.", ""]
    for index, row in enumerate(launch, 1):
        calc_lines += [
            f"## {index}. {row['primary_intent']}", "",
            f"- URL: `{row['proposed_url']}`",
            f"- Category: {row['category']}",
            f"- User problem: {row['primary_intent']}",
            f"- Inputs and outputs: {row['notes']}",
            "- Calculation logic: Use transparent formulas and official thresholds where relevant.",
            "- Result interpretation: Explain what the result means, what it excludes and why real bills or payslips may differ.",
            "- Worked examples: Include at least two realistic examples.",
            "- Edge cases: Validate blank, zero, negative and unusually high values.",
            f"- Official sources required: {row['official_data_dependency']}",
            "- Methodology requirements: Link to methodology and tax assumptions when rules or assumptions are used.",
            "- Related calculators: Link only to adjacent calculators in the same journey.",
            f"- Portfolio overlap: {row['portfolio_overlap_risk']}",
            f"- Update requirements: {row['update_frequency']}", ""
        ]
    (DOCS / "att-v2-launch-calculator-spec.md").write_text("\n".join(calc_lines), encoding="utf-8")

    (DOCS / "att-v2-portfolio-boundaries.md").write_text("""# AfterTaxTool V2 Portfolio Boundaries

AfterTaxTool V2 owns calculator-first money utility: pay, tax, household budget, borrowing arithmetic, savings arithmetic and work-money calculators.

## SalaryDecoded
SalaryDecoded owns scalable salary intelligence and programmatic salary/take-home pages. AfterTaxTool should keep flagship calculator routes and only a small set of examples where they support calculators.

## WorthMyTime
WorthMyTime owns time-value, job-value and work/life decision depth. AfterTaxTool may keep commute, overtime and job-change calculators when the primary value is arithmetic or tax impact.

## CreditRoadmap
CreditRoadmap owns credit readiness, CCJs, defaults, credit applications and borrowing preparedness. AfterTaxTool may host repayment, affordability and debt arithmetic tools, with contextual links to CreditRoadmap where readiness is the next user need.

## Borderline Cases
- Job offer tools: calculator-first can stay on ATT; broader work-value content belongs on WorthMyTime.
- Mortgage affordability: repayment/payment arithmetic can stay on ATT; credit readiness belongs on CreditRoadmap.
- Salary comparisons: avoid rebuilding SalaryDecoded; ATT should only compare outcomes inside broader tools.
- Debt payoff: keep educational calculation support; avoid regulated debt advice framing.
""", encoding="utf-8")

    with (DOCS / "att-v2-cross-site-link-map.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["source_page_type", "destination_site", "destination_page_type", "user_reason", "recommended_anchor_context"])
        writer.writerows([
            ["ATT pay/tax calculator result", "SalaryDecoded", "salary intelligence page or hub", "User wants deeper salary context after a take-home estimate", "Compare this salary in more detail"],
            ["ATT mortgage payment calculator", "CreditRoadmap", "mortgage-readiness-guide.html", "User has payment estimate and needs credit-readiness preparation", "Mortgage readiness guide"],
            ["ATT debt-to-income calculator", "CreditRoadmap", "roadmap.html", "User sees affordability pressure and wants credit readiness next steps", "Build a credit roadmap"],
            ["ATT commute/job-change calculator", "WorthMyTime", "job-value or commute decision page", "User wants time and work-life trade-offs beyond money", "Compare the time cost"],
            ["CreditRoadmap affordability pages", "AfterTaxTool", "loan or mortgage repayment calculator", "User needs payment arithmetic before readiness planning", "Estimate repayments"],
            ["WorthMyTime salary/time pages", "AfterTaxTool", "overtime-tax-calculator or take-home-pay-calculator", "User needs tax-adjusted income arithmetic", "Estimate take-home pay"],
            ["SalaryDecoded salary pages", "AfterTaxTool", "take-home-pay-calculator", "User wants a custom calculator rather than a prebuilt salary page", "Use the calculator"],
        ])

    (DOCS / "att-v2-migration-sequence.md").write_text("""# AfterTaxTool V2 Migration Sequence

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
""", encoding="utf-8")

    (DOCS / "att-v2-migration-qa-plan.md").write_text("""# AfterTaxTool V2 Migration QA Plan

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
""", encoding="utf-8")

    flag_lines = ["# AfterTaxTool V2 Human Review Flags", "", "These decisions should be reviewed before implementation.", "", "## High-Risk Groups", "", "- Removing the old salary lattice is the central strategic decision.", "- State hubs should not be blindly redirected until replacement intent is confirmed.", "- Existing calculators with V2 equivalents can redirect only where the replacement is substantial.", "- URLs with known links, impressions, clicks or conversions should be manually overridden.", "", "## Representative URL Flags", ""]
    for row in [r for r in rows if r["historical_value_risk"] == "High" or r["disposition"] in {"REDIRECT", "CONSOLIDATE"}][:120]:
        dest = f" -> `{row['destination_url']}`" if row["destination_url"] else ""
        flag_lines.append(f"- `{row['current_path']}`: {row['disposition']}{dest}. {row['reason']}")
    (DOCS / "att-v2-human-review-flags.md").write_text("\n".join(flag_lines), encoding="utf-8")

    report = f"""# AfterTaxTool V2 Phase 0 Final Report

## Executive Summary

Phase 0 converts the V2 strategy into an executable migration planning package. No live pages, canonicals, robots rules, redirects or sitemap files were changed.

## Existing Canonical URL Count

- Existing canonical sitemap URLs: **{len(rows):,}**

## Exact Disposition Counts

- KEEP: **{counts['KEEP']:,}**
- REPURPOSE: **{counts['REPURPOSE']:,}**
- CONSOLIDATE: **{counts['CONSOLIDATE']:,}**
- REDIRECT: **{counts['REDIRECT']:,}**
- REMOVE: **{counts['REMOVE']:,}**

Redirects are deliberately limited to substantial-equivalent destinations only. This avoids sending old salary-number pages to weak generic replacements.

## Proposed V2 Inventory

- Proposed V2 canonical URLs: **{len(proposed):,}**
- Launch calculators: **{len(launch):,}**
- Supporting guides, hubs, examples and trust pages: **{len(proposed) - len(launch):,}**

## Old Salary Lattice Summary

```json
{json.dumps(salary_families, indent=2)}
```

## Removal Behaviour

For retired programmatic URLs with no equivalent replacement, use **410 Gone** if the hosting/deployment layer can support it cleanly. If not, a normal **404** is acceptable for deleted static files. Do not create redirects where the destination does not substantially satisfy the old query.

## High-Risk Decisions

- Large-scale removal of the salary lattice.
- State hub consolidation.
- Any legacy URL with historical traffic, external links or unusual internal prominence.
- Any calculator that overlaps WorthMyTime, CreditRoadmap or SalaryDecoded.

## Proposed Pages Rejected for Portfolio Fit

- Large salary-number inventories belong on SalaryDecoded.
- Deep job/time-value content belongs on WorthMyTime.
- Credit readiness and adverse-credit content belongs on CreditRoadmap.
- Regulated debt, pension or investment advice should not be built on AfterTaxTool.

## Migration Safety Verdict

The migration is **not yet safe to implement directly**. It is ready for human review and then a separate V2 implementation branch. The manifest gives a deterministic plan, but human overrides are required before deleting or redirecting large URL groups.

## Recommended Implementation Sequence

1. Review the disposition manifest, redirect map and human-review flags.
2. Overlay GSC/backlink/analytics data and protect any historically valuable URLs.
3. Build the V2 branch with homepage, category hubs and calculator cohort.
4. Run the full migration QA plan.
5. Generate approved redirects only.
6. Remove retired pages and replace sitemap inventory.
7. Deploy once and observe for 30-60 days.
"""
    (DOCS / "att-v2-phase0-final-report.md").write_text(report, encoding="utf-8")

    summary = {
        "existing_canonical_url_count": len(rows),
        "disposition_counts": dict(counts),
        "proposed_v2_canonical_count": len(proposed),
        "launch_calculator_count": len(launch),
        "supporting_url_count": len(proposed) - len(launch),
        "redirect_count": len(redirects),
        "removal_count": len(removals),
        "salary_lattice_family_counts": salary_families,
    }
    (DOCS / "att-v2-phase0-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))

def main():
    urls = sitemap_urls()
    proposed = build_proposed(urls)
    rows = build_manifest(urls, proposed)
    write_docs(rows, proposed)

if __name__ == "__main__":
    main()



