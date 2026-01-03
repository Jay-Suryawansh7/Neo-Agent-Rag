
import { ClaudeChatInput as PromptInputBox } from "@/components/ui/ai-prompt-box";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { useState, useEffect, useRef } from "react";

import { useChatStore } from "@/hooks/use-chat-store";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Menu } from "lucide-react";

const API_URL = "http://localhost:8000/api/chat";

export default function Chat() {
  const {
    conversations,
    activeId,
    activeConversation,
    sendMessage,
    setActiveId,
    createConversation,
    deleteConversation,
    isLoaded
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const handleSendMessage = async (data: any) => {
    const rawContent = typeof data === 'string' ? data : data.message;
    if (!rawContent.trim() || isLoading) return;

    sendMessage(rawContent, 'user');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawContent,
          conversation_id: activeId || 'new'
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const result = await response.json();

      // Format response for the chat store (expects JSON string for assistant)
      sendMessage(JSON.stringify({ blocks: result.blocks }), 'assistant');
    } catch (error) {
      console.error('Chat API error:', error);
      sendMessage(JSON.stringify({
        blocks: [{ type: 'paragraph', content: 'Sorry, I encountered an error. Please try again.' }]
      }), 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    createConversation();
    // On mobile, maybe close sidebar?
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  if (!isLoaded) return null; // Or loading spinner

  return (
    <div className="flex h-screen w-full bg-black relative overflow-hidden font-sans">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewChat}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between relative z-10 h-full">

        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-emerald-900/20 opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-30" />
        </div>

        {/* Header */}
        <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-zinc-500 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-zinc-400 tracking-wider">
                {activeConversation?.title || "New Thought"}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 w-full relative z-10 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-800 pb-32">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="w-full h-full flex flex-col justify-center">
              <AnimatedAIChat onSendMessage={handleSendMessage} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full px-4 py-8">
              {activeConversation.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area (Only show if chat is active) */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <div className="absolute bottom-6 w-full max-w-3xl px-4 z-30 left-1/2 -translate-x-1/2">
            <PromptInputBox onSendMessage={handleSendMessage} />
          </div>
        )}

      </div>
    </div>
  );
}
