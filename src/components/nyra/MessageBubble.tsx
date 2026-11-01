import React from "react";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow text-base whitespace-pre-line ${
          isUser
            ? "bg-purple-500 text-white text-right"
            : "bg-white text-left text-purple-700 border border-purple-100"
        }`}
      >
        {/* TODO: Replace with real markdown renderer */}
        {content}
      </div>
    </div>
  );
}