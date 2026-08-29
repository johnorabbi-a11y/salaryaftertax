const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const sections = {
  'salary-after-tax-uk.html': {
    marker: 'PRIORITY_COHORT_UK',
    html: `
<section class="content-section priority-cohort-routes" aria-labelledby="priority-uk-salary-routes">
  <!-- PRIORITY_COHORT_UK_START -->
  <h2 id="priority-uk-salary-routes">Priority UK salary routes</h2>
  <p>These common UK salary checkpoints help users move from the broad calculator into annual, monthly and weekly take-home pay examples.</p>
  <div class="link-grid compact">
    <a href="30000-salary-after-tax-uk.html">£30,000 salary after tax</a>
    <a href="40000-salary-after-tax-uk.html">£40,000 salary after tax</a>
    <a href="50000-salary-after-tax-uk.html">£50,000 salary after tax</a>
    <a href="60000-salary-after-tax-uk.html">£60,000 salary after tax</a>
    <a href="75000-salary-after-tax-uk.html">£75,000 salary after tax</a>
    <a href="100000-salary-after-tax-uk.html">£100,000 salary after tax</a>
    <a href="150000-salary-after-tax-uk.html">£150,000 salary after tax</a>
    <a href="200000-salary-after-tax-uk.html">£200,000 salary after tax</a>
    <a href="50000-after-tax-monthly-uk.html">£50,000 monthly take-home pay</a>
    <a href="60000-after-tax-weekly-uk.html">£60,000 weekly take-home pay</a>
  </div>
  <!-- PRIORITY_COHORT_UK_END -->
</section>`
  },
  'salary-after-tax-us.html': {
    marker: 'PRIORITY_COHORT_US',
    html: `
<section class="content-section priority-cohort-routes" aria-labelledby="priority-us-salary-routes">
  <!-- PRIORITY_COHORT_US_START -->
  <h2 id="priority-us-salary-routes">Priority US salary routes</h2>
  <p>Use these US salary checkpoints to compare annual salary results, pay-period estimates and state-specific examples without leaving the main salary pathway.</p>
  <div class="link-grid compact">
    <a href="50000-salary-after-tax-us.html">$50,000 salary after tax</a>
    <a href="60000-salary-after-tax-us.html">$60,000 salary after tax</a>
    <a href="75000-salary-after-tax-us.html">$75,000 salary after tax</a>
    <a href="100000-salary-after-tax-us.html">$100,000 salary after tax</a>
    <a href="150000-salary-after-tax-us.html">$150,000 salary after tax</a>
    <a href="200000-salary-after-tax-us.html">$200,000 salary after tax</a>
    <a href="60000-after-tax-monthly-us.html">$60,000 monthly after tax</a>
    <a href="100000-after-tax-weekly-us.html">$100,000 weekly after tax</a>
    <a href="100000-salary-after-tax-california.html">$100,000 after tax in California</a>
    <a href="100000-salary-after-tax-texas.html">$100,000 after tax in Texas</a>
  </div>
  <!-- PRIORITY_COHORT_US_END -->
</section>`
  },
  'salary-after-tax-california.html': {
    marker: 'PRIORITY_COHORT_STATE_CALIFORNIA',
    html: stateSection('California', 'california')
  },
  'salary-after-tax-new-york.html': {
    marker: 'PRIORITY_COHORT_STATE_NEW_YORK',
    html: stateSection('New York', 'new-york')
  },
  'salary-after-tax-texas.html': {
    marker: 'PRIORITY_COHORT_STATE_TEXAS',
    html: stateSection('Texas', 'texas')
  },
  'salary-after-tax-florida.html': {
    marker: 'PRIORITY_COHORT_STATE_FLORIDA',
    html: stateSection('Florida', 'florida')
  }
};

function stateSection(label, slug) {
  const id = `priority-${slug}-salary-routes`;
  return `
<section class="content-section priority-cohort-routes" aria-labelledby="${id}">
  <!-- PRIORITY_COHORT_STATE_${slug.toUpperCase().replace(/-/g, '_')}_START -->
  <h2 id="${id}">Priority ${label} salary checkpoints</h2>
  <p>These common ${label} salary examples give users a cleaner route into the annual, monthly and weekly pages Google has already begun testing.</p>
  <div class="link-grid compact">
    <a href="50000-salary-after-tax-${slug}.html">$50,000 after tax in ${label}</a>
    <a href="75000-salary-after-tax-${slug}.html">$75,000 after tax in ${label}</a>
    <a href="100000-salary-after-tax-${slug}.html">$100,000 after tax in ${label}</a>
    <a href="150000-salary-after-tax-${slug}.html">$150,000 after tax in ${label}</a>
    <a href="176000-salary-after-tax-${slug}.html">$176,000 after tax in ${label}</a>
    <a href="180000-salary-after-tax-${slug}.html">$180,000 after tax in ${label}</a>
    <a href="190000-salary-after-tax-${slug}.html">$190,000 after tax in ${label}</a>
    <a href="200000-salary-after-tax-${slug}.html">$200,000 after tax in ${label}</a>
    <a href="100000-after-tax-monthly-${slug}.html">$100,000 monthly after tax in ${label}</a>
    <a href="100000-after-tax-weekly-${slug}.html">$100,000 weekly after tax in ${label}</a>
  </div>
  <!-- PRIORITY_COHORT_STATE_${slug.toUpperCase().replace(/-/g, '_')}_END -->
</section>`;
}

let changed = 0;
for (const [file, config] of Object.entries(sections)) {
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(config.marker)) continue;
  const insertion = config.html + '\n';
  if (html.includes('</main>')) {
    html = html.replace('</main>', `${insertion}</main>`);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${insertion}</body>`);
  } else {
    throw new Error(`No insertion point found in ${file}`);
  }
  fs.writeFileSync(filePath, html);
  changed++;
  console.log(`Inserted priority routing into ${file}`);
}

console.log(`Files changed: ${changed}`);
