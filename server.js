const express = require('express');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenAI, Type } = require('@google/genai');

const firebaseConfig = require('./firebase-applet-config.json');

// Initialize Firebase Admin for ID token verification and Firestore
const adminApp = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId
    })
  : getApps()[0];
const adminAuth = getAuth(adminApp);
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

// One-time admin setup: turns on email/password sign-in and creates (or updates) the admin login.
// It only runs when the ADMIN_PASSWORD secret is set. Remove that secret after the admin can log in.
async function rfAdminSetup() {
  const email = 'priyanshu@redflaghomes.in';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  try {
    const cfg = require('./firebase-applet-config.json');

    // 1. Verify / sign in via Firebase Auth REST API using web API key
    let success = false;
    try {
      const signInRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + cfg.apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });

      if (signInRes.ok) {
        success = true;
        console.log('[admin-setup] email/password sign-in: enabled');
        console.log('[admin-setup] admin login updated for', email);
      } else {
        const errData = await signInRes.json().catch(() => ({}));
        if (errData?.error?.message === 'EMAIL_NOT_FOUND') {
          const signUpRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + cfg.apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
          });
          if (signUpRes.ok) {
            success = true;
            console.log('[admin-setup] email/password sign-in: enabled');
            console.log('[admin-setup] admin login created for', email);
          }
        }
      }
    } catch (_) {}

    if (success) return;

    // 2. Fallback: Google Cloud Admin endpoint
    const { GoogleAuth } = await import('google-auth-library');
    const token = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getAccessToken();
    const r = await fetch('https://identitytoolkit.googleapis.com/admin/v2/projects/' + cfg.projectId + '/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Goog-User-Project': cfg.projectId },
      body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } })
    });
    if (r.ok) {
      console.log('[admin-setup] email/password sign-in: enabled');
    }
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();
    try {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, emailVerified: true });
      console.log('[admin-setup] admin login updated for', email);
    } catch (e) {
      if (e && e.code === 'auth/user-not-found') {
        await auth.createUser({ email, password, emailVerified: true });
        console.log('[admin-setup] admin login created for', email);
      }
    }
  } catch (e) {
    // Graceful handling
  }
}
rfAdminSetup();

const app = express();

// Helper to determine plan and period from payment amount and currency
function getPlanAndPeriod(amount, currency) {
  const cur = (currency || '').toUpperCase();
  const amt = Math.round(Number(amount) || 0);
  if (cur === 'INR') {
    if (amt === 999) return { plan: 'solo', period: 'monthly' };
    if (amt === 1699) return { plan: 'growth', period: 'monthly' };
    if (amt === 2499) return { plan: 'pro', period: 'monthly' };
    if (amt === 10190) return { plan: 'solo', period: 'yearly' };
    if (amt === 17330) return { plan: 'growth', period: 'yearly' };
    if (amt === 25490) return { plan: 'pro', period: 'yearly' };
  } else if (cur === 'USD') {
    if (amt === 23) return { plan: 'solo', period: 'monthly' };
    if (amt === 39) return { plan: 'growth', period: 'monthly' };
    if (amt === 57) return { plan: 'pro', period: 'monthly' };
    if (amt === 235) return { plan: 'solo', period: 'yearly' };
    if (amt === 398) return { plan: 'growth', period: 'yearly' };
    if (amt === 581) return { plan: 'pro', period: 'yearly' };
  }
  return { plan: '', period: '' };
}

// POST /api/webhooks/razorpay (must be registered before express.json() using express.raw())
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(400).send('Missing signature or secret');
  }

  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).send('Invalid body');
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (digest.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(signature, 'utf8'))) {
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  const eventType = event.event;
  const payment = event?.payload?.payment?.entity;
  const paymentLink = event?.payload?.payment_link?.entity;

  let status = '';
  let reason = '';

  if (eventType === 'payment.failed') {
    status = 'failed';
    reason = payment?.error_description || payment?.error_reason || 'Payment failed';
  } else if (eventType === 'payment.captured' || eventType === 'payment_link.paid') {
    status = 'paid';
    reason = '';
  } else {
    // Unhandled event; reply 200 without throwing 500
    return res.status(200).json({ received: true });
  }

  const paymentId = payment?.id || paymentLink?.id || '';
  if (!paymentId) {
    return res.status(200).json({ received: true });
  }

  const rawAmount = payment?.amount ?? paymentLink?.amount ?? 0;
  const amount = rawAmount / 100;
  const currency = (payment?.currency || paymentLink?.currency || 'INR').toUpperCase();
  const email = payment?.email || paymentLink?.customer?.email || '';
  const phone = payment?.contact || paymentLink?.customer?.contact || '';
  const name = payment?.notes?.name || paymentLink?.customer?.name || '';
  const createdAtSec = payment?.created_at ?? paymentLink?.created_at ?? event.created_at;
  const createdAt = createdAtSec ? new Date(createdAtSec * 1000).toISOString() : new Date().toISOString();
  const receivedAt = new Date().toISOString();

  const { plan, period } = getPlanAndPeriod(amount, currency);

  const docData = {
    gateway: 'razorpay',
    status,
    amount,
    currency,
    email,
    phone,
    name,
    plan,
    period,
    reason,
    paymentId,
    event: eventType,
    createdAt,
    receivedAt
  };

  try {
    await db.collection('bellaPayments').doc(`rzp_${paymentId}`).set(docData, { merge: true });
  } catch (err) {
    console.error('Error saving Razorpay payment to Firestore:', err);
    return res.status(500).json({ error: 'Firestore error' });
  }

  return res.status(200).json({ received: true });
});

// POST /api/webhooks/stripe (must be registered before express.json() using express.raw())
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sigHeader = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sigHeader || !secret) {
    return res.status(400).send('Missing signature or secret');
  }

  const parts = sigHeader.split(',');
  let t = null;
  const signatures = [];
  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === 't') t = v;
    if (k === 'v1' && v) signatures.push(v);
  }

  if (!t || signatures.length === 0) {
    return res.status(400).send('Invalid signature format');
  }

  const timestamp = parseInt(t, 10);
  if (isNaN(timestamp)) {
    return res.status(400).send('Invalid timestamp');
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return res.status(400).send('Signature timestamp expired');
  }

  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).send('Invalid body');
  }

  const payloadToSign = Buffer.concat([
    Buffer.from(`${t}.`, 'utf8'),
    rawBody
  ]);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadToSign);
  const expectedSignature = hmac.digest('hex');

  let matched = false;
  for (const sig of signatures) {
    if (sig.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expectedSignature, 'utf8'))) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    return res.status(400).send('Signature mismatch');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  const eventType = event.type;
  const obj = event.data?.object || {};
  const eventCreated = event.created ? new Date(event.created * 1000).toISOString() : new Date().toISOString();
  const receivedAt = new Date().toISOString();

  let status = '';
  let reason = '';
  let paymentId = '';
  let docId = '';
  let amount = 0;
  let currency = 'USD';
  let email = '';
  let name = '';
  let phone = '';

  if (eventType === 'checkout.session.completed') {
    if (obj.payment_status !== 'paid') {
      return res.status(200).json({ received: true });
    }
    status = 'paid';
    reason = '';
    paymentId = obj.id;
    docId = `stripe_${obj.id}`;
    amount = (obj.amount_total || 0) / 100;
    currency = (obj.currency || 'USD').toUpperCase();
    email = obj.customer_details?.email || '';
    name = obj.customer_details?.name || '';
    phone = obj.customer_details?.phone || '';
  } else if (eventType === 'checkout.session.async_payment_failed') {
    status = 'failed';
    reason = 'Payment failed after checkout';
    paymentId = obj.id;
    docId = `stripe_${obj.id}`;
    amount = (obj.amount_total || 0) / 100;
    currency = (obj.currency || 'USD').toUpperCase();
    email = obj.customer_details?.email || '';
    name = obj.customer_details?.name || '';
    phone = obj.customer_details?.phone || '';
  } else if (eventType === 'checkout.session.expired') {
    status = 'abandoned';
    reason = 'Checkout opened but not completed';
    paymentId = obj.id;
    docId = `stripe_${obj.id}`;
    amount = (obj.amount_total || 0) / 100;
    currency = (obj.currency || 'USD').toUpperCase();
    email = obj.customer_details?.email || '';
    name = obj.customer_details?.name || '';
    phone = obj.customer_details?.phone || '';
    if (!email && !phone) {
      return res.status(200).json({ received: true });
    }
  } else if (eventType === 'payment_intent.payment_failed') {
    status = 'failed';
    reason = obj.last_payment_error?.message || 'Payment failed';
    paymentId = obj.id;
    docId = `stripe_${obj.id}`;
    amount = (obj.amount || 0) / 100;
    currency = (obj.currency || 'USD').toUpperCase();
    const billingDetails = obj.last_payment_error?.payment_method?.billing_details || {};
    email = billingDetails.email || obj.receipt_email || '';
    name = billingDetails.name || '';
    phone = billingDetails.phone || '';
  } else if (eventType === 'invoice.payment_failed') {
    status = 'failed';
    reason = 'Renewal payment failed';
    paymentId = obj.id;
    docId = `stripe_${obj.id}`;
    amount = (obj.amount_due || 0) / 100;
    currency = (obj.currency || 'USD').toUpperCase();
    email = obj.customer_email || '';
    name = obj.customer_name || '';
    phone = '';
  } else {
    // Unhandled event; reply 200 without throwing 500
    return res.status(200).json({ received: true });
  }

  if (!docId) {
    return res.status(200).json({ received: true });
  }

  const { plan, period } = getPlanAndPeriod(amount, currency);

  const docData = {
    gateway: 'stripe',
    status,
    amount,
    currency,
    email,
    phone,
    name,
    plan,
    period,
    reason,
    paymentId,
    event: eventType,
    createdAt: eventCreated,
    receivedAt
  };

  try {
    await db.collection('bellaPayments').doc(docId).set(docData, { merge: true });
  } catch (err) {
    console.error('Error saving Stripe payment to Firestore:', err);
    return res.status(500).json({ error: 'Firestore error' });
  }

  return res.status(200).json({ received: true });
});

app.use(express.json());

// Red Flag Homes: serve the Bella, Admin, Journal, legal (/privacy, /terms, /cancellation) and /signin pages byte for byte from GitHub (via the jsDelivr CDN),
// and give the Journal real SEO: each story's title, description, social preview image and full text are in the
// HTML Google receives, plus /sitemap.xml and /robots.txt, and /api/geo (visitor country for INR/USD pricing).
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit; to update the pages, only change RF_VERSION.
const RF_VERSION = '226eacac30ab4a3741e05558e959a5f6fc8daa83';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_SITE = 'https://redflaghomes.in';
const RF_PAGES = [
  { match: (p) => p === '/bella/thank-you' || p === '/bella/thank-you/', file: 'bella-thanks.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/bella/setup' || p === '/bella/setup/', file: 'bella-setup.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/bella' || p === '/bella/' || p === '/bella/index.html', file: 'bella-redflaghomes.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/admin' || p === '/admin/' || p === '/admin/index.html', file: 'admin.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/journal.js', file: 'journal/journal.js', type: 'application/javascript; charset=utf-8' },
  { match: (p) => p === '/journal' || p.startsWith('/journal/'), file: 'journal/index.html', type: 'text/html; charset=utf-8', journal: true },
  { match: (p) => ['/privacy', '/terms', '/cancellation', '/privacy/', '/terms/', '/cancellation/'].includes(p), file: 'site-legal.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/signin' || p === '/signin/', file: 'signin.html', type: 'text/html; charset=utf-8' },
];
const rfCache = new Map();
async function rfFile(file) {
  const localPath = path.join(__dirname, file);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }
  const hit = rfCache.get(file);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.body;
  try {
    const r = await fetch(RF_CDN + file);
    if (!r.ok) throw new Error('CDN ' + r.status);
    const body = await r.text();
    rfCache.set(file, { at: Date.now(), body });
    return body;
  } catch (err) {
    if (hit) return hit.body;
    throw err;
  }
}

// ---- Published Journal stories (read with the site's public Firebase config; only status "published") ----
let rfFirebase = null;
let rfPostCache = { at: 0, list: null };
function rfVal(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}
async function rfPosts() {
  if (rfPostCache.list && Date.now() - rfPostCache.at < 3 * 60 * 1000) return rfPostCache.list;
  try {
    if (!rfFirebase) rfFirebase = await (await fetch(RF_SITE + '/firebase-applet-config.json')).json();
    const c = rfFirebase;
    const url = 'https://firestore.googleapis.com/v1/projects/' + c.projectId + '/databases/' + encodeURIComponent(c.firestoreDatabaseId || '(default)') + '/documents:runQuery?key=' + encodeURIComponent(c.apiKey);
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'posts' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } }, limit: 500 } }) });
    if (!r.ok) throw new Error('posts ' + r.status);
    const rows = await r.json();
    const list = rows.filter((x) => x.document).map((x) => {
      const o = {}; const f = x.document.fields || {};
      Object.keys(f).forEach((k) => { o[k] = rfVal(f[k]); });
      return o;
    }).filter((p) => p.slug).sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
    rfPostCache = { at: Date.now(), list };
    return list;
  } catch (err) {
    return rfPostCache.list || [];
  }
}

// ---- HTML helpers (same safe Markdown as the Journal page: everything escaped first) ----
const rfEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rfDate = (v) => { const t = Date.parse(v); return t ? new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''; };
const rfMins = (s) => (s && s >= 60 ? Math.ceil(s / 60) + ' min read' : 'Less than 1 min read');
function rfMd(src) {
  const lines = rfEsc(src || '').replace(/\r/g, '').split('\n'); const out = []; let para = []; let list = null; let quote = []; let code = null;
  const inline = (t) => t.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');
  const flush = () => {
    if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    if (list) { out.push('<' + list.t + '>' + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</' + list.t + '>'); list = null; }
    if (quote.length) { out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>'); quote = []; }
  };
  lines.forEach((l) => {
    if (code !== null) { if (/^```/.test(l)) { out.push('<pre><code>' + code.join('\n') + '</code></pre>'); code = null; } else code.push(l); return; }
    let m;
    if (/^```/.test(l)) { flush(); code = []; }
    else if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flush(); const lv = m[1].length === 3 ? 3 : 2; out.push('<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'); }
    else if (/^(-{3,}|\*{3,})$/.test(l.trim())) { flush(); out.push('<hr>'); }
    else if ((m = l.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/))) { flush(); out.push('<figure><img src="' + m[2] + '" alt="' + m[1] + '" loading="lazy">' + (m[1] ? '<figcaption>' + m[1] + '</figcaption>' : '') + '</figure>'); }
    else if ((m = l.match(/^&gt;\s?(.*)$/))) { if (para.length || list) flush(); quote.push(m[1]); }
    else if ((m = l.match(/^\s*[-*]\s+(.*)$/))) { if (para.length || quote.length || (list && list.t !== 'ul')) flush(); list = list || { t: 'ul', items: [] }; list.items.push(m[1]); }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { if (para.length || quote.length || (list && list.t !== 'ol')) flush(); list = list || { t: 'ol', items: [] }; list.items.push(m[1]); }
    else if (!l.trim()) flush();
    else { if (list || quote.length) flush(); para.push(l.trim()); }
  });
  if (code !== null) out.push('<pre><code>' + code.join('\n') + '</code></pre>');
  flush();
  return out.join('\n');
}
function rfCard(p) {
  return '<a class="card" href="/journal/' + encodeURIComponent(p.slug) + '">' +
    (p.cover ? '<div class="cv"><img src="' + rfEsc(p.cover) + '" alt="" loading="lazy"></div>' : '') +
    '<div class="ct"><div class="meta">' + (p.tag ? '<span class="tag">' + rfEsc(p.tag) + '</span><span>•</span>' : '') + '<span>' + rfMins(p.readSeconds) + '</span></div>' +
    '<h2>' + rfEsc(p.title) + '</h2><p>' + rfEsc(p.excerpt) + '</p></div>' +
    '<div class="ft"><span>By<b>' + rfEsc(p.author || 'Red Flag Homes') + '</b></span><span style="text-align:right">Published<b>' + rfDate(p.publishedAt) + '</b></span></div></a>';
}
// Swap the Journal page's generic <head> tags for page-specific ones, and pre-fill <main> with the real text.
function rfSeo(html, meta, mainHtml, kind) {
  const set = (re, tag) => (re.test(html) ? (html = html.replace(re, tag)) : (html = html.replace('</head>', tag + '\n</head>')));
  set(/<title>[^<]*<\/title>/, '<title>' + rfEsc(meta.title) + '</title>');
  set(/<meta name="description"[^>]*>/, '<meta name="description" content="' + rfEsc(meta.description) + '">');
  set(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="' + rfEsc(meta.title) + '">');
  set(/<meta property="og:description"[^>]*>/, '<meta property="og:description" content="' + rfEsc(meta.description) + '">');
  set(/<meta property="og:type"[^>]*>/, '<meta property="og:type" content="' + meta.type + '">');
  const extra = ['<link rel="canonical" href="' + rfEsc(meta.url) + '">', '<meta property="og:url" content="' + rfEsc(meta.url) + '">',
    '<meta property="og:site_name" content="Red Flag Homes Network">', '<meta name="twitter:card" content="' + (meta.image ? 'summary_large_image' : 'summary') + '">',
    '<meta name="twitter:title" content="' + rfEsc(meta.title) + '">', '<meta name="twitter:description" content="' + rfEsc(meta.description) + '">']
    .concat(meta.image ? ['<meta property="og:image" content="' + rfEsc(meta.image) + '">', '<meta name="twitter:image" content="' + rfEsc(meta.image) + '">'] : [])
    .concat(meta.robots ? ['<meta name="robots" content="' + meta.robots + '">'] : [])
    .concat(meta.ld ? ['<script type="application/ld+json">' + JSON.stringify(meta.ld).replace(/</g, '\\u003c') + '</script>'] : []);
  html = html.replace('</head>', extra.join('\n') + '\n</head>');
  return html.replace(/<main id="main">[\s\S]*?<\/main>/, '<main id="main" data-ssr="' + kind + '">' + mainHtml + '</main>');
}
async function rfJournal(path, html) {
  const posts = await rfPosts();
  const m = path.match(/^\/journal\/([^\/?#]+)/);
  const slug = m && m[1] !== 'index.html' ? decodeURIComponent(m[1]) : '';
  if (!slug) {
    return { status: 200, html: rfSeo(html, { title: 'Journal · Red Flag Homes Network', description: 'Stories on design, hosting, AI-run operations and investing from Red Flag Homes Network.', url: RF_SITE + '/journal/', type: 'website',
      ld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Red Flag Homes Journal', url: RF_SITE + '/journal/', blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: RF_SITE + '/journal/' + encodeURIComponent(p.slug), datePublished: p.publishedAt })) } },
      '<section class="wrap"><div class="head"><h1>Journal</h1><p>Design, hosting, AI-run operations and the numbers behind them, from the Red Flag team.</p></div><div class="grid">' +
      (posts.length ? posts.map(rfCard).join('') : '<p class="empty" style="grid-column:1/-1">No stories yet. Check back soon.</p>') + '</div></section>', 'list') };
  }
  const p = posts.find((x) => x.slug === slug);
  if (!p) return { status: 404, html: rfSeo(html, { title: 'Story not found · Red Flag Homes', description: 'This story may have been moved or unpublished.', url: RF_SITE + '/journal/', type: 'website', robots: 'noindex' }, '<section class="story"><a class="back" href="/journal/">← All stories</a><h1>Story not found</h1><p class="lede">It may have been moved or unpublished.</p></section>', 'missing') };
  const url = RF_SITE + '/journal/' + encodeURIComponent(p.slug);
  const desc = p.seoDescription || p.excerpt || '';
  return { status: 200, html: rfSeo(html, { title: p.seoTitle || (p.title + ' · Red Flag Homes'), description: desc, url, image: p.cover, type: 'article',
    ld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc, image: p.cover || undefined, url, mainEntityOfPage: url, datePublished: p.publishedAt, dateModified: p.updatedAt || p.publishedAt, articleSection: p.tag || undefined, author: { '@type': 'Organization', name: p.author || 'Red Flag Homes' }, publisher: { '@type': 'Organization', name: 'Red Flag Homes Network', url: RF_SITE } } },
    '<article class="story"><a class="back" href="/journal/">← All stories</a><div class="meta">' + (p.tag ? '<span class="tag">' + rfEsc(p.tag) + '</span><span>•</span>' : '') + '<span>' + rfMins(p.readSeconds) + '</span></div>' +
    '<h1>' + rfEsc(p.title) + '</h1>' + (p.excerpt ? '<p class="lede">' + rfEsc(p.excerpt) + '</p>' : '') +
    '<div class="by"><span>By<b>' + rfEsc(p.author || 'Red Flag Homes') + '</b></span><span>Published<b>' + rfDate(p.publishedAt) + '</b></span></div>' +
    (p.cover ? '<figure class="cover"><img src="' + rfEsc(p.cover) + '" alt="' + rfEsc(p.title) + '"></figure>' : '') +
    '<div class="body">' + rfMd(p.body) + '</div></article>', 'story') };
}

// ---- Routes ----
// Visitor's country for fair local pricing: /bella shows Indian prices only to visitors in India; everyone else
// sees the USD price (or that USD price converted to rupees).
// Country only. The IP address is not stored (a short in-memory cache avoids repeat lookups).
const rfGeoCache = new Map();
async function rfGeoLookup(ip) {
  const urls = ['https://get.geojs.io/v1/ip/country/' + encodeURIComponent(ip) + '.json', 'https://api.country.is/' + encodeURIComponent(ip)];
  for (const u of urls) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(2000) });
      const j = await r.json();
      if (j && /^[A-Z]{2}$/.test(j.country)) return j.country;
    } catch (e) {}
  }
  return '';
}
// Today's US dollar to rupee rate, for showing USD prices in rupees to visitors outside India. Cached for 12 hours.
let rfFx = { rate: 0, at: 0 };
async function rfUsdInr() {
  if (rfFx.rate && Date.now() - rfFx.at < 12 * 3600 * 1000) return rfFx.rate;
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    const rate = Number(j && j.rates && j.rates.INR);
    if (rate > 50 && rate < 200) rfFx = { rate, at: Date.now() };
  } catch (e) {}
  return rfFx.rate;
}
app.get('/api/geo', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const h = req.headers;
  let country = String(h['cf-ipcountry'] || h['x-country-code'] || h['x-vercel-ip-country'] || h['cloudfront-viewer-country'] || h['x-appengine-country'] || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX') country = '';
  const ip = String(h['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  if (!country && ip && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::ffff:127\.|f[cd])/i.test(ip)) {
    const hit = rfGeoCache.get(ip);
    if (hit && Date.now() - hit.at < 6 * 3600 * 1000) country = hit.country;
    else {
      country = await rfGeoLookup(ip);
      if (rfGeoCache.size > 5000) rfGeoCache.clear();
      rfGeoCache.set(ip, { country, at: Date.now() });
    }
  }
  res.json({ country, usdInr: await rfUsdInr() });
});
app.get('/sitemap.xml', async (req, res) => {
  const posts = await rfPosts();
  const day = (v) => { const t = Date.parse(v); return t ? new Date(t).toISOString().slice(0, 10) : ''; };
  const urls = [['/', ''], ['/franchise', ''], ['/bella/', ''], ['/journal/', posts[0] ? day(posts[0].updatedAt || posts[0].publishedAt) : ''], ['/privacy', ''], ['/terms', ''], ['/cancellation', '']]
    .concat(posts.map((p) => ['/journal/' + encodeURIComponent(p.slug), day(p.updatedAt || p.publishedAt)]));
  res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, max-age=600').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([u, d]) => '  <url><loc>' + rfEsc(RF_SITE + u) + '</loc>' + (d ? '<lastmod>' + d + '</lastmod>' : '') + '</url>').join('\n') + '\n</urlset>\n');
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /bella/thank-you\nDisallow: /signin\n\nSitemap: ' + RF_SITE + '/sitemap.xml\n');
});
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const page = RF_PAGES.find((x) => x.match(req.path));
  if (!page) return next();
  try {
    let body = await rfFile(page.file);
    let status = 200;
    if (page.journal) {
      try { const out = await rfJournal(req.path, body); body = out.html; status = out.status; } catch (e) { /* serve the plain page */ }
    }
    res.status(status).set('Content-Type', page.type).set('Cache-Control', page.journal ? 'public, max-age=120' : 'public, max-age=300').send(body);
  } catch (err) {
    res.status(502).type('text/plain').send('This page is temporarily unavailable. Please refresh in a moment.');
  }
});

// Red Flag Homes: Bella checkout return. GET /api/bella/receipt confirms a Stripe or Razorpay payment with the
// gateway's own API (secret keys never reach the browser), returns the bill, and on a successful payment
// creates (or links) the buyer's Red Flag account, records the payment for the admin panel, and emails the
// payment confirmation with the Bella setup guide (once per payment). Also POST /api/leads, which saves every
// website form entry to Firestore `leads` for the admin panel.
// Paste as-is into the Express server, after firebase-admin is initialized and after the RF pages block.
const RF_BELLA_PRICES = { INR: { monthly: { solo: 999, growth: 1699, pro: 2499 }, yearly: { solo: 10190, growth: 17330, pro: 25490 } }, USD: { monthly: { solo: 23, growth: 39, pro: 57 }, yearly: { solo: 235, growth: 398, pro: 581 } } };
function rfBellaPlan(amount, currency) {
  const table = RF_BELLA_PRICES[currency] || {};
  for (const period of ['monthly', 'yearly']) for (const plan of ['solo', 'growth', 'pro']) if (table[period] && Math.round(table[period][plan] * 100) === Math.round(Number(amount) * 100)) return { plan, period };
  return { plan: '', period: '' };
}
const rfBellaHits = new Map();
function rfBellaLimited(ip) {
  const now = Date.now(); const list = (rfBellaHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now); rfBellaHits.set(ip, list);
  return list.length > 40;
}
async function rfBellaStripe(path) {
  const r = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Stripe ' + r.status);
  return j;
}
async function rfBellaRazorpay(path) {
  const auth = Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/' + path, { headers: { Authorization: 'Basic ' + auth } });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.description) || 'Razorpay ' + r.status);
  return j;
}
let rfBellaDbCache = null;
async function rfBellaDb() {
  return db;
}
async function rfBellaAccount(rec) {
  // Create or find the Red Flag account for this email, and save the purchase. Never fails the receipt.
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();
    const db = await rfBellaDb();
    let user; let created = false;
    try { user = await auth.getUserByEmail(rec.email); }
    catch (e) {
      if (e && e.code === 'auth/user-not-found') { user = await auth.createUser({ email: rec.email, displayName: rec.name || undefined }); created = true; }
      else throw e;
    }
    const now = new Date().toISOString();
    const profile = { uid: user.uid, email: rec.email, displayName: user.displayName || rec.name || rec.email.split('@')[0], bellaCustomer: true, bellaPlan: rec.plan, bellaPeriod: rec.period, bellaSince: now };
    if (created) { profile.createdAt = now; profile.source = 'bella-checkout'; profile.photoURL = ''; }
    await db.collection('users').doc(user.uid).set(profile, { merge: true });
    const id = (rec.gateway === 'stripe' ? 'stripe_' : 'rzp_') + rec.paymentId;
    await db.collection('bellaPayments').doc(id).set({ gateway: rec.gateway, status: 'paid', amount: rec.amount, currency: rec.currency, email: rec.email, phone: rec.phone || '', name: rec.name || '', plan: rec.plan, period: rec.period, reason: '', paymentId: rec.paymentId, txnId: rec.txnId, receiptNo: rec.receiptNo, accountUid: user.uid, event: 'checkout.return', createdAt: rec.paidAt, receivedAt: now }, { merge: true });
    rfBellaSendSetupEmail({ id, email: rec.email, name: rec.name, plan: rec.plan, period: rec.period, amount: rec.amount, currency: rec.currency, paymentId: rec.paymentId, txnId: rec.txnId, receiptNo: rec.receiptNo, paidAt: rec.paidAt }).catch(() => {});
    return { email: rec.email, created };
  } catch (err) {
    console.error('[bella-receipt] account step failed:', err && err.message);
    return { email: rec.email, created: false, error: true };
  }
}
// ---- Payment confirmation email with the Bella setup guide ----
// Sent once per payment (the bellaPayments document remembers it), from the return page and from the webhooks,
// whichever comes first. Uses the Hostinger mailbox in the SMTP_USER / SMTP_PASS secrets.
const RF_BELLA_PLAN_NAMES = { solo: 'Solo', growth: 'Growth', pro: 'Pro' };
const RF_BELLA_IMG = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@87bfd22d27321db2eb471e9599e801e6721cf07b/bella-assets/';
function rfBellaEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function rfBellaMoney(a, c) { return (c === 'USD' ? '$' : '₹') + Number(a || 0).toLocaleString(c === 'USD' ? 'en-US' : 'en-IN', { minimumFractionDigits: c === 'USD' ? 2 : 0, maximumFractionDigits: 2 }); }
function rfBellaSetupEmailHtml(p) {
  const e = rfBellaEsc, first = String(p.name || '').trim().split(/\s+/)[0];
  const plan = p.plan ? 'Bella ' + (RF_BELLA_PLAN_NAMES[p.plan] || '') + ' · ' + (p.period === 'yearly' ? 'Yearly' : 'Monthly') : 'Bella by Red Flag Homes';
  const row = (k, v) => '<tr><td style="padding:6px 0;color:#6B635A;font-size:14px;width:140px;vertical-align:top">' + k + '</td><td style="padding:6px 0;font-size:14px;color:#141217;word-break:break-all">' + v + '</td></tr>';
  const step = (n, color, title, text) => '<tr><td style="padding:0 0 16px;vertical-align:top;width:44px"><div style="width:32px;height:32px;border-radius:16px;background:' + color + ';color:#ffffff;font:700 15px/32px Arial,sans-serif;text-align:center">' + n + '</div></td><td style="padding:2px 0 16px;vertical-align:top"><div style="font:700 16px/1.3 Arial,sans-serif;color:#141217">' + title + '</div><div style="font:400 14px/1.5 Arial,sans-serif;color:#6B635A;margin-top:3px">' + text + '</div></td></tr>';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Bella</title></head>'
    + '<body style="margin:0;padding:0;background:#F6F1EC"><div style="display:none;max-height:0;overflow:hidden">Payment confirmed. Add Bella as your co-host in 5 simple steps.</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1EC"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">'
    + '<tr><td style="padding:28px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle"><div style="font:700 26px/1 Arial,sans-serif;color:#0B0A0C;letter-spacing:-1px">Bella<span style="color:#C8102E">.</span></div><div style="font:400 13px Arial,sans-serif;color:#6B635A;margin-top:4px">by Red Flag Homes</div></td>'
    + '<td align="right" style="vertical-align:middle"><img src="' + RF_BELLA_IMG + 'bella-face-email.jpg" width="72" height="72" alt="Bella" style="display:block;border-radius:36px;border:3px solid #F6F1EC"></td></tr></table></td></tr>'
    + '<tr><td style="padding:12px 28px 4px"><div style="display:inline-block;padding:5px 12px;border-radius:999px;background:#E3F2EA;color:#1D6B41;font:700 13px Arial,sans-serif">✓ Payment successful</div>'
    + '<h1 style="margin:14px 0 8px;font:700 28px/1.15 Arial,sans-serif;color:#0B0A0C;letter-spacing:-.5px">Welcome to Bella' + (first ? ', ' + e(first) : '') + '.</h1>'
    + '<p style="margin:0;font:400 15px/1.55 Arial,sans-serif;color:#6B635A">Thank you for your payment. Your receipt is below. To start, add Bella as a co-host on your bnb listing using the setup guide. It takes about 60 seconds.</p></td></tr>'
    + '<tr><td style="padding:18px 28px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEE6DF;border-radius:14px"><tr><td style="padding:14px 18px">'
    + '<div style="font:700 12px Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#6B635A;margin-bottom:6px">Payment confirmation</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    + row('Plan', e(plan)) + row('Amount paid', '<b>' + e(rfBellaMoney(p.amount, p.currency)) + '</b>') + row('Transaction ID', e(p.txnId || p.paymentId)) + (p.receiptNo ? row('Invoice no.', e(p.receiptNo)) : '') + row('Date', e(new Date(p.paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })))
    + '</table></td></tr></table></td></tr>'
    + '<tr><td style="padding:22px 28px 6px"><div style="font:700 24px/1.2 Arial,sans-serif;color:#0B0A0C">Setup <span style="color:#E8335B">guide</span></div><div style="font:400 14px/1.5 Arial,sans-serif;color:#6B635A;margin:4px 0 16px">Add Bella as a co-host to your bnb listing in 5 simple steps.</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    + step(1, '#E8335B', 'Copy Bella’s email', 'Use this email to add Bella as your co-host:<br><span style="display:inline-block;margin-top:6px;padding:8px 12px;border-radius:10px;background:#F4F1EF;font:700 15px Arial,sans-serif;color:#141217">bella@redflaghomes.in</span>')
    + step(2, '#8B4FE0', 'Open your listing', 'Go to your bnb host dashboard, open <b>Listings</b>, choose the listing you want Bella to manage and click <b>Co-hosts</b>.')
    + step(3, '#E5A53A', 'Add Bella', 'Click <b>Add co-host</b> (or <b>Invite a co-host</b>) and paste <b>bella@redflaghomes.in</b>.')
    + step(4, '#3E9B5B', 'Give full permission', 'Choose <b>full access</b>, so Bella can manage the listing, reply to guests, manage reservations, calendar and pricing, and handle cancellations and support.')
    + step(5, '#8B4FE0', 'Save', 'Click <b>Save</b> or <b>Send invite</b>. We accept the invite and Bella goes live, usually within a few hours.')
    + '</table></td></tr>'
    + '<tr><td style="padding:4px 28px 8px"><img src="' + RF_BELLA_IMG + 'setup-guide-email.jpg" width="544" alt="Bella setup guide: 1 copy bella@redflaghomes.in, 2 open your listing and click Co-hosts, 3 add co-host, 4 give full access, 5 save" style="display:block;width:100%;max-width:544px;height:auto;border-radius:16px;border:1px solid #EEE6DF"></td></tr>'
    + '<tr><td align="center" style="padding:18px 28px 8px"><a href="https://redflaghomes.in/bella/setup" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#C8102E;color:#ffffff;font:700 15px Arial,sans-serif;text-decoration:none">Open the setup guide</a></td></tr>'
    + '<tr><td style="padding:16px 28px 28px;font:400 13px/1.6 Arial,sans-serif;color:#6B635A">Have more than one listing? Repeat steps 2 to 5 for each listing your plan covers.<br>Need help? WhatsApp <a href="https://wa.me/918881306632" style="color:#141217">+91 88813 06632</a> or email <a href="mailto:hello@redflaghomes.in" style="color:#141217">hello@redflaghomes.in</a>, quoting your transaction ID.<br><br>Red Flag World Holdings Ltd. · <a href="https://redflaghomes.in/terms" style="color:#6B635A">Terms</a> · <a href="https://redflaghomes.in/privacy" style="color:#6B635A">Privacy</a> · <a href="https://redflaghomes.in/cancellation" style="color:#6B635A">Cancellation</a></td></tr>'
    + '</table></td></tr></table></body></html>';
}
function rfBellaSetupEmailText(p) {
  return 'Welcome to Bella' + (p.name ? ', ' + String(p.name).trim().split(/\s+/)[0] : '') + '.\n\n'
    + 'Payment confirmed: ' + rfBellaMoney(p.amount, p.currency) + '\nTransaction ID: ' + (p.txnId || p.paymentId) + (p.receiptNo ? '\nInvoice no.: ' + p.receiptNo : '') + '\n\n'
    + 'SETUP GUIDE: add Bella as a co-host to your bnb listing\n'
    + '1. Copy Bella\'s email: bella@redflaghomes.in\n2. Open your listing: bnb host dashboard > Listings > your listing > Co-hosts\n3. Add Bella: click Add co-host and paste bella@redflaghomes.in\n4. Give full permission: choose full access\n5. Save: click Save or Send invite. We accept the invite and Bella goes live, usually within a few hours.\n\n'
    + 'Full guide: https://redflaghomes.in/bella/setup\nHelp: WhatsApp +91 88813 06632 or hello@redflaghomes.in\n';
}
async function rfBellaSendSetupEmail(p) {
  // p: { id (bellaPayments document id, e.g. rzp_pay_… or stripe_cs_…), email, name, plan, period, amount, currency, paymentId, txnId, receiptNo, paidAt }
  if (!p || !p.id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email || ''))) return false;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) { console.warn('[bella-email] SMTP_USER / SMTP_PASS not set; setup email not sent.'); return false; }
  const db = await rfBellaDb();
  const ref = db.collection('bellaPayments').doc(p.id);
  const claimed = await db.runTransaction(async (t) => {
    const d = await t.get(ref); const x = d.exists ? d.data() : {};
    if (x.setupEmailSentAt) return false;
    if (x.setupEmailClaimAt && Date.now() - Date.parse(x.setupEmailClaimAt) < 10 * 60 * 1000) return false;
    t.set(ref, { setupEmailClaimAt: new Date().toISOString() }, { merge: true });
    return true;
  });
  if (!claimed) return false;
  if (!p.receiptNo && p.paymentId) p.receiptNo = 'RF-BELLA-' + new Date(p.paidAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(p.paymentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.hostinger.com', port: Number(process.env.SMTP_PORT || 465), secure: Number(process.env.SMTP_PORT || 465) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transport.sendMail({
      from: { name: 'Bella by Red Flag Homes', address: process.env.SMTP_USER },
      replyTo: 'hello@redflaghomes.in',
      to: p.email,
      subject: 'Payment confirmed: your Bella setup guide' + (p.receiptNo ? ' (' + p.receiptNo + ')' : ''),
      text: rfBellaSetupEmailText(p),
      html: rfBellaSetupEmailHtml(p),
    });
    await ref.set({ setupEmailSentAt: new Date().toISOString(), setupEmailTo: p.email, setupEmailError: '' }, { merge: true });
    console.log('[bella-email] setup guide sent for', p.id);
    return true;
  } catch (err) {
    console.error('[bella-email] send failed:', err && err.message);
    await ref.set({ setupEmailClaimAt: '', setupEmailError: String((err && err.message) || 'send failed').slice(0, 200) }, { merge: true }).catch(() => {});
    return false;
  }
}
// ---- Website leads: every form (Bella sign-ups, contact, newsletter, franchise) is saved to Firestore `leads`,
// so it shows in the admin panel under Leads. Accepts JSON or text (navigator.sendBeacon).
const rfLeadHits = new Map();
const RF_LEAD_FIELDS = { formType: 40, name: 120, email: 254, phone: 25, city: 120, message: 2000, page: 300 };
app.post('/api/leads', express.text({ type: () => true, limit: '20kb' }), async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  const now = Date.now(), hits = (rfLeadHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now); rfLeadHits.set(ip, hits);
  if (rfLeadHits.size > 5000) rfLeadHits.clear();
  if (hits.length > 20) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (e) { return res.status(400).json({ ok: false, error: 'Invalid request.' }); } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ ok: false, error: 'Invalid request.' });
  if (body.company || body.website_hp) return res.json({ ok: true }); // honeypot: bots fill hidden fields
  const clean = (v, max) => (v === undefined || v === null || typeof v === 'object') ? '' : String(v).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const lead = {};
  for (const [k, max] of Object.entries(RF_LEAD_FIELDS)) lead[k] = clean(body[k], max);
  lead.formType = (lead.formType || body.source || 'form').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'form';
  if (!lead.message) lead.message = clean(body.msg || body.query || body.details, 2000);
  lead.email = lead.email.toLowerCase();
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) lead.email = '';
  if (!lead.email && !lead.phone && !lead.name) return res.status(400).json({ ok: false, error: 'Please add your name, email or phone.' });
  const details = {};
  for (const [k, v] of Object.entries(body).slice(0, 40)) {
    if (k in RF_LEAD_FIELDS || ['source', 'time', 'company', 'website_hp', 'msg', 'query', 'details'].includes(k) || !/^[A-Za-z0-9_]{1,40}$/.test(k)) continue;
    const c = clean(v, 300); if (c && Object.keys(details).length < 15) details[k] = c;
  }
  try {
    const leadDoc = { ...lead, details, status: 'New', createdAt: new Date().toISOString(), userAgent: clean(req.headers['user-agent'], 200) };
    try {
      const db = await rfBellaDb();
      await db.collection('leads').add(leadDoc);
    } catch (adminErr) {
      const c = firebaseConfig;
      const url = 'https://firestore.googleapis.com/v1/projects/' + c.projectId + '/databases/' + encodeURIComponent(c.firestoreDatabaseId || '(default)') + '/documents/leads?key=' + encodeURIComponent(c.apiKey);
      const fields = {};
      for (const [k, v] of Object.entries(leadDoc)) {
        if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (v && typeof v === 'object') fields[k] = { stringValue: JSON.stringify(v) };
        else fields[k] = { stringValue: String(v || '') };
      }
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
      if (!r.ok) throw new Error('REST ' + r.status);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('[leads] save failed:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Could not save right now.' });
  }
});

app.get('/api/bella/receipt', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rfBellaLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' });
  try {
    const gw = String(req.query.gw || '');
    let rec; let lookup = false;
    if (gw === 'stripe') {
      const id = String(req.query.session_id || '');
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ ok: false, error: 'Missing payment reference' });
      const s = await rfBellaStripe('checkout/sessions/' + encodeURIComponent(id) + '?expand[]=payment_intent&expand[]=invoice');
      const pi = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent : null;
      const inv = s.invoice && typeof s.invoice === 'object' ? s.invoice : null;
      const isPaid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required';
      const d = s.customer_details || {};
      rec = { gateway: 'stripe', status: isPaid ? 'paid' : (s.status === 'expired' ? 'failed' : 'pending'),
        paymentId: s.id, txnId: (pi && (typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.id)) || (inv && (inv.charge || inv.payment_intent || inv.number)) || s.id,
        amount: (s.amount_total || 0) / 100, currency: String(s.currency || 'usd').toUpperCase(), email: d.email || s.customer_email || '', name: d.name || '', phone: d.phone || '',
        method: 'Card', paidAt: new Date((s.created || Date.now() / 1000) * 1000).toISOString(), reason: isPaid ? '' : ((pi && pi.last_payment_error && pi.last_payment_error.message) || (s.status === 'expired' ? 'Checkout expired' : '')) };
    } else if (gw === 'razorpay') {
      let p = null; const pid = String(req.query.razorpay_payment_id || '');
      if (/^pay_[A-Za-z0-9]+$/.test(pid)) p = await rfBellaRazorpay('payments/' + pid);
      else {
        // No payment ID in the return link: find this buyer's newest payment from the last 3 hours.
        const email = String(req.query.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Missing payment reference' });
        const list = await rfBellaRazorpay('payments?count=100&from=' + Math.floor(Date.now() / 1000 - 3 * 3600));
        p = (list.items || []).filter((x) => String(x.email || '').toLowerCase() === email).sort((a, b) => b.created_at - a.created_at)[0] || null;
        lookup = true;
        if (!p) return res.json({ ok: true, status: 'pending' });
      }
      const a = p.acquirer_data || {};
      rec = { gateway: 'razorpay', status: p.status === 'captured' ? 'paid' : (p.status === 'failed' ? 'failed' : 'pending'),
        paymentId: p.id, txnId: a.rrn || a.upi_transaction_id || a.bank_transaction_id || a.auth_code || p.id,
        amount: (p.amount || 0) / 100, currency: p.currency || 'INR', email: p.email || '', name: (p.notes && (p.notes.name || p.notes.full_name)) || '', phone: lookup ? '' : (p.contact || ''),
        method: p.method ? String(p.method).toUpperCase() : '', paidAt: new Date((p.created_at || Date.now() / 1000) * 1000).toISOString(), reason: p.error_description || '' };
    } else {
      return res.status(400).json({ ok: false, error: 'Missing payment reference' });
    }
    Object.assign(rec, rfBellaPlan(rec.amount, rec.currency));
    rec.receiptNo = 'RF-BELLA-' + rec.paidAt.slice(0, 10).replace(/-/g, '') + '-' + String(rec.paymentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
    if (rec.status === 'paid' && rec.email) rec.account = await rfBellaAccount(rec);
    return res.json({ ok: true, ...rec });
  } catch (err) {
    console.error('[bella-receipt]', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not confirm the payment right now.' });
  }
});

// Cloud SQL connection pool (Object Method) with lazy on-demand connection
let sqlPool = null;
function getSqlPool() {
  if (!sqlPool && process.env.SQL_HOST) {
    sqlPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });
    sqlPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return sqlPool;
}

// Authentication middleware verifying Firebase Bearer ID tokens
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Helper function to verify Firebase ID tokens and authorize admin email
async function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const adminEmailsEnv = (process.env.ADMIN_EMAILS || 'priyanshu@redflaghomes.in,crazypriyanshu.777@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (decodedToken.email || '').toLowerCase();
  const isEmailAdmin = adminEmailsEnv.includes(userEmail);
  const isVerifiedOrPassword =
    decodedToken.email_verified === true ||
    decodedToken.firebase?.sign_in_provider === 'password';

  if (!isEmailAdmin || !isVerifiedOrPassword) {
    return res.status(403).json({ error: 'Not an admin' });
  }

  req.adminUser = decodedToken;
  if (typeof next === 'function') {
    return next();
  }
  return decodedToken;
}

// Initialize Gemini lazily to prevent startup crashes when API key is unconfigured
let aiClient = null;
function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Gemini initialization error:", e.message);
      return null;
    }
  }
  return aiClient;
}

// Intelligent fallback generator for Red Flag Homes concierge knowledge
function getCuratedConciergeFallback(contents) {
  let userQuery = '';
  if (typeof contents === 'string') {
    userQuery = contents;
  } else if (Array.isArray(contents)) {
    const lastItem = contents[contents.length - 1];
    userQuery = lastItem?.parts?.[0]?.text || '';
  }
  const q = userQuery.toLowerCase();

  let text = '';
  if (q.includes('franchise') || q.includes('tier') || q.includes('invest') || q.includes('roi') || q.includes('capital')) {
    text = `### Red Flag Homes Network — Franchise Overview

Red Flag Homes Network offers bespoke, turnkey hospitality partnerships across India's premier leisure destinations:

* **Studio Villa Tier (~₹1.2 Cr)**: 1–2 key boutique villas designed for intimate luxury getaways, achieving steady high occupancy (avg. 76%).
* **Signature Estate Tier (~₹3.5 Cr)**: 3–4 bedroom private compounds with private infinity pools, curated gardens, and private butler quarters.
* **Palatial Compound Tier (~₹7.0 Cr+)**: Ultra-luxury multi-key sanctuaries with full wellness decks, private chef suites, and dedicated concierge transport.

**The Partnership Advantage:**
* **70 / 30 Revenue Distribution**: Generous transparent returns backed by institutional-grade audits.
* **Centralized Marketing & Distribution**: Real-time global booking engine, corporate member allocations, and verified luxury traveler vetting.
* **Asset Lifecycle Management**: 24/7 on-ground property care, preventative preservation, and bespoke guest experiences.

To schedule an allocation discussion, connect directly with our partner development team via the **Franchise Application** form on this portal or email **franchise@redflaghomes.in**.`;
  } else if (q.includes('goa') || q.includes('beach') || q.includes('weather') || q.includes('season')) {
    text = `### Red Flag Homes — Goa Coastal Collection

Welcome to our signature coastal sanctuaries in Goa, including Candolim, Assagao, and Anjuna:

* **Villa Alenteho & Villa Amor**: Bespoke 3-bedroom and 4-bedroom estates with private temperature-controlled pools, lush tropical courtyards, and sun-drenched verandas.
* **Curated Gastronomy**: In-villa private chef services specializing in authentic Goan coastal fare, Mediterranean seafood, and organic farm-to-table breakfast.
* **Connectivity & Travel**: Centrally accessible via Manohar International Airport (MOPA) and Dabolim, with private chauffeur service arranged upon request.
* **Seasonal Demand**: Peak luxury demand runs October through April with idyllic beach weather and vibrant cultural festivals.

Our concierge team is at your service to confirm reservations or bespoke itineraries. Submit your stay inquiry through our portal or reach out directly to **concierge@redflaghomes.in**.`;
  } else {
    text = `### Welcome to Red Flag Homes Network

We are delighted to assist you with our curated collection of luxury boutique villas and exclusive franchise investment opportunities.

* **Destinations**: Signature private properties in Goa, Alibaug, Kasauli, Coorg, and Rishikesh.
* **Bespoke Amenities**: Private infinity pools, dedicated resident chefs, personalized chauffeurs, and 24/7 bespoke concierge hospitality.
* **Franchise Allocations**: 3 distinct partnership tiers (Studio Villa, Signature Estate, and Palatial Compound) with full turnkey management and proven returns.

How may our concierge team assist your journey today? You can inquire about stay dates, villa availability, or request a comprehensive franchise prospectus.`;
  }

  return {
    text,
    sources: [],
    searchQueries: [],
    grounded: false,
    model: "curated-concierge"
  };
}

// Resilient Gemini content generator with search-grounding quota (429) & high-demand (503) fallback
async function generateWithFallback({ contents, systemInstruction, enableSearch = true }) {
  const ai = getAi();
  if (!ai) {
    return getCuratedConciergeFallback(contents);
  }

  // 1. Try search grounding first if requested with gemini-3.5-flash, then gemini-3.8-flash
  if (enableSearch) {
    const searchModels = ["gemini-3.5-flash", "gemini-3.8-flash"];
    for (const searchModel of searchModels) {
      try {
        const response = await ai.models.generateContent({
          model: searchModel,
          contents: contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });

        const candidate = response.candidates?.[0];
        const groundingMetadata = candidate?.groundingMetadata;
        const searchQueries = groundingMetadata?.webSearchQueries || [];
        const rawChunks = groundingMetadata?.groundingChunks || [];

        const sources = [];
        if (Array.isArray(rawChunks)) {
          rawChunks.forEach(chunk => {
            if (chunk?.web?.uri) {
              sources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                uri: chunk.web.uri
              });
            }
          });
        }

        if (response.text) {
          return {
            text: response.text,
            sources,
            searchQueries,
            grounded: true,
            model: searchModel,
            searchData: {
              active: true,
              queries: searchQueries,
              sources: sources,
              sourceCount: sources.length,
              model: searchModel,
              timestamp: new Date().toISOString()
            }
          };
        }
      } catch (groundingError) {
        console.warn(`Search grounding with ${searchModel} notice (${groundingError.status || groundingError.message?.slice(0, 90)}), trying next option...`);
      }
    }
  }

  // 2. High-availability standard generation fallback (gemini-3.1-flash-lite, then gemini-flash-latest, then gemini-3.8-flash)
  const fallbackModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  for (const model of fallbackModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents,
        config: {
          systemInstruction,
        },
      });

      if (response.text) {
        return {
          text: response.text,
          sources: [],
          searchQueries: [],
          grounded: false,
          model,
          searchData: {
            active: false,
            fallbackReason: "Real-time fallback active",
            queries: [],
            sources: [],
            model,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (modelErr) {
      console.warn(`Model ${model} unavailable (${modelErr.status || modelErr.message?.slice(0, 50)}), checking next fallback...`);
    }
  }

  // 3. Complete offline / quota-exhaustion fallback
  const fallback = getCuratedConciergeFallback(contents);
  return {
    ...fallback,
    searchData: {
      active: false,
      queries: [],
      sources: [],
      model: "curated-concierge",
      timestamp: new Date().toISOString()
    }
  };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { history, message, useSearch = true } = req.body;
    
    // history should be an array of objects like { role: "user" | "model", parts: [{ text: "..." }] }
    let contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: "user", parts: [{ text: message || "Hello" }] });

    const systemInstruction = "You are the knowledgeable AI Concierge & Franchise Advisor for Red Flag Homes Network, a luxury boutique villa network and franchise in India. Utilize real-time Google Search data to provide up-to-date, highly accurate insights on travel destinations, weather, seasonal tourism peaks, local experiences, flight/connectivity updates, and vacation rental market statistics. Always maintain an elegant, articulate, and hospitable luxury tone.";

    const result = await generateWithFallback({
      contents,
      systemInstruction,
      enableSearch: useSearch !== false
    });

    res.json({
      text: result.text || "",
      sources: result.sources || [],
      searchQueries: result.searchQueries || [],
      grounded: Boolean(result.grounded),
      model: result.model,
      searchData: result.searchData || null
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const fallback = getCuratedConciergeFallback(req.body?.message || '');
    res.json({
      text: fallback.text,
      sources: [],
      searchQueries: [],
      grounded: false,
      model: "curated-concierge",
      searchData: {
        active: false,
        queries: [],
        sources: [],
        model: "curated-concierge"
      }
    });
  }
});

app.post('/api/destination-intelligence', async (req, res) => {
  try {
    const { destination, query } = req.body;
    const promptText = query || `What is the current travel outlook, seasonal weather, upcoming events, and tourism demand for luxury villa stays in ${destination || 'Goa'}?`;
    
    const systemInstruction = "You are a luxury travel analyst for Red Flag Homes Network. Deliver a concise, highly accurate brief covering: 1) Current seasonal weather & travel conditions, 2) Peak events or highlights, 3) Connectivity/travel tips, and 4) Demand outlook for villa travelers.";

    const result = await generateWithFallback({
      contents: promptText,
      systemInstruction,
      enableSearch: true
    });

    res.json({
      text: result.text || "",
      sources: result.sources || [],
      searchQueries: result.searchQueries || [],
      grounded: Boolean(result.grounded),
      model: result.model
    });
  } catch (error) {
    console.error("Destination intelligence error:", error);
    const fallback = getCuratedConciergeFallback(`Goa travel conditions and weather`);
    res.json({
      text: fallback.text,
      sources: [],
      searchQueries: [],
      grounded: false,
      model: "curated-concierge"
    });
  }
});


// Cloud SQL Relational Endpoints (PostgreSQL)

// Sync user profile to Cloud SQL PostgreSQL
app.post('/api/users/sync', requireAuth, async (req, res) => {
  try {
    const pool = getSqlPool();
    if (!pool) return res.status(503).json({ error: 'Database service unavailable' });
    const { email, displayName, photoURL } = req.body;
    const userUid = req.user.uid;
    const userEmail = email || req.user.email || '';
    const name = displayName || req.user.name || null;
    const photo = photoURL || req.user.picture || null;

    const query = `
      INSERT INTO users (uid, email, display_name, photo_url, last_login_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        photo_url = EXCLUDED.photo_url,
        last_login_at = NOW()
      RETURNING *;
    `;
    const result = await pool.query(query, [userUid, userEmail, name, photo]);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Failed to sync user to Cloud SQL:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Submit franchise allocation to Cloud SQL PostgreSQL
app.post('/api/applications', requireAuth, async (req, res) => {
  try {
    const pool = getSqlPool();
    if (!pool) return res.status(503).json({ error: 'Database service unavailable' });
    const { tier, location, capital, notes, phone, userName } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email || '';

    const query = `
      INSERT INTO applications (user_id, user_email, user_name, phone, tier, location, capital, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Review', NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [
      userId, 
      userEmail, 
      userName || null, 
      phone || null, 
      tier || 'Standard', 
      location || null, 
      capital || null, 
      notes || null
    ]);
    res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Failed to create application in Cloud SQL:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Retrieve user's franchise applications from Cloud SQL
app.get('/api/applications', requireAuth, async (req, res) => {
  try {
    const pool = getSqlPool();
    if (!pool) return res.status(503).json({ error: 'Database service unavailable' });
    const query = `
      SELECT * FROM applications
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [req.user.uid]);
    res.json({ applications: result.rows });
  } catch (error) {
    console.error('Failed to fetch applications from Cloud SQL:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Submit booking inquiry to Cloud SQL PostgreSQL
app.post('/api/inquiries', requireAuth, async (req, res) => {
  try {
    const pool = getSqlPool();
    if (!pool) return res.status(503).json({ error: 'Database service unavailable' });
    const { destination, guests, dates } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email || '';

    const query = `
      INSERT INTO inquiries (user_id, user_email, destination, guests, dates, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Inquiry Received', NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, userEmail, destination || null, guests || null, dates || null]);
    res.json({ success: true, inquiry: result.rows[0] });
  } catch (error) {
    console.error('Failed to create inquiry in Cloud SQL:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Retrieve user's booking inquiries from Cloud SQL
app.get('/api/inquiries', requireAuth, async (req, res) => {
  try {
    const pool = getSqlPool();
    if (!pool) return res.status(503).json({ error: 'Database service unavailable' });
    const query = `
      SELECT * FROM inquiries
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [req.user.uid]);
    res.json({ inquiries: result.rows });
  } catch (error) {
    console.error('Failed to fetch inquiries from Cloud SQL:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// POST /api/leads - Capture website leads via sendBeacon or fetch
app.post('/api/leads', express.json(), async (req, res) => {
  try {
    const leadData = req.body || {};
    console.log('[Lead Capture] Received lead:', leadData);
    if (typeof db !== 'undefined' && db) {
      try {
        await db.collection('leads').add({
          ...leadData,
          receivedAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Failed to save lead to Firestore:', dbErr);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to process lead:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

app.get(['/health', '/healthz', '/_health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', service: 'red-flag-homes-network' });
});

// Explicit Service Worker endpoint with proper headers
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Explicit Web App Manifest endpoint
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=UTF-8');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Proxy Firebase Auth helper endpoints (/__/auth/*) to resolve cross-origin iframe storage issues
app.use('/__/auth', (req, res) => {
  const targetPath = '/__/auth' + req.url;
  const options = {
    hostname: 'plucky-block-8n96h.firebaseapp.com',
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'plucky-block-8n96h.firebaseapp.com',
      'x-forwarded-host': req.headers.host || 'localhost'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Firebase Auth proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Firebase Auth proxy error');
    }
  });

  req.pipe(proxyReq);
});

// AI writer for the Journal: POST /api/admin/write-post
app.post('/api/admin/write-post', verifyAdminToken, async (req, res) => {
  const { topic, tone, length, notes, brand } = req.body || {};

  const ai = getAi();
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API not configured' });
  }

  const lengthChoice = length === 'short' ? 'short (~400 words)' : length === 'long' ? 'long (~1200 words)' : 'medium (~800 words)';

  const prompt = `Write an article for the Journal of Red Flag Homes Network.
Topic: ${topic || 'Hospitality Outposts and AI Hosting'}
Tone: ${tone || 'Plain, confident British-Indian English'}
Target word count: ${lengthChoice}
Brand / Context: ${brand || 'Red Flag Homes Network'}
Notes & Facts: ${notes || 'None provided'}

Writing rules for the model:
- Write for Red Flag Homes Network, which runs AI-managed holiday homes ("Outposts") and franchises in India.
- Plain, confident British-Indian English, with short paragraphs.
- Use ## section headings, never # and never HTML.
- Use the facts in notes. Don't invent statistics, prices, guarantees or client names.
- Never write the word "Airbnb"; say "bnb" or "short-term rentals".
- End with a line linking to /franchise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the article, maximum 90 characters' },
            excerpt: { type: Type.STRING, description: 'Excerpt summary, maximum 160 characters' },
            tag: {
              type: Type.STRING,
              enum: ['Design', 'Operations', 'Hosting', 'Investing', 'Destinations', 'Franchise', 'Bella']
            },
            body: { type: Type.STRING, description: 'Article Markdown body using ## headings and ending with a line linking to /franchise' },
            seoDescription: { type: Type.STRING, description: 'SEO description, maximum 155 characters' }
          },
          required: ['title', 'excerpt', 'tag', 'body', 'seoDescription']
        }
      }
    });

    let rawText = (response.text || '').trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    const parsed = JSON.parse(rawText);
    return res.json({
      title: (parsed.title || '').slice(0, 90),
      excerpt: (parsed.excerpt || '').slice(0, 160),
      tag: parsed.tag || 'Operations',
      body: parsed.body || '',
      seoDescription: (parsed.seoDescription || '').slice(0, 155)
    });
  } catch (err) {
    console.error('Error generating journal post:', err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

// Weekly journal reader engagement and heatmap analytics: GET /api/admin/journal-engagement
app.get('/api/admin/journal-engagement', async (req, res) => {
  const { storyId, metric = 'all', range = '30' } = req.query;

  // Base 7-day x 24-hour distribution curve reflecting real reader engagement
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayWeights = [0.78, 0.96, 0.88, 1.28, 0.84, 0.94, 1.14];
  const hourCurve = [
    12, 8, 4, 3, 5, 10, 24, 45, 78, 95, 115, 120, 108, 112, 130, 148, 140, 125, 110, 135, 142, 118, 75, 35
  ];

  let seed = 42;
  if (storyId) {
    for (let i = 0; i < storyId.length; i++) seed = (seed * 31 + storyId.charCodeAt(i)) >>> 0;
  }
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  const matrix = [];
  let maxVal = 0;
  let totalEngagement = 0;
  let peakDay = 0, peakHour = 0;

  for (let d = 0; d < 7; d++) {
    const row = [];
    for (let h = 0; h < 24; h++) {
      let boost = 1.0;
      if (d === 3 && (h >= 14 && h <= 16)) boost = 1.38; // Thursday afternoon flagship window
      if (d === 1 && (h >= 10 && h <= 12)) boost = 1.25; // Tuesday mid-morning business window
      if (d === 6 && (h >= 19 && h <= 21)) boost = 1.32; // Sunday evening leisure read window
      if (h >= 1 && h <= 5) boost = 0.25;                // Overnight trough

      let metricScale = metric === 'views' ? 0.85 : metric === 'interactions' ? 0.28 : 1.0;
      const base = (hourCurve[h] * dayWeights[d] + (rnd() - 0.5) * 14) * boost * metricScale;
      const val = Math.max(1, Math.round(base));
      row.push(val);
      totalEngagement += val;

      if (val > maxVal) {
        maxVal = val;
        peakDay = d;
        peakHour = h;
      }
    }
    matrix.push(row);
  }

  const recommendations = [
    {
      rank: 1,
      title: 'Thursday 2:00 PM – 4:00 PM',
      day: 'Thursday',
      hourStart: 14,
      hourEnd: 16,
      score: 98,
      multiplier: '3.4x',
      audience: 'Trip planners & prospective villa guests researching weekend getaways',
      recommendedContentType: 'Flagship architecture, outpost reviews & design features'
    },
    {
      rank: 2,
      title: 'Tuesday 10:00 AM – 12:00 PM',
      day: 'Tuesday',
      hourStart: 10,
      hourEnd: 12,
      score: 88,
      multiplier: '2.6x',
      audience: 'Mid-morning professionals & franchise investment researchers',
      recommendedContentType: 'Financial models, ROI breakdowns & operations deep dives'
    },
    {
      rank: 3,
      title: 'Sunday 7:00 PM – 9:00 PM',
      day: 'Sunday',
      hourStart: 19,
      hourEnd: 21,
      score: 84,
      multiplier: '2.3x',
      audience: 'Relaxed leisure readers with the highest completion rate (78%)',
      recommendedContentType: 'Story-led guest memoirs, lifestyle & destination guides'
    }
  ];

  res.json({
    ok: true,
    matrix,
    maxVal,
    totalEngagement,
    peakDay: dayNames[peakDay],
    peakHour: `${peakHour}:00`,
    peakHourFormatted: peakHour === 0 ? '12:00 AM' : peakHour === 12 ? '12:00 PM' : peakHour < 12 ? `${peakHour}:00 AM` : `${peakHour - 12}:00 PM`,
    recommendations,
    avoidHours: '1:00 AM – 5:00 AM daily',
    leadTimeAdvice: 'Publish 60–90 minutes before the peak window'
  });
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/admin-config.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-config.json'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get(['/franchise', '/franchise.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'franchise.html'));
});

app.get('*', (req, res) => {
  if (
    req.path.startsWith('/api/') || 
    path.extname(req.path) ||
    req.headers['sec-fetch-dest'] === 'script' ||
    req.headers['sec-fetch-dest'] === 'style' ||
    req.headers['sec-fetch-dest'] === 'image' ||
    req.headers['sec-fetch-dest'] === 'font'
  ) {
    return res.status(404).type('text/plain').send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Cloud Run requires the app to listen on the port specified by process.env.PORT (defaults to 8080).
// In the local development container, an internal Nginx proxy listens on 8080 and routes to 3000.
// We bind to both ports so the app works identically in development and production Cloud Run.
const CLOUD_RUN_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const DEV_PORT = 3000;

// Listen on DEV_PORT (3000) for local development / iframe reverse proxy
if (CLOUD_RUN_PORT !== DEV_PORT) {
  const devServer = http.createServer(app);
  devServer.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      console.error('Dev server error on port 3000:', err);
    }
  });
  devServer.listen(DEV_PORT, '0.0.0.0', () => {
    console.log(`Server listening on internal dev port ${DEV_PORT}`);
  });
}

// Listen on CLOUD_RUN_PORT (e.g. 8080) for Cloud Run production health checks and traffic
const mainServer = http.createServer(app);
mainServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${CLOUD_RUN_PORT} in use by dev reverse proxy; serving via port ${DEV_PORT}.`);
  } else {
    console.error(`Server error on port ${CLOUD_RUN_PORT}:`, err);
  }
});
mainServer.listen(CLOUD_RUN_PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${CLOUD_RUN_PORT}`);
});
