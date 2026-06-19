const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://aftertaxtool.com/';

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function localSitemapUrls() {
  const index = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [
    SITE + 'robots.txt',
    SITE + 'sitemap.xml',
    SITE + 'sitemap-clean.xml',
    SITE + 'sitemap-index.xml',
    ...locs(index),
  ];
}

function fetchHead(url, redirects = 0) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
      const location = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && location && redirects < 5) {
        const next = new URL(location, url).toString();
        fetchHead(next, redirects + 1).then((nested) => resolve({
          url,
          status: res.statusCode,
          location: next,
          redirects: 1 + nested.redirects,
          finalUrl: nested.finalUrl,
          finalStatus: nested.finalStatus,
          contentType: nested.contentType,
          xRobotsTag: nested.xRobotsTag,
        }));
        return;
      }
      resolve({
        url,
        status: res.statusCode,
        location: location || '',
        redirects,
        finalUrl: url,
        finalStatus: res.statusCode,
        contentType: res.headers['content-type'] || '',
        xRobotsTag: res.headers['x-robots-tag'] || '',
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (error) => {
      resolve({ url, error: error.message });
    });
    req.end();
  });
}

(async () => {
  const urls = localSitemapUrls();
  const results = [];
  for (const url of urls) {
    results.push(await fetchHead(url));
  }
  const failures = results.filter((r) => r.error || r.finalStatus !== 200 || /^https?:\/\/www\./i.test(r.finalUrl || '') || /^http:\/\//i.test(r.finalUrl || ''));
  const result = {
    checked: results.length,
    failures,
    results,
    pass: failures.length === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exit(1);
})();
