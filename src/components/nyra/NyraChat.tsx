import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchNyraChats, saveNyraChat } from "../../lib/supabase-nyra";
import { sendToGeminiStream } from "../../lib/gemini";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatHistory from "./ChatHistory";

export default function NyraChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]); // {role: 'user'|'nyra', content: string}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNyraChats(user.id).then(setHistory);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
  
    let nyraResponse = "";
    // Add a placeholder for Nyra's response
    setMessages((msgs) => [...msgs, { role: "nyra", content: "" }]);
  
    let nyraMsgIndex = null;
    setMessages((msgs) => {
      nyraMsgIndex = msgs.length - 1;
      return msgs;
    });
  
    for await (const chunk of sendToGeminiStream([...messages, userMsg])) {
      nyraResponse += chunk;
      setMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: "nyra", content: nyraResponse };
        return updated;
      });
    }
  
    setLoading(false);
  
    if (user) {
      await saveNyraChat({ userId: user.id, question: userMsg.content, response: nyraResponse });
      fetchNyraChats(user.id).then(setHistory);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <ChatHistory history={history} />
      <div className="flex flex-col gap-2 bg-white rounded-lg shadow p-4 min-h-[300px]">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <input
          className="flex-1 border border-purple-200 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-purple-300 bg-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
} 