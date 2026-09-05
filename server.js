const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

// Initialize Gemini
let ai;
try {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} catch (e) {
  console.error("Gemini API Key missing or invalid");
}

app.post('/api/chat', async (req, res) => {
  try {
    const { history, message } = req.body;
    
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured." });
    }

    // history should be an array of objects like { role: "user" | "model", parts: [{ text: "..." }] }
    let contents = history || [];
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are a helpful and knowledgeable concierge for Red Flag Homes Network. You answer questions about travel, luxury stays, and franchise opportunities.",
      },
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message });
  }
});


app.use(express.static(__dirname));

app.get('/franchise.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'franchise.html'));
});

app.get('*', (req, res) => {

  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
