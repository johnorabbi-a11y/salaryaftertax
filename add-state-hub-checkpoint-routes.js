const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const states = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia',
  'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland',
  'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey',
  'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina',
  'south-dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia', 'wisconsin', 'wyoming',
];
const checkpoints = [
  20000, 25000, 30000, 35000, 39000,
  40000, 45000, 50000, 55000, 59000,
  60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 99000,
  100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 139000,
  140000, 145000, 150000, 155000, 160000, 165000, 170000, 175000, 180000, 185000, 190000, 195000, 200000,
];

function title(slug) {
  return slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function insertBeforeAny(html, markers, block) {
  if (html.includes('crawl-checkpoint-routes')) {
    return html.replace(/<section class="feature-card crawl-checkpoint-routes"[\s\S]*?<\/section>/, block.trim());
  }
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) return html.slice(0, idx) + block + '\n' + html.slice(idx);
  }
  throw new Error(`No insertion marker found`);
}

let changed = 0;
for (const state of states) {
  const file = `salary-after-tax-${state}.html`;
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const name = title(state);
  let html = fs.readFileSync(full, 'utf8');
  const links = checkpoints
    .filter((salary) => fs.existsSync(path.join(ROOT, `${salary}-salary-after-tax-${state}.html`)))
    .map((salary) => `<a class="link-card" href="/${salary}-salary-after-tax-${state}.html"><strong>$${salary.toLocaleString()}</strong><span>${name} annual route</span></a>`)
    .join('');
  const block = `
<section class="feature-card crawl-checkpoint-routes" aria-label="${name} salary checkpoint navigation">
<h2>${name} salary checkpoint navigation</h2>
<p>These checkpoint routes keep the state salary ladder easy to crawl and scan without listing every salary value. Each annual checkpoint links onward to its monthly and weekly take-home views.</p>
<div class="link-grid">${links}</div>
</section>
`;
  const updated = insertBeforeAny(html, [
    '<section class="feature-card crawl-route-repair"',
    '<!-- US_HUB_LINK_NORMALISATION_START -->',
    '<!-- PUBLISHER_AUTHORITY_STATE_CONTEXT -->',
    '</main>',
    '</body>',
  ], block);
  if (updated !== html) {
    fs.writeFileSync(full, updated);
    changed++;
  }
}

console.log(`Added checkpoint routes to ${changed} state hubs.`);
