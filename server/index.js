const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON requests

// Initialize Gemini API
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY; // Use process.env for server-side

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables on the server.');
  // Exit or disable API route if key is missing
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// API route for Nyra chat
app.post('/api/nyra/chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const { message, userId } = req.body; // userId is not used here, but good to pass through if needed later

    // Get the generative model with the correct model name and generation config
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.0-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Create chat history for context
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `You are Nyra, a friendly and helpful AI study companion. Please help the user with their study-related questions. Use markdown formatting, emojis, and a friendly tone.` }],
        },
        {
          role: 'model',
          parts: [{ text: "Hi! I'm Nyra, your study buddy! 🌟 I'll help you with your notes and study questions. Feel free to ask me anything!" }],
        },
      ],
    });

    // Send message to Gemini
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // In a real app, you might also store this chat history server-side for persistence

    res.status(200).json({ response: text });
  } catch (error) {
    console.error('Error in backend Nyra chat endpoint:', error);
    res.status(500).json({ error: 'Failed to generate response from Gemini.' });
  }
});

app.listen(port, () => {
  console.log(`Nyra backend proxy server listening on port ${port}`);
}); 