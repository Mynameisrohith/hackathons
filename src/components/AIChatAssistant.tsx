'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { MessageSquare, Bot, User, Send, Loader2, X } from 'lucide-react';
import { useUser } from '@/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from '@/hooks/use-toast';

type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
};

export function AIChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const { user } = useUser();
    const { language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ sender: 'ai', text: 'Hello! How can I help you today?' }]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || !user) {
            if(!user) toast({ variant: 'destructive', title: 'Please log in to use the assistant.'})
            return;
        };

        setIsLoading(true);
        setMessages(prev => [...prev, { sender: 'user', text: trimmedInput }]);
        setInput('');

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmedInput, userId: user.uid, language: language === 'kn' ? 'Kannada' : 'English' }),
            });

            if (!response.ok) {
                throw new Error('Failed to get a response from the server.');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                size="icon"
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 chat-gradient-background text-white animate-subtle-pulse"
                onClick={() => setIsOpen(true)}
            >
                <MessageSquare className="h-8 w-8" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="p-0 border-0 max-w-lg w-[90vw] h-[80vh] flex flex-col chat-gradient-background neon-border">
                    <DialogHeader className="p-4 border-b border-white/10 text-white">
                        <DialogTitle>Commerce360 AI Assistant</DialogTitle>
                         <Button variant="ghost" size="icon" className="absolute right-4 top-3 text-white/70 hover:text-white" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn("flex items-end gap-2", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.sender === 'ai' && (
                                    <Avatar className="h-8 w-8 bg-blue-500 text-white">
                                        <AvatarFallback><Bot size={18}/></AvatarFallback>
                                    </Avatar>
                                )}
                                <p className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm chat-bubble",
                                    msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'
                                )}>
                                    {msg.text}
                                </p>
                                {msg.sender === 'user' && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gray-600 text-white"><User size={18}/></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-end gap-2 justify-start">
                                <Avatar className="h-8 w-8 bg-blue-500 text-white">
                                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                                </Avatar>
                                <p className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm chat-bubble bg-gray-700 text-white rounded-bl-none">
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                </p>
                             </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    <DialogFooter className="p-4 border-t border-white/10">
                        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about products, orders..."
                                disabled={isLoading}
                                autoFocus
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-blue-500"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input} className="bg-blue-500 hover:bg-blue-600">
                                <Send className="h-5 w-5"/>
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
