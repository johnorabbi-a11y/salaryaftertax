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
const requiredHome = [
  'salary-after-tax-us.html',
  'salary-after-tax-uk.html',
  'salary-after-tax-by-state.html',
  'planning-calculators.html',
  'methodology.html',
  'tax-assumptions.html',
  'editorial-standards.html',
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function hrefs(file) {
  const html = read(file);
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((m) => normalizeHref(m[1]));
}

function normalizeHref(href) {
  return href
    .replace(/^https:\/\/aftertaxtool\.com\//, '')
    .replace(/^\//, '')
    .split('#')[0];
}

function hasLink(file, target) {
  return hrefs(file).some((href) => href === target);
}

function canonical(file) {
  const html = read(file);
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  return match ? match[1] : '';
}

const issues = [];
const warnings = [];
for (const target of requiredHome) {
  if (!hasLink('index.html', target)) issues.push({ file: 'index.html', issue: 'missing required homepage route', target });
}
if (!hasLink('salary-after-tax-us.html', 'salary-after-tax-by-state.html')) {
  issues.push({ file: 'salary-after-tax-us.html', issue: 'missing state gateway route', target: 'salary-after-tax-by-state.html' });
}

for (const state of states) {
  const hub = `salary-after-tax-${state}.html`;
  if (!fs.existsSync(path.join(ROOT, hub))) {
    issues.push({ file: hub, issue: 'state hub missing' });
    continue;
  }
  if (!hasLink('salary-after-tax-by-state.html', hub)) {
    issues.push({ file: 'salary-after-tax-by-state.html', issue: 'state gateway missing state hub link', target: hub });
  }
  const hubLinks = hrefs(hub);
  for (const target of ['methodology.html', 'tax-assumptions.html', 'salary-after-tax-us.html', 'salary-after-tax-by-state.html']) {
    if (!hubLinks.some((href) => href === target)) {
      issues.push({ file: hub, issue: 'state hub missing authority/navigation link', target });
    }
  }
  for (const salary of [60000, 100000, 200000]) {
    const annual = `${salary}-salary-after-tax-${state}.html`;
    const monthly = `${salary}-after-tax-monthly-${state}.html`;
    const weekly = `${salary}-after-tax-weekly-${state}.html`;
    for (const file of [annual, monthly, weekly]) {
      if (!fs.existsSync(path.join(ROOT, file))) {
        issues.push({ file, issue: 'sample salary page missing' });
        continue;
      }
      const links = hrefs(file);
      const criticalNeeded = [];
      const warningNeeded = [hub, 'methodology.html', 'tax-assumptions.html'];
      if (file !== annual) criticalNeeded.push(annual);
      if (file !== monthly) criticalNeeded.push(monthly);
      if (file !== weekly) criticalNeeded.push(weekly);
      for (const target of criticalNeeded) {
        if (!links.some((href) => href === target)) {
          issues.push({ file, issue: 'sample salary page missing required route', target });
        }
      }
      for (const target of warningNeeded) {
        if (!links.some((href) => href === target)) {
          warnings.push({ file, issue: 'sample salary page missing direct context route', target });
        }
      }
      const self = file === 'index.html' ? 'https://aftertaxtool.com/' : `https://aftertaxtool.com/${file}`;
      if (canonical(file) !== self) issues.push({ file, issue: 'sample salary page canonical mismatch', canonical: canonical(file), expected: self });
    }
  }
}

const result = {
  statesChecked: states.length,
  homepageRoutesChecked: requiredHome.length,
  sampleSalaryPagesChecked: states.length * 3 * 3,
  issues,
  warnings,
  pass: issues.length === 0,
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
