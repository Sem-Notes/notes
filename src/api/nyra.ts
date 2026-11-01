import { supabase } from '@/integrations/supabase/client';

// No direct Gemini API initialization here, it's handled by the backend proxy

export async function chatWithNyra(message: string, userId: string) {
  try {
    const response = await fetch('http://localhost:3001/api/nyra/chat', { // Call your backend proxy
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId, // Pass userId if your backend needs it
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from backend');
    }

    const data = await response.json();
    const formattedResponse = formatResponse(data.response);

    // Store chat in Supabase (client-side, as before)
    const { error: dbError } = await supabase
      .from('nyra_chats')
      .insert({
        user_id: userId,
        question: message,
        response: formattedResponse,
      });

    if (dbError) {
      console.error('Error storing chat in Supabase:', dbError);
      // Continue even if storage fails, main chat functionality is prioritized
    }

    return { response: formattedResponse };
  } catch (error) {
    console.error('Error in chatWithNyra (frontend):', error);
    throw new Error(error.message || 'Failed to generate response');
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