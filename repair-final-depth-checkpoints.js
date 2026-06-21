const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function write(file, content) { fs.writeFileSync(path.join(ROOT, file), content); }

function insertBeforeBody(file, block) {
  let html = read(file);
  if (html.includes(block.trim().slice(0, 80))) return;
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) throw new Error(`Missing </body> in ${file}`);
  html = html.slice(0, idx) + block + '\n' + html.slice(idx);
  write(file, html);
}

const ukHigh = [500000, 550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000, 1000000];
insertBeforeBody('salary-after-tax-uk.html', `
<section class="feature-card crawl-depth-repair" id="uk-high-income-checkpoints">
  <h2>UK high-income salary checkpoints</h2>
  <p>These compact checkpoints shorten discovery paths for very high UK salary examples. Each annual route connects onward to the relevant monthly and weekly take-home views where available.</p>
  <div class="link-grid">
    ${ukHigh.map((salary) => `<a class="link-card" href="/${salary}-salary-after-tax-uk.html"><strong>&pound;${salary.toLocaleString()} after tax</strong><span>High-income UK salary route</span></a>`).join('\n    ')}
  </div>
</section>
`);

const usHigh = [645000, 650000, 655000];
insertBeforeBody('salary-after-tax-us.html', `
<section class="feature-card crawl-depth-repair" id="us-high-income-checkpoints">
  <h2>US high-income salary checkpoints</h2>
  <p>These checkpoints support the very high salary examples that sit beyond the main state salary ladders, while keeping the route compact for users and crawlers.</p>
  <div class="link-grid">
    ${usHigh.map((salary) => `<a class="link-card" href="/${salary}-salary-after-tax-us.html"><strong>$${salary.toLocaleString()} salary after tax</strong><span>Annual route with monthly and weekly siblings</span></a>`).join('\n    ')}
  </div>
</section>
`);

let takeHome = read('take-home-pay-uk.html');
const marker = '<a class="link-card" href="/99000-take-home-pay-uk.html">&pound;99,000 take-home<span>Personal allowance pressure area</span></a>';
const additions = `
    <a class="link-card" href="/65000-take-home-pay-uk.html">&pound;65,000 take-home<span>Mid-band take-home route</span></a>
    <a class="link-card" href="/66000-take-home-pay-uk.html">&pound;66,000 take-home<span>Mid-band take-home route</span></a>
    <a class="link-card" href="/67000-take-home-pay-uk.html">&pound;67,000 take-home<span>Mid-band take-home route</span></a>
    <a class="link-card" href="/68000-take-home-pay-uk.html">&pound;68,000 take-home<span>Mid-band take-home route</span></a>
    <a class="link-card" href="/69000-take-home-pay-uk.html">&pound;69,000 take-home<span>Mid-band take-home route</span></a>
`;
if (!takeHome.includes('/67000-take-home-pay-uk.html') && takeHome.includes(marker)) {
  takeHome = takeHome.replace(marker, additions + '    ' + marker);
  write('take-home-pay-uk.html', takeHome);
}

console.log('Added final depth checkpoints.');
