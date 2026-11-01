import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import NyraChat from "../components/nyra/NyraChat";

export default function NyraPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Hey! I'm <span className="text-purple-600">Nyra</span> 😎</h1>
          <p className="text-lg text-gray-700">Ask me anything about your sem notes, concepts, or subjects. I've got your back!</p>
        </div>
        <NyraChat />
      </div>
    </div>
  );
} 