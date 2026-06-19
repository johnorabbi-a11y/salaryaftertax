const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const HOST = 'https://aftertaxtool.com/';
const CHILDREN = ['sitemap-core.xml','sitemap-authority.xml','sitemap-tools.xml','sitemap-uk.xml','sitemap-us-hubs.xml',...Array.from({length:10},(_,i)=>`sitemap-tier${i+1}.xml`)];
const STATES = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont','virginia','washington','west-virginia','wisconsin','wyoming'];
const TIER_GROUPS = [
  ['california','texas','new-york','florida','illinois'],
  ['pennsylvania','ohio','georgia','north-carolina','michigan'],
  ['new-jersey','virginia','washington','arizona','massachusetts'],
  ['tennessee','indiana','missouri','maryland','wisconsin'],
  ['colorado','minnesota','south-carolina','alabama','louisiana'],
  ['kentucky','oregon','oklahoma','connecticut','utah'],
  ['iowa','nevada','arkansas','mississippi','kansas'],
  ['new-mexico','nebraska','idaho','west-virginia','hawaii'],
  ['new-hampshire','maine','rhode-island','montana','delaware'],
  ['south-dakota','north-dakota','alaska','vermont','wyoming']
];
const STATE_TO_TIER = Object.fromEntries(TIER_GROUPS.flatMap((states,i)=>states.map(s=>[s,`sitemap-tier${i+1}.xml`])));
const CORE = new Set(['index.html','salary-after-tax-uk.html','take-home-pay-uk.html','salary-after-tax-us.html','salary-after-tax-by-state.html','planning-calculators.html','salary-guides.html','about.html','editorial-standards.html','methodology.html','tax-assumptions.html']);
const US_HUBS = new Set(['salary-after-tax-us.html','salary-after-tax-by-state.html','us-state-tax-explained.html','how-state-income-tax-affects-paychecks.html','why-salary-after-tax-differs-by-state.html','best-states-for-take-home-pay.html','high-income-by-state.html','salary-vs-cost-of-living-by-state.html']);
const TOOL_HINTS = ['calculator','monthly','weekly','hourly','daily','take-home-pay','gross-vs-net','net-to-gross','income-tax-calculator','salary-tax-calculator','planning-calculators'];
const AUTH_HINTS = ['guide','guides','explained','faq','methodology','editorial','assumptions','comparison','compare','affordability','job-offer','salary-increase','raise','promotion','cost-of-living','pay-rise','bonus','publisher','about'];
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function canonicalOf(html){return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1] || null;}
function fileForUrl(url){if(!url.startsWith(HOST)) return null; const p = new URL(url).pathname; return p==='/' ? 'index.html' : decodeURIComponent(p.replace(/^\//,''));}
function urlForFile(file, canonical){return canonical || (file === 'index.html' ? HOST : HOST + file);}
function isExcluded(file){return /^google[\w-]*\.html$/i.test(file) || file === '404.html' || file.endsWith('.xml.html');}
function stateFromTierPage(file){const re = new RegExp(`^\\d+-(?:salary-after-tax|after-tax-monthly|after-tax-weekly)-(${STATES.join('|')})\\.html$`); return file.match(re)?.[1] || null;}
function isStateHub(file){return STATES.some(s=>file === `salary-after-tax-${s}.html` || file === `${s}-tax-calculator.html` || file === `${s}-paycheck-calculator.html`);}
function groupFor(file){
  const st = stateFromTierPage(file); if(st) return STATE_TO_TIER[st];
  if(CORE.has(file)) return 'sitemap-core.xml';
  if(isStateHub(file) || US_HUBS.has(file) || /(?:state|paycheck|tax)-.*\.html$/.test(file) && file.includes('us-')) return 'sitemap-us-hubs.xml';
  if(/(?:^|-)uk(?:-|\.)/.test(file) || file.startsWith('uk-') || file.includes('national-insurance') || file.includes('paye') || file.includes('hmrc')) return 'sitemap-uk.xml';
  if(/^\d+-(?:salary-after-tax|after-tax-monthly|after-tax-weekly)(?:-us)?\.html$/.test(file)) return 'sitemap-tools.xml';
  if(TOOL_HINTS.some(h=>file.includes(h))) return 'sitemap-tools.xml';
  if(AUTH_HINTS.some(h=>file.includes(h))) return 'sitemap-authority.xml';
  return 'sitemap-authority.xml';
}
const htmlFiles = fs.readdirSync(ROOT).filter(f=>f.endsWith('.html')).sort();
const excluded = [];
const inventory = [];
const canonicalIssues = [];
for(const file of htmlFiles){
  if(isExcluded(file)){excluded.push({file, reason:'technical or verification HTML'}); continue;}
  const html = fs.readFileSync(path.join(ROOT,file),'utf8');
  const canonical = canonicalOf(html);
  const url = urlForFile(file, canonical);
  const mapped = fileForUrl(url);
  if(!url.startsWith(HOST)){excluded.push({file, reason:`non-aftertaxtool canonical: ${url}`}); continue;}
  if(!mapped || !fs.existsSync(path.join(ROOT,mapped))){canonicalIssues.push({file, canonical:url, reason:'canonical target missing locally'}); continue;}
  if(mapped !== file) { excluded.push({file, reason:`canonicalises to ${mapped}`}); continue; }
  inventory.push({file, url, group:groupFor(file)});
}
const groups = Object.fromEntries(CHILDREN.map(c=>[c,[]]));
for(const item of inventory) groups[item.group].push(item.url);
for(const child of CHILDREN){
  const urls = groups[child].sort();
  fs.writeFileSync(path.join(ROOT,child), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url>\n    <loc>${esc(u)}</loc>\n  </url>`).join('\n')}\n</urlset>\n`, 'utf8');
}
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${CHILDREN.map(c=>`  <sitemap>\n    <loc>${HOST}${c}</loc>\n  </sitemap>`).join('\n')}\n</sitemapindex>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), indexXml, 'utf8');
fs.writeFileSync(path.join(ROOT,'sitemap-clean.xml'), indexXml, 'utf8');
if(fs.existsSync(path.join(ROOT,'sitemap-index.xml'))) fs.writeFileSync(path.join(ROOT,'sitemap-index.xml'), indexXml, 'utf8');
fs.writeFileSync(path.join(ROOT,'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${HOST}sitemap.xml\n`, 'utf8');
const summary = {totalHtml:htmlFiles.length,indexable:inventory.length,excluded,canonicalIssues,counts:Object.fromEntries(CHILDREN.map(c=>[c,groups[c].length])),tierGroups:Object.fromEntries(TIER_GROUPS.map((states,i)=>[`sitemap-tier${i+1}.xml`,states]))};
fs.writeFileSync(path.join(ROOT,'sitemap-segmentation-summary.json'), JSON.stringify(summary,null,2), 'utf8');
console.log(JSON.stringify({indexable:inventory.length, excluded:excluded.length, canonicalIssues:canonicalIssues.length, counts:summary.counts}, null, 2));
