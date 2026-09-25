const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

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

app.post('/api/chat', async (req, res) => {
  try {
    const { history, message } = req.body;
    
    const ai = getAi();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured in environment." });
    }

    // history should be an array of objects like { role: "user" | "model", parts: [{ text: "..." }] }
    let contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are the knowledgeable AI Concierge & Franchise Advisor for Red Flag Homes Network, a luxury boutique villa network and franchise in India. Utilize real-time Google Search data to provide up-to-date, highly accurate insights on travel destinations, weather, seasonal tourism peaks, local experiences, flight/connectivity updates, and vacation rental market statistics. Always maintain an elegant, articulate, and hospitable luxury tone.",
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

    res.json({
      text: response.text || "",
      sources,
      searchQueries,
      grounded: sources.length > 0 || searchQueries.length > 0
    });
  } catch (error) {
    console.error("Chat API error with search grounding:", error);
    const isQuota = error.status === 429 || (error.message && error.message.includes("429"));
    res.status(error.status || 500).json({
      error: isQuota 
        ? "Gemini API quota currently exceeded. Please verify your API key in Settings > Secrets." 
        : error.message || "An error occurred while generating response."
    });
  }
});

app.post('/api/destination-intelligence', async (req, res) => {
  try {
    const { destination, query } = req.body;
    const ai = getAi();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured." });
    }

    const promptText = query || `What is the current travel outlook, seasonal weather, upcoming events, and tourism demand for luxury villa stays in ${destination || 'Goa'}?`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are a luxury travel analyst for Red Flag Homes Network. Use real-time Google Search data to deliver a concise, highly accurate brief covering: 1) Current seasonal weather & travel conditions, 2) Peak events or highlights, 3) Connectivity/travel tips, and 4) Demand outlook for villa travelers.",
        tools: [{ googleSearch: {} }]
      }
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

    res.json({
      text: response.text || "",
      sources,
      searchQueries,
      grounded: sources.length > 0 || searchQueries.length > 0
    });
  } catch (error) {
    console.error("Destination intelligence error:", error);
    const isQuota = error.status === 429 || (error.message && error.message.includes("429"));
    res.status(error.status || 500).json({
      error: isQuota
        ? "Gemini API quota currently reached. Please check your API key in Settings > Secrets."
        : error.message || "Failed to retrieve grounded destination intelligence."
    });
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

app.use(express.static(__dirname));

app.get(['/franchise', '/franchise.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'franchise.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'admin.html'))) {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.get('*', (req, res) => {
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
