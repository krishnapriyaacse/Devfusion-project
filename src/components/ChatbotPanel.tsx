import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "bot",
      text: "Hi! I'm SphereBot, your AI Host. How can I help you today? Ask me about booking tickets, refund requests, earnable gamified points, or events happening in Chennai!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const resp = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await resp.json();
      
      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "I am processing that. Let me know if you need anything else!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: "bot",
        text: "Apologies, it seems I had trouble reaching the coordinate relays. Please check your network and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const prepopulatedPrompts = [
    "Tell me about Chennai events",
    "How does the refund system work?",
    "How do I earn points & badges?",
  ];

  const triggerQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      <motion.button
        id="btn-bot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-200/50 relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X key="close" className="w-5 h-5" />
          ) : (
            <MessageSquare key="msg" className="w-5 h-5 animate-pulse" />
          )}
        </AnimatePresence>
        <span className="absolute right-full mr-3 whitespace-nowrap bg-white text-slate-800 text-[11px] font-bold py-1 px-2.5 rounded-lg border border-slate-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Ask SphereBot AI
        </span>
      </motion.button>

      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="panel-bot-dialog"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute bottom-18 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[550px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-650 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white">SphereBot</h3>
                  <p className="text-[10px] text-white/95 font-semibold">Active AI Event Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
              <div className="text-center py-1">
                <span className="text-[9px] bg-slate-150 border border-slate-200 bg-slate-200 text-slate-600 py-0.5 px-2.5 rounded-full font-mono font-bold">
                  Sandbox AI Assistance
                </span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 border font-bold text-[10px] shrink-0 ${
                      m.sender === "user"
                        ? "bg-slate-100 border-slate-200"
                        : "bg-indigo-50 border-indigo-100"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed font-medium ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-slate-505 font-bold text-[10px] shrink-0">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="p-3 bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none text-xs flex items-center gap-1.5 min-w-[60px] shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-indigo-455 bg-indigo-400 rounded-full animate-bounce duration-1000"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-455 bg-indigo-400 rounded-full animate-bounce duration-1000 delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-455 bg-indigo-400 rounded-full animate-bounce duration-1000 delay-300"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
              {prepopulatedPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => triggerQuestion(q)}
                  className="whitespace-nowrap bg-slate-50 hover:bg-slate-100 text-[10px] text-slate-605 text-slate-600 border border-slate-200 py-1.5 px-2.5 rounded-full flex items-center gap-1 transition-colors pointer-cursor cursor-pointer font-bold"
                >
                  <HelpCircle className="w-3 h-3 text-indigo-500 hover:text-indigo-600 font-bold" />
                  {q}
                </button>
              ))}
            </div>

            {/* Event Chat input area */}
            <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <input
                id="inp-bot-chat"
                type="text"
                placeholder="Ask about details, refunds, tickets..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3.5 py-2 hover:border-slate-350 focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
              />
              <button
                id="btn-bot-send"
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
