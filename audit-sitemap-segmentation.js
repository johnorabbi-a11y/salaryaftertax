const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const HOST = 'https://aftertaxtool.com/';
const CHILDREN = ['sitemap-core.xml','sitemap-authority.xml','sitemap-tools.xml','sitemap-uk.xml','sitemap-us-hubs.xml',...Array.from({length:10},(_,i)=>`sitemap-tier${i+1}.xml`)];
function locs(xml){return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);}
function canonicalOf(html){return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1] || null;}
function fileForUrl(url){if(!url.startsWith(HOST)) return null; const p = new URL(url).pathname; return p==='/' ? 'index.html' : decodeURIComponent(p.replace(/^\//,''));}
function isExcluded(file){return /^google[\w-]*\.html$/i.test(file) || file === '404.html' || file.endsWith('.xml.html');}
function indexableFiles(){
  const files = fs.readdirSync(ROOT).filter(f=>f.endsWith('.html')).sort();
  const indexable = [];
  const excluded = [];
  for(const file of files){
    if(isExcluded(file)){excluded.push({file, reason:'technical or verification HTML'}); continue;}
    const html = fs.readFileSync(path.join(ROOT,file),'utf8');
    const canonical = canonicalOf(html) || (file === 'index.html' ? HOST : HOST + file);
    const mapped = fileForUrl(canonical);
    if(!canonical.startsWith(HOST)){excluded.push({file, reason:`non-aftertaxtool canonical: ${canonical}`}); continue;}
    if(!mapped || !fs.existsSync(path.join(ROOT,mapped))){excluded.push({file, reason:`canonical target missing locally: ${canonical}`}); continue;}
    if(mapped !== file){excluded.push({file, reason:`canonicalises to ${mapped}`}); continue;}
    indexable.push({file, url:canonical});
  }
  return {files,indexable,excluded};
}
const rootFiles = fs.readdirSync(ROOT);
const lowerFileMap = new Map(rootFiles.map(f=>[f.toLowerCase(), f]));
const sitemapIndex = fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
const indexLocs = locs(sitemapIndex);
const childRefs = CHILDREN.map(c=>HOST+c);
const childReferenceFailures = childRefs.filter(u=>!indexLocs.includes(u));
const unexpectedIndexRefs = indexLocs.filter(u=>!childRefs.includes(u));
const childCounts = {};
const allUrls = [];
const childErrors = [];
for(const child of CHILDREN){
  const p = path.join(ROOT, child);
  if(!fs.existsSync(p)){childErrors.push({child, error:'missing child sitemap'}); continue;}
  const xml = fs.readFileSync(p,'utf8');
  const urls = locs(xml);
  childCounts[child] = urls.length;
  for(const url of urls) allUrls.push({child,url});
}
const urlToChildren = new Map();
for(const item of allUrls){
  if(!urlToChildren.has(item.url)) urlToChildren.set(item.url, []);
  urlToChildren.get(item.url).push(item.child);
}
const duplicates = [...urlToChildren.entries()].filter(([,children])=>children.length>1).map(([url,children])=>({url,children}));
const malformed = allUrls.filter(({url})=>{
  try { const u = new URL(url); return u.protocol !== 'https:' || u.hostname !== 'aftertaxtool.com' || /\s/.test(url) || url.includes('www.'); }
  catch { return true; }
});
const missingFiles = [];
const caseMismatches = [];
for(const {child,url} of allUrls){
  const file = fileForUrl(url);
  if(!file || !fs.existsSync(path.join(ROOT,file))) missingFiles.push({child,url,file});
  else {
    const actual = lowerFileMap.get(file.toLowerCase());
    if(actual && actual !== file) caseMismatches.push({child,url,file,actual});
  }
}
const {files:htmlFiles,indexable,excluded} = indexableFiles();
const expectedUrls = indexable.map(x=>x.url).sort();
const sitemapUrls = [...urlToChildren.keys()].sort();
const sitemapSet = new Set(sitemapUrls);
const expectedSet = new Set(expectedUrls);
const missingFromSitemaps = expectedUrls.filter(u=>!sitemapSet.has(u));
const extraInSitemaps = sitemapUrls.filter(u=>!expectedSet.has(u));
const requiredMajor = ['https://aftertaxtool.com/','https://aftertaxtool.com/salary-after-tax-us.html','https://aftertaxtool.com/salary-after-tax-by-state.html','https://aftertaxtool.com/salary-after-tax-uk.html','https://aftertaxtool.com/planning-calculators.html'];
const stateSlugs = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont','virginia','washington','west-virginia','wisconsin','wyoming'];
for(const s of stateSlugs) requiredMajor.push(`${HOST}salary-after-tax-${s}.html`);
const missingMajor = requiredMajor.filter(u=>!sitemapSet.has(u));
const robots = fs.existsSync(path.join(ROOT,'robots.txt')) ? fs.readFileSync(path.join(ROOT,'robots.txt'),'utf8') : '';
const robotsSitemaps = [...robots.matchAll(/^Sitemap:\s*(\S+)/gmi)].map(m=>m[1]);
const cleanXml = fs.existsSync(path.join(ROOT,'sitemap-clean.xml')) ? fs.readFileSync(path.join(ROOT,'sitemap-clean.xml'),'utf8') : '';
const indexXml = fs.existsSync(path.join(ROOT,'sitemap-index.xml')) ? fs.readFileSync(path.join(ROOT,'sitemap-index.xml'),'utf8') : '';
const result = {
  childCounts,
  totalSitemapUrls: allUrls.length,
  uniqueSitemapUrls: sitemapUrls.length,
  localHtmlCount: htmlFiles.length,
  localIndexableHtmlCount: indexable.length,
  excludedFiles: excluded,
  childReferenceFailures,
  unexpectedIndexRefs,
  duplicates,
  missingFiles,
  caseMismatches,
  malformed,
  missingFromSitemaps,
  extraInSitemaps,
  missingMajor,
  robotsSitemaps,
  robotsOk: robotsSitemaps.length === 1 && robotsSitemaps[0] === HOST + 'sitemap.xml',
  sitemapXmlIsIndex: /<sitemapindex\b/.test(sitemapIndex),
  sitemapCleanStatus: cleanXml === sitemapIndex ? 'mirrors sitemap.xml sitemap index' : 'differs from sitemap.xml',
  sitemapIndexStatus: indexXml ? (indexXml === sitemapIndex ? 'matches sitemap.xml sitemap index' : 'differs from sitemap.xml') : 'not present'
};
fs.writeFileSync(path.join(ROOT,'sitemap-segmentation-audit.json'), JSON.stringify(result,null,2), 'utf8');
console.log(JSON.stringify(result, null, 2));
if(childReferenceFailures.length || unexpectedIndexRefs.length || duplicates.length || missingFiles.length || caseMismatches.length || malformed.length || missingFromSitemaps.length || extraInSitemaps.length || missingMajor.length || !result.robotsOk || !result.sitemapXmlIsIndex || result.sitemapCleanStatus !== 'mirrors sitemap.xml sitemap index') process.exitCode = 1;

