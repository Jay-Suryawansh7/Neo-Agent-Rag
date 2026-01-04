import { useState, useEffect } from 'react';
import type { Conversation, Message, Role } from '@/types/chat';
import { detectIntent, generateTitle, generateId } from '@/lib/chat-utils';

const STORAGE_KEY = 'antigravity_chats';

export function useChatStore() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
        // Restore last active or default to most recent
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync to storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, isLoaded]);

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  const createConversation = (initialMessage?: string) => {
    const newId = generateId();
    const title = initialMessage ? generateTitle(initialMessage) : "New Thread";

    const newChat: Conversation = {
      id: newId,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
    return newId;
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const sendMessage = (content: string, role: Role = 'user', reasoning?: string[]) => {
    let chatId = activeId;

    // Auto-create if no chat active
    if (!chatId) {
      chatId = createConversation(content);
    }

    const { mode, cleanMessage } = detectIntent(content);

    const newMessage: Message = {
      id: generateId(),
      role,
      content: cleanMessage,
      reasoning, // Add logic to accept this
      mode: role === 'user' ? mode : undefined,
      timestamp: Date.now(),
    };

    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        // Update title if it's the first real user message and title is generic
        const shouldUpdateTitle = c.messages.length === 0 && role === 'user';
        return {
          ...c,
          title: shouldUpdateTitle ? generateTitle(cleanMessage) : c.title,
          messages: [...c.messages, newMessage],
          updatedAt: Date.now(),
        };
      }
      return c;
    }));

    // Re-sort/bump to top is optional, but for now we keep order based on creation or bump
    // Let's bump active chat to top
    setConversations(prev => {
      const active = prev.find(c => c.id === chatId);
      const others = prev.filter(c => c.id !== chatId);
      return active ? [active, ...others] : prev;
    });

    return chatId; // Return ID in case we need it
  };

  /**
   * Update the last message in the active conversation (for streaming)
   */
  const updateLastMessage = (content: string) => {
    if (!activeId) return;

    setConversations(prev => prev.map(c => {
      if (c.id === activeId && c.messages.length > 0) {
        const updatedMessages = [...c.messages];
        const lastIndex = updatedMessages.length - 1;
        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          content,
        };
        return {
          ...c,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };
      }
      return c;
    }));
  };

  return {
    conversations,
    activeId,
    activeConversation,
    setActiveId,
    createConversation,
    deleteConversation,
    sendMessage,
    updateLastMessage,
    isLoaded
  };
}

