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
    const cfg = await (await fetch('https://redflaghomes.in/firebase-applet-config.json')).json();
    const { GoogleAuth } = await import('google-auth-library');
    const token = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getAccessToken();
    const r = await fetch('https://identitytoolkit.googleapis.com/admin/v2/projects/' + cfg.projectId + '/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Goog-User-Project': cfg.projectId },
      body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } })
    });
    console.log('[admin-setup] email/password sign-in:', r.ok ? 'enabled' : 'FAILED ' + r.status + ' ' + (await r.text()).slice(0, 300));
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();
    try {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, emailVerified: true });
      console.log('[admin-setup] admin login updated for', email);
    } catch (e) {
      if (e && e.code === 'auth/user-not-found') { await auth.createUser({ email, password, emailVerified: true }); console.log('[admin-setup] admin login created for', email); }
      else throw e;
    }
  } catch (e) {
    console.error('[admin-setup] failed:', e && e.message);
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

// Red Flag Homes: serve the Bella, Admin and Journal pages byte for byte from GitHub (via the jsDelivr CDN).
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit the files' code; to update the pages, only change RF_VERSION.
const RF_VERSION = 'abc7ff507e4b80eb47d2a807988510fd48bee9d5';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_PAGES = [
  { match: (p) => p === '/bella' || p === '/bella/' || p === '/bella/index.html', file: 'bella-redflaghomes.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/admin' || p === '/admin/' || p === '/admin/index.html', file: 'admin.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/journal.js', file: 'journal/journal.js', type: 'application/javascript; charset=utf-8' },
  { match: (p) => p === '/journal' || p.startsWith('/journal/'), file: 'journal/index.html', type: 'text/html; charset=utf-8' },
];
const rfCache = new Map();
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const page = RF_PAGES.find((x) => x.match(req.path));
  if (!page) return next();
  const send = (body) => res.set('Content-Type', page.type).set('Cache-Control', 'public, max-age=300').send(body);
  try {
    let hit = rfCache.get(page.file);
    if (!hit || Date.now() - hit.at > 10 * 60 * 1000) {
      const r = await fetch(RF_CDN + page.file);
      if (!r.ok) throw new Error('CDN ' + r.status);
      hit = { at: Date.now(), body: await r.text() };
      rfCache.set(page.file, hit);
    }
    send(hit.body);
  } catch (err) {
    const old = rfCache.get(page.file);
    if (old) return send(old.body);
    res.status(502).type('text/plain').send('This page is temporarily unavailable. Please refresh in a moment.');
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
  if (req.path.startsWith('/api/') || path.extname(req.path)) {
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
