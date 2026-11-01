import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini API with environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_PUBLIC_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured' });
  }

  try {
    const { message, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate content
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Format the response with markdown
    const formattedResponse = formatResponse(text);

    // Store chat in Supabase
    const { error: dbError } = await supabase
      .from('nyra_chats')
      .insert({
        user_id: userId,
        question: message,
        response: formattedResponse,
      });

    if (dbError) {
      console.error('Error storing chat:', dbError);
      // Continue even if storage fails
    }

    res.status(200).json({ response: formattedResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}

function formatResponse(text: string): string {
  // Add emojis and formatting
  const formattedText = text
    .replace(/^# (.*)/gm, '✨ **$1**') // Headers
    .replace(/^- (.*)/gm, '• $1') // Bullet points
    .replace(/\[(.*?)\]\((.*?)\)/g, '📎 [$1]($2)') // Links
    .replace(/`(.*?)`/g, '`$1`') // Code blocks
    .replace(/^(.*?):/gm, '🔹 $1:') // Key points
    .replace(/^(.*?)\n/gm, '$1\n\n'); // Add spacing

  return formattedText;
} 