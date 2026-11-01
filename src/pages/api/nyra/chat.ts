import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId } = req.body;

    // Get user's notes from Supabase
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    if (notesError) {
      throw notesError;
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create context from user's notes
    const notesContext = notes
      .map((note: any) => `${note.subject} - ${note.title}: ${note.description}`)
      .join('\n');

    // Create chat history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: `You are Nyra, a friendly and helpful AI study companion. You have access to the following notes:\n${notesContext}\n\nPlease help the user with their study-related questions. Use markdown formatting, emojis, and a friendly tone.`,
        },
        {
          role: 'model',
          parts: "Hi! I'm Nyra, your study buddy! 🌟 I'll help you with your notes and study questions. Feel free to ask me anything!",
        },
      ],
    });

    // Generate response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Store chat in Supabase
    const { error: chatError } = await supabase
      .from('nyra_chats')
      .insert({
        user_id: userId,
        question: message,
        response: text,
        timestamp: new Date().toISOString(),
      });

    if (chatError) {
      console.error('Error storing chat:', chatError);
    }

    return res.status(200).json({ response: text });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 