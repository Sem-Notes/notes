
import React from 'react';

const Book3D = () => {
  return (
    <div className="book-container relative w-64 h-64 perspective-500">
      {/* Main book cover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-md shadow-2xl transform rotate-3 transition-transform duration-500">
        {/* Book binding */}
        <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-[#6a3093] to-primary rounded-l-md"></div>
        
        {/* Book pages effect */}
        <div className="absolute inset-1 bg-white/90 rounded-sm -rotate-1">
          <div className="h-full p-4 overflow-hidden">
            <div className="w-full border-b border-gray-300 mb-2"></div>
            <div className="w-3/4 border-b border-gray-300 mb-2"></div>
            <div className="w-1/2 border-b border-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Book title and decoration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center z-10">
          <div className="text-purple-500 text-2xl font-bold mb-1">SemNotes</div>
          <div className="text-purple-400/70 text-sm">Share Your Knowledge</div>
          <div className="mt-4 text-xs text-purple-300">
            Click to Get Started
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full p-1">
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          <div className="text-lg">📚</div>
        </div>
      </div>
      
      <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full p-1">
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          <div className="text-md">📝</div>
        </div>
      </div>

      {/* Simple shadow effect */}
      <div className="absolute -bottom-6 inset-x-4 h-6 bg-black/20 blur-md rounded-full"></div>
    </div>
  );
};

export default Book3D;
