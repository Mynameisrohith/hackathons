'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Bot, Loader2, User, Sparkles, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askAdminAssistant } from '@/ai/flows/admin-voice-assistant';

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const conversationEndRef = useRef<HTMLDivElement | null>(null);

     useEffect(() => {
        if (isOpen && conversation.length === 0) {
            setConversation([{sender: 'ai', text: "Hello! I'm your admin assistant. How can I help you with the store today?"}]);
        }
    }, [isOpen, conversation]);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);


    const handleQuery = async (query: string) => {
        if (!query.trim()) return;
        
        setConversation(prev => [...prev, { sender: 'user', text: query }]);
        setIsProcessing(true);
        try {
            const aiResponseText = await askAdminAssistant(query);
            setConversation(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
            
        } catch (error) {
            console.error('AI assistant error:', error);
            const errorMessage = "I'm sorry, I encountered an error. Please try again.";
            setConversation(prev => [...prev, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleQuery(input);
        setInput('');
    }
    
    return (
        <>
            <Button
                size="icon"
                className="fixed bottom-8 right-8 h-16 w-16 rounded-full gradient-btn shadow-2xl animate-subtle-pulse"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="h-8 w-8" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md card-glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           <Bot /> AI Admin Assistant
                        </DialogTitle>
                    </DialogHeader>
                    <div className="h-96 space-y-4 overflow-y-auto p-4 rounded-md bg-background/50">
                        {conversation.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-2", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                                {msg.sender === 'ai' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                                <div className={cn("max-w-xs rounded-lg px-3 py-2 text-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    {msg.text}
                                </div>
                                {msg.sender === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                            </div>
                        ))}
                         {isProcessing && (
                            <div className="flex items-start gap-2 justify-start">
                                <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                                <div className="max-w-xs rounded-lg px-3 py-2 text-sm bg-muted flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={conversationEndRef} />
                    </div>
                    <DialogFooter>
                        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about sales, inventory..."
                                disabled={isProcessing}
                                autoFocus
                            />
                            <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
