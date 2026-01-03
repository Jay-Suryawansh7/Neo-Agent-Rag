import { Plus, Trash2, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    isOpen: boolean; // For mobile/desktop toggle
    setIsOpen: (open: boolean) => void;
}

export function ChatSidebar({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
    isOpen,
    setIsOpen
}: ChatSidebarProps) {
    const navigate = useNavigate();

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="fixed md:relative z-40 h-full bg-black/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out"
                >
                    <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/40">
                        <button
                            onClick={() => navigate('/')}
                            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group"
                            title="Back to Home"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -ml-4 group-hover:ml-0">Home</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Conversations</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => onSelect(chat.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg mb-1 group relative transition-all duration-200",
                                    activeId === chat.id
                                        ? "bg-white/10 text-white"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                )}
                            >
                                <div className="pr-6 truncate text-sm font-medium">
                                    {chat.title}
                                </div>
                                <div className="text-[10px] opacity-60 mt-1 font-mono">
                                    {new Date(chat.updatedAt).toLocaleDateString()}
                                </div>

                                {/* Delete Action */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(chat.id, e);
                                    }}
                                    className={cn(
                                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-red-500/20 hover:text-red-400 opacity-0 transition-opacity",
                                        activeId === chat.id ? "opacity-100" : "group-hover:opacity-100"
                                    )}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={onNew}
                            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg py-3 text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Thread
                        </button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
