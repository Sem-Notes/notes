import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const SYSTEM_PROMPT = `
You are Nyra, a witty, friendly college study assistant for SemNotes.
Always give answers in a fun, engaging tone. Use emojis, real-world desi examples,
mnemonics, and comparisons students can relate to.
Language tone: Hinglish (Telugu-English casual tone).
Audience: Indian college students.
`;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  systemInstruction: SYSTEM_PROMPT,
});

export async function* sendToGeminiStream(messages) {
  // Prepare the chat history for Gemini
  const history = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  let stream;
  try {
    stream = await chat.sendMessageStream(messages[messages.length - 1].content);
  } catch (err) {
    yield "Sorry, Nyra is having trouble connecting to Gemini right now.";
    return;
  }

  let response = "";
  for await (const chunk of stream.stream) {
    const part = chunk.text();
    response += part;
    yield response;
  }
} 