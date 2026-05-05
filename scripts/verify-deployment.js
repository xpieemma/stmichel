#!/usr/bin/env node
import https from 'https';
const BASE_URL = process.env.DEPLOY_URL || 'https://stmichel.ht';
const CHECKS = [
  { name: 'Homepage', url: '/', expectedStatus: 200 },
  { name: 'Service Worker', url: '/service-worker.js', expectedStatus: 200 },
  { name: 'Manifest', url: '/manifest.json', expectedStatus: 200 },
  { name: 'Offline page', url: '/offline.html', expectedStatus: 200 },
  { name: 'API events sync', url: '/api/events/sync', expectedStatus: 200 },
  { name: 'API matches sync', url: '/api/matches/sync', expectedStatus: 200 },
  { name: 'API city sync', url: '/api/city/sync', expectedStatus: 200 },
  { name: 'API albums sync', url: '/api/albums/sync', expectedStatus: 200 },
  { name: 'Security headers', url: '/', checkHeaders: true },
];

async function checkUrl(check) {
  return new Promise((resolve) => {
    const req = https.get(BASE_URL + check.url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = { name: check.name, status: res.statusCode, passed: res.statusCode === check.expectedStatus };
        if (check.checkHeaders) result.passed = result.passed && !!res.headers['content-security-policy'];
        resolve(result);
      });
    });
    req.on('error', (err) => resolve({ name: check.name, passed: false, error: err.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ name: check.name, passed: false, error: 'Timeout' }); });
    req.end();
  });
}

async function main() {
  console.log(`Verifying deployment at ${BASE_URL}...\n`);
  const results = [];
  for (const c of CHECKS) { process.stdout.write(`  ${c.name}... `); const r = await checkUrl(c); results.push(r); console.log(r.passed ? '✅' : '❌'); }
  const passed = results.filter(r => r.passed).length;
  console.log(`\n${passed}/${CHECKS.length} checks passed`);
  if (passed === CHECKS.length) console.log('\n🎉 Deployment verified!');
  else console.log('\n⚠️ Some checks failed.');
}
main();
