import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-purple-600 font-semibold">Nyra is typing</span>
      <span className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '100ms' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '200ms' }}>.</span>
      </span>
    </div>
  );
} 