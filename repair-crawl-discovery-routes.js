const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const tierOneStates = [
  ['california', 'California'],
  ['texas', 'Texas'],
  ['florida', 'Florida'],
  ['new-york', 'New York'],
  ['illinois', 'Illinois'],
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content);
}

function insertBefore(content, marker, block) {
  if (content.includes(block.trim().slice(0, 80))) return content;
  const idx = content.indexOf(marker);
  if (idx === -1) throw new Error(`Marker not found: ${marker}`);
  return content.slice(0, idx) + block + '\n' + content.slice(idx);
}

function insertBeforeAny(content, markers, block) {
  if (content.includes(block.trim().slice(0, 80))) return content;
  for (const marker of markers) {
    if (content.includes(marker)) return insertBefore(content, marker, block);
  }
  throw new Error(`No marker found: ${markers.join(' | ')}`);
}

for (const [slug, name] of tierOneStates) {
  const file = `salary-after-tax-${slug}.html`;
  let html = read(file);
  const links = [176000, 180000, 185000, 190000, 195000, 200000]
    .map((salary) => `<a class="link-card" href="/${salary}-salary-after-tax-${slug}.html"><strong>$${salary.toLocaleString()} in ${name}</strong><span>High-income annual route with monthly and weekly siblings.</span></a>`)
    .join('');
  const block = `
<section class="feature-card crawl-route-repair" aria-label="${name} high-income salary checkpoints">
<h2>${name} high-income salary checkpoints</h2>
<p>Use these compact checkpoints to move into the upper salary range without relying only on sitemap discovery. Each annual page links onward to its monthly and weekly take-home views.</p>
<div class="link-grid">${links}</div>
</section>
`;
  html = insertBeforeAny(html, ['<!-- US_HUB_LINK_NORMALISATION_START -->', '<!-- PUBLISHER_AUTHORITY_STATE_CONTEXT -->', '</main>'], block);
  write(file, html);
}

let takeHome = read('take-home-pay-uk.html');
const takeHomeBlock = `
<section class="section card crawl-route-repair" id="uk-take-home-checkpoints">
  <h2>UK take-home pay checkpoints</h2>
  <p class="section-intro">These checkpoints route users into older take-home examples that are useful for nearby salary comparison, higher-income planning and PAYE threshold checks.</p>
  <div class="footer-links">
    <a class="link-card" href="/30000-take-home-pay-uk.html">&pound;30,000 take-home<span>Lower salary checkpoint</span></a>
    <a class="link-card" href="/52000-take-home-pay-uk.html">&pound;52,000 take-home<span>Higher-rate threshold area</span></a>
    <a class="link-card" href="/53000-take-home-pay-uk.html">&pound;53,000 take-home<span>Nearby threshold comparison</span></a>
    <a class="link-card" href="/54000-take-home-pay-uk.html">&pound;54,000 take-home<span>Nearby threshold comparison</span></a>
    <a class="link-card" href="/56000-take-home-pay-uk.html">&pound;56,000 take-home<span>Mid-band take-home route</span></a>
    <a class="link-card" href="/99000-take-home-pay-uk.html">&pound;99,000 take-home<span>Personal allowance pressure area</span></a>
    <a class="link-card" href="/101000-take-home-pay-uk.html">&pound;101,000 take-home<span>Post-&pound;100k planning route</span></a>
    <a class="link-card" href="/102000-take-home-pay-uk.html">&pound;102,000 take-home<span>Nearby upper-income route</span></a>
    <a class="link-card" href="/103000-take-home-pay-uk.html">&pound;103,000 take-home<span>Nearby upper-income route</span></a>
    <a class="link-card" href="/104000-take-home-pay-uk.html">&pound;104,000 take-home<span>Nearby upper-income route</span></a>
    <a class="link-card" href="/105000-take-home-pay-uk.html">&pound;105,000 take-home<span>Upper-income take-home route</span></a>
    <a class="link-card" href="/110000-take-home-pay-uk.html">&pound;110,000 take-home<span>Upper-income take-home route</span></a>
    <a class="link-card" href="/115000-take-home-pay-uk.html">&pound;115,000 take-home<span>Upper-income take-home route</span></a>
    <a class="link-card" href="/125000-take-home-pay-uk.html">&pound;125,000 take-home<span>Allowance taper endpoint area</span></a>
  </div>
</section>
`;
takeHome = insertBefore(takeHome, '<!-- AUTHORITY_LINK_AUDIT_TAKEHOME_UK_START -->', takeHomeBlock);
write('take-home-pay-uk.html', takeHome);

let guides = read('salary-guides.html');
const guideBlock = `
<section class="feature-card crawl-route-repair" id="uk-reference-routes">
  <h2>UK reference and support routes</h2>
  <p>Use these concise reference pages when the question is about UK salary context rather than a single calculator result.</p>
  <div class="link-grid">
    <a class="link-card" href="/average-salary-uk.html"><strong>Average salary UK</strong><span>National salary context.</span></a>
    <a class="link-card" href="/average-salary-uk-by-age.html"><strong>Average salary by age</strong><span>Age-band salary context.</span></a>
    <a class="link-card" href="/average-salary-uk-by-region.html"><strong>Average salary by region</strong><span>Regional salary context.</span></a>
    <a class="link-card" href="/uk-tax-bands.html"><strong>UK tax bands</strong><span>Quick tax-band reference.</span></a>
    <a class="link-card" href="/uk-tax-bands-explained.html"><strong>UK tax bands explained</strong><span>Plain-English PAYE band guide.</span></a>
    <a class="link-card" href="/uk-salary-after-tax.html"><strong>UK salary after tax reference</strong><span>Legacy UK salary route.</span></a>
    <a class="link-card" href="/uk-take-home-pay-explained.html"><strong>UK take-home pay explained</strong><span>Support guide for net pay questions.</span></a>
  </div>
</section>
`;
guides = insertBefore(guides, '<section class="feature-card" id="uk-editorial-context-layer">', guideBlock);
write('salary-guides.html', guides);

let california = read('salary-after-tax-california.html');
const californiaSupport = `<a class="link-card" href="/is-90000-a-good-salary-california.html"><strong>Is $90,000 good in California?</strong><span>California affordability and salary context.</span></a>`;
if (!california.includes('is-90000-a-good-salary-california.html')) {
  california = california.replace('</div>\n</section>\n\n<!-- US_HUB_LINK_NORMALISATION_START -->', `${californiaSupport}</div>\n</section>\n\n<!-- US_HUB_LINK_NORMALISATION_START -->`);
  write('salary-after-tax-california.html', california);
}

console.log('Added compact crawl-discovery route repairs.');
