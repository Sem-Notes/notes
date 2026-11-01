import { supabase } from "@/integrations/supabase/client";

export async function fetchNyraChats(userId) {
    const { data, error } = await supabase
      .from("nyra_chats")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }); // FIXED
    if (error) throw error;
    return data;
  }

export async function saveNyraChat({ userId, question, response }) {
  const { error } = await supabase.from("nyra_chats").insert([
    { user_id: userId, question, response },
  ]);
  if (error) throw error;
}