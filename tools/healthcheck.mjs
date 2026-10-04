// Health check for the live soulcraft.me funnel. Zero dependencies, node builtins only.
//
// The night shift runs this when the issue queue is empty. It exists because on
// 2026-10-03 www.wellmate.me had been pointed at Amplify but had no certificate
// covering it, so every visit failed the TLS handshake and the redirect to
// soulcraft.me never fired. DNS looked right. Nothing was watching the handshake.
//
// Three outcomes, because a cloud session cannot always reach the internet:
//
//   exit 0   everything passed.
//   exit 1   at least one real FAIL. The night shift opens or updates an issue,
//            and after a merge this is what triggers a revert.
//   exit 2   inconclusive: something was BLOCKED at the network level, so the
//            check could not form an opinion. Never revert on this.
//
// The BLOCK state exists because the cloud sandbox has an egress allowlist. A
// host that is not on it refuses CONNECT, which from here is indistinguishable
// from the site being down unless we look at the error type. On 2026-10-04 the
// sibling script in app_tech_ops reported 7 of 8 apps down for exactly this
// reason while everything was healthy (app_tech_ops#58). WARN never fails.

import { resolve4, resolveTxt, resolveCname, resolveMx } from 'node:dns/promises';
import tls from 'node:tls';
import { readFile } from 'node:fs/promises';

const results = [];
const pass = (name, detail = '') => results.push({ level: 'PASS', name, detail });
const warn = (name, detail) => results.push({ level: 'WARN', name, detail });
const fail = (name, detail) => results.push({ level: 'FAIL', name, detail });
const block = (name, detail) => results.push({ level: 'BLOCK', name, detail });

// Is this error the network refusing us, rather than the target misbehaving?
// Those are opposite conclusions: one means "we cannot see", the other means
// "it is broken", and only the second justifies a revert.
const NET_CODES = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET',
  'EHOSTUNREACH', 'ENETUNREACH', 'EPROTO', 'UND_ERR_CONNECT_TIMEOUT',
]);
function isNetwork(e) {
  if (!e) return false;
  if (e.name === 'AbortError') return true;                  // our own timeout
  for (const err of [e, e.cause, e.cause?.cause]) {
    if (err?.code && NET_CODES.has(err.code)) return true;
  }
  // undici wraps a refused CONNECT as a bare "fetch failed" with no code.
  return e.message === 'fetch failed' && !e.cause?.code;
}
// Record an exception as BLOCK or FAIL depending on which it actually was.
const net = (name, e, suffix = '') =>
  (isNetwork(e) ? block : fail)(name, `${e.message}${e.code ? ` (${e.code})` : ''}${suffix}`);

const TIMEOUT = 20000;

async function http(url, { method = 'GET' } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    // redirect: manual so a 301 is observable rather than silently followed.
    return await fetch(url, { method, redirect: 'manual', signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Reads the certificate actually served for a hostname and returns its SAN list.
// A CNAME pointing at the right distribution proves nothing if no cert covers the name.
function certNames(host) {
  return new Promise((res) => {
    const sock = tls.connect(
      { host, port: 443, servername: host, timeout: TIMEOUT, rejectUnauthorized: false },
      () => {
        const cert = sock.getPeerCertificate();
        const alt = (cert.subjectaltname || '')
          .split(',')
          .map((s) => s.trim().replace(/^DNS:/, ''))
          .filter(Boolean);
        sock.end();
        res({ ok: true, names: alt, subject: cert.subject?.CN || '' });
      }
    );
    sock.on('error', (e) => res({ ok: false, error: e.message, code: e.code }));
    sock.on('timeout', () => { sock.destroy(); res({ ok: false, error: 'timeout', code: 'ETIMEDOUT' }); });
  });
}

// Does the served certificate cover this exact hostname, wildcards included?
const covers = (names, host) =>
  names.some((n) =>
    n === host ||
    (n.startsWith('*.') && host.endsWith(n.slice(1)) && host.split('.').length === n.split('.').length)
  );

// ---------------------------------------------------------------- the pages

for (const url of ['https://www.soulcraft.me/', 'https://www.soulcraft.me/thanks']) {
  try {
    const r = await http(url);
    if (r.status === 200) pass(`GET ${url}`, '200');
    else fail(`GET ${url}`, `expected 200, got ${r.status}`);
  } catch (e) {
    net(`GET ${url}`, e);
  }
}

// The apex must reach the site, directly or by redirect. Either is fine.
try {
  const r = await http('https://soulcraft.me/');
  if (r.status === 200) pass('GET https://soulcraft.me/', '200, served directly');
  else if ([301, 302, 307, 308].includes(r.status)) {
    pass('GET https://soulcraft.me/', `${r.status} to ${r.headers.get('location')}`);
  } else fail('GET https://soulcraft.me/', `expected 200 or a redirect, got ${r.status}`);
} catch (e) {
  net('GET https://soulcraft.me/', e);
}

// ------------------------------------------------- certificates, both domains

for (const host of ['www.soulcraft.me', 'soulcraft.me']) {
  const c = await certNames(host);
  if (!c.ok) net(`TLS ${host}`, Object.assign(new Error(c.error), { code: c.code }));
  else if (covers(c.names, host)) pass(`TLS ${host}`, c.names.join(', '));
  else fail(`TLS ${host}`, `certificate does not cover it. SANs: ${c.names.join(', ') || '(none)'}`);
}

// wellmate.me is being retired and www must carry the 301 to soulcraft.me.
// Tracked in issue #31. A WARN, not a FAIL: it is a known open problem, and the
// night shift should not treat a known problem as a new breakage every night.
{
  const host = 'www.wellmate.me';
  const c = await certNames(host);
  if (!c.ok) warn(`TLS ${host}`, `${c.error} (issue #31)`);
  else if (covers(c.names, host)) {
    try {
      const r = await http(`https://${host}/`);
      const loc = r.headers.get('location') || '';
      if (loc.includes('soulcraft.me')) pass(`${host} redirect`, `${r.status} to ${loc}`);
      else if (r.status === 200) warn(`${host} redirect`, 'certificate is fixed, but www still serves the old wellmate site instead of redirecting (issue #31)');
      else warn(`${host} redirect`, `certificate is fixed, but the redirect goes to "${loc}" (issue #31)`);
    } catch (e) {
      warn(`${host} redirect`, `${e.message} (issue #31)`);
    }
  } else warn(`TLS ${host}`, `no certificate covers it, so the 301 cannot fire (issue #31)`);
}

// ------------------------------------------------------------------- the DNS

try {
  const txt = (await resolveTxt('soulcraft.me')).map((r) => r.join(''));
  const spf = txt.find((t) => t.startsWith('v=spf1'));
  if (!spf) fail('soulcraft.me SPF', 'no v=spf1 record');
  else {
    const wantedBy = { 'spf.protection.outlook.com': 'Microsoft 365', 'sendersrv.com': 'Sender.net' };
    const missing = Object.keys(wantedBy).filter((inc) => !spf.includes(inc));
    if (missing.length) {
      fail('soulcraft.me SPF', `missing ${missing.map((m) => `${m} (${wantedBy[m]})`).join(' and ')}. Record: ${spf}`);
    } else pass('soulcraft.me SPF', spf);
    // Two SPF records is a hard email failure, so count them explicitly.
    const count = txt.filter((t) => t.startsWith('v=spf1')).length;
    if (count > 1) fail('soulcraft.me SPF', `${count} SPF records, must be exactly 1`);
  }
} catch (e) {
  // ENOTFOUND/ENODATA from a resolver is a real DNS answer; anything else is reachability.
  (['ENOTFOUND', 'ENODATA'].includes(e.code) ? fail : block)('soulcraft.me SPF', `${e.message} (${e.code})`);
}

try {
  const mx = await resolveMx('soulcraft.me');
  if (mx.length) pass('soulcraft.me MX', mx.map((m) => m.exchange).join(', '));
  else fail('soulcraft.me MX', 'no MX records, inbound email is dead');
} catch (e) {
  (['ENOTFOUND', 'ENODATA'].includes(e.code) ? fail : block)('soulcraft.me MX', `${e.message} (${e.code})`);
}

try {
  const cname = await resolveCname('www.soulcraft.me').catch(() => null);
  const a = cname ? null : await resolve4('soulcraft.me').catch(() => null);
  pass('soulcraft.me resolution', cname ? `www CNAME ${cname.join(', ')}` : `apex A ${(a || []).join(', ')}`);
} catch (e) {
  warn('soulcraft.me resolution', e.message);
}

// ------------------------------------------- the funnel links, read from main.js

const js = await readFile(new URL('../main.js', import.meta.url), 'utf8');
const constant = (name) => (js.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`)) || [])[1] || '';

for (const name of ['STRIPE_LINK', 'BOOKING_URL', 'FORM_ENDPOINT']) {
  const url = constant(name);
  if (!url) { fail(name, 'empty in main.js, so the page falls back to mailto'); continue; }
  try {
    // GET, not HEAD: Stripe and Microsoft both answer HEAD with 405.
    const r = await http(url);
    if (r.status < 400) pass(name, `${r.status}`);
    else if (name === 'FORM_ENDPOINT' && r.status === 405) pass(name, '405 to GET, which is correct for a POST-only endpoint');
    else fail(name, `${r.status}, so the live funnel is broken at this step`);
  } catch (e) {
    net(name, e);
  }
}

// The branded email's images are hosted on the site, so a rename breaks sent mail.
for (const path of ['assets/logo-email.png', 'assets/logo-email-on-dark.png']) {
  try {
    const r = await http(`https://www.soulcraft.me/${path}`);
    if (r.status === 200) pass(`asset ${path}`, '200');
    else fail(`asset ${path}`, `${r.status}, so already-sent emails show a broken image`);
  } catch (e) {
    net(`asset ${path}`, e);
  }
}

// --------------------------------------------------------- Ed's standing rule

try {
  const html = await (await http('https://www.soulcraft.me/')).text();
  if (html.includes('\u2014')) fail('no em dashes', 'the live page contains the forbidden dash character');
  else pass('no em dashes', 'clean');
} catch (e) {
  warn('no em dashes', e.message);
}

// ----------------------------------------------------------------- the report

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  console.log(`${r.level.padEnd(4)}  ${r.name.padEnd(width)}  ${r.detail}`);
}
const fails = results.filter((r) => r.level === 'FAIL');
const warns = results.filter((r) => r.level === 'WARN');
const blocks = results.filter((r) => r.level === 'BLOCK');
const passes = results.length - fails.length - warns.length - blocks.length;
console.log(`\n${passes} passed, ${warns.length} warned, ${blocks.length} blocked, ${fails.length} failed`);

if (fails.length) {
  console.log('RESULT: FAILED. After a merge, revert it.');
  process.exit(1);
}
if (blocks.length) {
  console.log('RESULT: INCONCLUSIVE. These could not be reached at all:');
  for (const b of blocks) console.log(`  - ${b.name}`);
  console.log('Add the hosts to the cloud environment allowlist. Do not revert on this.');
  process.exit(2);
}
console.log('RESULT: all checks passed.');
process.exit(0);
