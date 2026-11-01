import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, MicOff, Send, Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import QuickPrompts from '@/components/nyra/QuickPrompts';
import TypingIndicator from '@/components/nyra/TypingIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { chatWithNyra } from '@/api/nyra';
import { Link } from 'react-router-dom';

// Fix for SpeechRecognition type
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const Nyra = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start with sidebar closed for clean main view
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleSend = async (messageToSend = input) => {
    if (!messageToSend.trim() || !user) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { response } = await chatWithNyra(messageToSend, user.id);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (messages.length === 0) {
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, title: messageToSend.slice(0, 30) + (messageToSend.length > 30 ? '...' : '') }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from Nyra. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current?.focus();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error with speech recognition. Please try again.');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-background via-purple-950/20 to-background/90 text-foreground relative">
      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-end">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full shadow-lg backdrop-blur-sm bg-background/50">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-72 bg-background/90 border-r border-border/50 backdrop-blur-xl z-50 shadow-2xl shadow-black/40 flex flex-col"
          >
            {/* Sidebar Controls */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-md">
              <Button
                onClick={createNewChat}
                className="flex-1 justify-center gap-2 rounded-lg py-3 text-base font-semibold
                           bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary
                           hover:from-primary/30 hover:to-purple-500/30 transition-all duration-300 shadow-md shadow-primary/10"
              >
                <Plus className="h-5 w-5 text-primary/80" />
                New Conversation
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="ml-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Back to Home Button */}
            <Link to="/home" className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-lg py-3 text-base font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary"
              >
                <ChevronLeft className="h-5 w-5" />
                Back to Home
              </Button>
            </Link>


            {/* Chat List */}
            <ScrollArea className="flex-1 py-2">
              <div className="p-2 space-y-1">
                {chats.map(chat => (
                  <div key={chat.id} className="group relative">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 py-3 rounded-lg font-medium",
                        "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                        chat.id === currentChatId && 
                          "bg-primary/15 text-primary font-semibold shadow-inner shadow-primary/5"
                      )}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setMessages(chat.messages);
                        setIsSidebarOpen(false); // Close sidebar on chat selection
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">{chat.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity
                                 hover:bg-destructive/20 text-destructive/80"
                      onClick={() => deleteChat(chat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content & Input */}
      <div className="flex-1 flex flex-col justify-between items-center z-10 p-4">
        {/* Main Header - Always visible to toggle sidebar */}
        {!isSidebarOpen && (
          <div className="absolute top-4 left-4 z-40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full shadow-lg backdrop-blur-sm bg-background/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Nyra Branding in Main View */}
        <div className="flex items-center gap-3 mt-8 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg animate-pulse-slow" />
              <Sparkles className="h-8 w-8 text-primary relative" />
            </div>
            <span className="font-extrabold text-3xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent drop-shadow-md">
              Nyra
            </span>
          </div>

        {/* Messages / Welcome Area - Central "Canvas" */}
        <ScrollArea ref={scrollRef} className="flex-1 w-full max-w-4xl my-4 p-6 rounded-3xl bg-background/60 backdrop-blur-md shadow-2xl shadow-black/40 border border-primary/10">
          <div className="px-4 py-6 space-y-8">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center text-muted-foreground py-12"
              >
                <div className="relative w-56 h-56 mx-auto mb-12">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-slow" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-full blur-3xl" />
                  <Sparkles className="h-28 w-28 mx-auto relative text-primary animate-pulse-fast" />
                </div>
                <h2 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent drop-shadow-xl">
                  Welcome to Nyra!
                </h2>
                <p className="mb-12 text-2xl text-muted-foreground/90 font-medium">
                  Your intelligent study companion is here to assist you.
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
                    'flex items-start gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar/Icon for Assistant */}
                  {message.role === 'assistant' && (
                    <div className="w-11 h-11 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/40 shadow-lg">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  
                  {/* Message Content Block */}
                  <div
                    className={cn(
                      'rounded-2xl px-6 py-4 max-w-[70%] relative text-lg leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary/20 text-primary-foreground shadow-md shadow-primary/20 border border-primary/30'
                        : 'bg-background/80 text-foreground shadow-md shadow-black/20 border border-border/50',
                      'backdrop-blur-sm'
                    )}
                    style={{
                       // Subtle inner shadow for depth
                       boxShadow: message.role === 'user'
                         ? 'inset 0 1px 3px rgba(0,0,0,0.2)'
                         : 'inset 0 1px 3px rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="prose prose-invert max-w-none">
                      {message.content}
                    </div>
                    <div className="text-xs mt-2 opacity-60 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Avatar/Icon for User */}
                  {message.role === 'user' && (
                    <div className="w-11 h-11 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/40 shadow-lg">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 justify-start"
              >
                <div className="w-11 h-11 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/40 shadow-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="rounded-2xl px-6 py-4 bg-background/80 backdrop-blur-sm shadow-md shadow-black/20 border border-border/50">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Floating Input Area */}
        <div className="w-full max-w-4xl p-4 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-purple-500/15 rounded-3xl blur-xl opacity-80" />
          <div className="flex items-center gap-4 relative z-10 p-4 rounded-3xl bg-background/80 shadow-2xl shadow-black/50 border border-primary/20">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceInput}
              className={cn(
                'shrink-0 w-14 h-14 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors',
                isListening && 'text-primary animate-pulse bg-primary/10'
              )}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Nyra anything..."
              className="flex-1 bg-transparent border-none text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/40
                         hover:from-primary/90 hover:to-purple-500/90 transition-all duration-300"
            >
              <Send className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nyra;
