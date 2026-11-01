import React from "react";

export default function ChatHistory({ history }) {
  if (!history?.length) return null;
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2 text-purple-700">Your Previous Chats</h2>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {history.slice().reverse().map((chat) => (
          <div key={chat.id} className="bg-gray-50 rounded p-2 border border-gray-200">
            <div className="text-sm text-gray-700 font-medium">Q: {chat.question}</div>
            <div className="text-sm text-gray-900 mt-1">Nyra: {chat.response}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 