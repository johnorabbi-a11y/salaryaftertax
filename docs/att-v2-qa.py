import csv, json, re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
from xml.etree import ElementTree as ET
from collections import Counter, deque, defaultdict

ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT/'att-v2-build'
DOCS=ROOT/'docs'
BASE='https://aftertaxtool.com'

class LinkParser(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.assets=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if tag=='a' and d.get('href'): self.links.append(d['href'])
        if tag in {'script','link','img'}:
            val=d.get('src') or d.get('href')
            if val: self.assets.append(val)

def read_csv(p):
    with open(p,encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
def local_for_url(u):
    if u=='/': return BUILD/'index.html'
    clean=u.lstrip('/')
    return BUILD/clean/'index.html' if clean.endswith('/') else BUILD/clean
def url_for_file(p):
    rel=p.relative_to(BUILD).as_posix()
    if rel=='index.html': return '/'
    if rel.endswith('/index.html'): return '/' + rel[:-11] + '/'
    return '/' + rel

def main():
    inv=read_csv(DOCS/'att-v2-final-url-inventory.csv')
    intended=[r['proposed_url'] for r in inv]
    html_files=[p for p in BUILD.rglob('*.html')]
    issues=[]; titles=[]; metas=[]; h1s=[]; canon=[]; graph=defaultdict(set); inbound=Counter(); external=[]
    for u in intended:
        if not local_for_url(u).exists(): issues.append(f'missing file for {u}')
    for f in html_files:
        txt=f.read_text(encoding='utf-8')
        u=url_for_file(f)
        title=re.findall(r'<title>(.*?)</title>',txt,re.I|re.S); meta=re.findall(r'<meta name="description" content="(.*?)"',txt,re.I|re.S); h1=re.findall(r'<h1[^>]*>(.*?)</h1>',txt,re.I|re.S); ca=re.findall(r'<link rel="canonical" href="(.*?)"',txt,re.I|re.S)
        if len(title)!=1: issues.append(f'{u} title count {len(title)}')
        if len(meta)!=1: issues.append(f'{u} meta description count {len(meta)}')
        if len(h1)!=1: issues.append(f'{u} h1 count {len(h1)}')
        if len(ca)!=1: issues.append(f'{u} canonical count {len(ca)}')
        if ca and ca[0] != BASE + ('/' if u=='/' else u): issues.append(f'{u} canonical mismatch {ca[0]}')
        if title: titles.append((title[0],u))
        if meta: metas.append((meta[0],u))
        if h1: h1s.append((re.sub('<.*?>','',h1[0]),u))
        if ca: canon.append((ca[0],u))
        if re.search(r'lorem ipsum|TODO|placeholder|scaffold|remediation',txt,re.I): issues.append(f'{u} placeholder wording')
        if re.search(r'\?\d{1,3},\d{3}|�|Â£',txt): issues.append(f'{u} currency/encoding artefact')
        if 'data-calc-type=' in txt and 'data-result' not in txt: issues.append(f'{u} calculator missing result panel')
        p=LinkParser(); p.feed(txt)
        for href in p.links+p.assets:
            if href.startswith(('http://','https://')):
                if href.startswith(BASE): href=href.replace(BASE,'') or '/'
                else:
                    external.append((u,href)); continue
            if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'): continue
            if href.startswith('/'):
                target=local_for_url(href)
                if not target.exists(): issues.append(f'{u} broken internal link {href}')
                else: graph[u].add(href); inbound[href]+=1
    for label,vals in [('title',titles),('meta',metas),('h1',h1s),('canonical',canon)]:
        c=Counter(v for v,u in vals)
        for val,n in c.items():
            if n>1: issues.append(f'duplicate {label}: {val[:80]} ({n})')
    sitemap=ET.fromstring((BUILD/'sitemap.xml').read_text(encoding='utf-8'))
    ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
    locs=[n.find('sm:loc',ns).text for n in sitemap.findall('sm:url',ns)]
    if len(locs)!=len(set(locs)): issues.append('duplicate sitemap URL')
    expected=[BASE+('/' if u=='/' else u) for u in intended]
    if set(locs)!=set(expected): issues.append('sitemap/inventory parity mismatch')
    old_salary=[x for x in locs if re.search(r'/\d+-(salary-after-tax|after-tax-monthly|after-tax-weekly)',x) and not re.search(r'/(30000|40000|50000|60000|80000|100000|150000|200000)-salary-after-tax-(uk|us)\.html$',x)]
    if old_salary: issues.append(f'old salary URLs in V2 sitemap: {len(old_salary)}')
    # crawl depth
    seen={'/':0}; q=deque(['/'])
    while q:
        cur=q.popleft()
        for nxt in graph[cur]:
            if nxt not in seen:
                seen[nxt]=seen[cur]+1; q.append(nxt)
    unreachable=[u for u in intended if u not in seen]
    zero=[u for u in intended if u!='/' and inbound[u]==0]
    depths=sorted(seen[u] for u in intended if u in seen)
    p95=depths[int(len(depths)*.95)-1] if depths else None
    # similarity rough: compare stripped body text prefixes
    bodies=[]
    for f in html_files:
        txt=f.read_text(encoding='utf-8')
        body=re.sub(r'<(header|footer|script|style).*?</\1>',' ',txt,flags=re.I|re.S)
        body=re.sub(r'<[^>]+>',' ',body); body=re.sub(r'\s+',' ',body).strip().lower()
        bodies.append((url_for_file(f),body[:900]))
    sim=Counter(b for u,b in bodies)
    duplicate_bodies=sum(1 for b,n in sim.items() if n>1)
    report={'intended_urls':len(intended),'html_files':len(html_files),'sitemap_urls':len(locs),'issues':issues[:200],'issue_count':len(issues),'unreachable_count':len(unreachable),'zero_inbound_count':len(zero),'average_depth':round(sum(depths)/len(depths),2) if depths else None,'median_depth':depths[len(depths)//2] if depths else None,'p95_depth':p95,'max_depth':max(depths) if depths else None,'external_links':len(external),'duplicate_body_prefix_groups':duplicate_bodies,'calculator_pages':sum(1 for f in html_files if 'data-calc-type=' in f.read_text(encoding='utf-8'))}
    (DOCS/'att-v2-final-qa-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
    raise SystemExit(1 if issues or unreachable or zero else 0)
if __name__=='__main__': main()


