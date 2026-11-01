import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const systemPrompt = `
You are Lyra, a witty, friendly college study assistant for SemNotes.
Always give answers in a fun, engaging tone. Use emojis, real-world desi examples,
mnemonics, and comparisons students can relate to.
Language tone: Hinglish (Telugu-English casual tone).
Audience: Indian college students.
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { message, chatId, userId } = req.body;
    if (!message || !chatId || !userId) return res.status(400).json({ error: 'Missing params' });

    // Fetch previous messages for context
    const { data: chatData } = await supabase
      .from('lyra_chats')
      .select('messages')
      .eq('id', chatId)
      .single();
    const history = chatData?.messages || [];

    // Prepare Gemini chat history
    const geminiHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    ];

    // Use Gemini Pro 1.5 if available, else Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Save to Supabase
    const newMessages = [...history, { role: 'user', content: message, timestamp: new Date().toISOString() }, { role: 'assistant', content: text, timestamp: new Date().toISOString() }];
    await supabase.from('lyra_chats').update({ messages: newMessages }).eq('id', chatId);

    res.status(200).json({ response: text });
  } catch (error: any) {
    console.error('Lyra API error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
} 