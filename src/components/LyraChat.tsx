import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import QuickPrompts from '@/components/nyra/QuickPrompts';
import TypingIndicator from '@/components/nyra/TypingIndicator';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { marked } from 'marked';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

export default function LyraChat({ user }: { user: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Fetch chat history for user
  useEffect(() => {
    async function fetchChats() {
      const { data, error } = await supabase
        .from('lyra_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setChats(data);
        if (data.length > 0) {
          setCurrentChatId(data[0].id);
          setMessages(data[0].messages || []);
        }
      }
    }
    fetchChats();
  }, [user.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle chat selection
  const selectChat = (chat: Chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || []);
    setSidebarOpen(false);
  };

  // Create new chat
  const handleNewChat = async () => {
    const { data, error } = await supabase
      .from('lyra_chats')
      .insert({
        user_id: user.id,
        title: 'New Chat',
        messages: [],
      })
      .select();
    if (!error && data && data[0]) {
      setChats([data[0], ...chats]);
      setCurrentChatId(data[0].id);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    await supabase.from('lyra_chats').delete().eq('id', chatId);
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  // Send message
  const handleSend = async (msg?: string) => {
    const messageToSend = (msg ?? input).trim();
    if (!messageToSend || !currentChatId) return;
    const userMsg: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    try {
      const res = await fetch('/api/lyra-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          chatId: currentChatId,
          userId: user.id,
        }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Update chat in Supabase
      await supabase.from('lyra_chats').update({
        messages: [...messages, userMsg, assistantMsg],
        title: messages.length === 0 ? messageToSend.slice(0, 30) : chats.find(c => c.id === currentChatId)?.title,
      }).eq('id', currentChatId);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, Lyra is having trouble right now. Try again later!', timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Render markdown with emoji support
  function renderMarkdown(md: string) {
    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-background/95">
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 w-72 bg-background/95 border-r border-border/50 backdrop-blur-xl transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:static md:translate-x-0 md:flex-shrink-0'
      )}>
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Button onClick={handleNewChat} className="flex-1 gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg">
            <Plus className="h-4 w-4" /> New Chat
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2 space-y-1">
            {chats.map(chat => (
              <div key={chat.id} className="group relative">
                <Button
                  variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-2 pr-8', chat.id === currentChatId && 'bg-primary/10 text-primary hover:bg-primary/20')}
                  onClick={() => selectChat(chat)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteChat(chat.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/50 backdrop-blur-xl">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 mx-auto">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Lyra</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center text-muted-foreground py-12"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-full blur-xl" />
                  <Sparkles className="h-12 w-12 mx-auto relative text-primary" />
                </div>
                <h2 className="text-3xl font-semibold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Hey! I'm Lyra 😎
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  Ask me anything about your sem notes, concepts, or subjects. I've got your back!
                </p>
                <QuickPrompts onSelect={handleSend} />
              </motion.div>
            )}
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 max-w-[80%] shadow-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 backdrop-blur-sm'
                    )}
                  >
                    {renderMarkdown(message.content)}
                    <div className="text-xs mt-2 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted/50 backdrop-blur-sm shadow-lg">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Lyra anything..."
                className="flex-1 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="shrink-0 bg-primary hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 