'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Mic, MicOff, Bot, Loader2, Volume2, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askAdminAssistant } from '@/ai/flows/admin-voice-assistant';
import { convertTextToSpeech } from '@/ai/flows/tts-flow';

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

export function VoiceAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([]);
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setConversation(prev => [...prev, { sender: 'user', text: transcript }]);
                handleQuery(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleQuery = async (query: string) => {
        setIsProcessing(true);
        try {
            const aiResponseText = await askAdminAssistant(query);
            setConversation(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
            
            const audioDataUri = await convertTextToSpeech(aiResponseText);
            if (audioRef.current) {
                audioRef.current.src = audioDataUri;
                audioRef.current.play();
            }

        } catch (error) {
            console.error('AI assistant error:', error);
            const errorMessage = "I'm sorry, I encountered an error. Please try again.";
            setConversation(prev => [...prev, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsProcessing(false);
        }
    };
    
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
                <DialogContent className="sm:max-w-[425px] card-glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           <Bot /> AI Admin Assistant
                        </DialogTitle>
                    </DialogHeader>
                    <div className="h-80 space-y-4 overflow-y-auto p-4 rounded-md bg-background/50">
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
                    </div>
                    <DialogFooter>
                        <div className='w-full flex justify-center'>
                             <Button
                                size="icon"
                                onClick={toggleListening}
                                disabled={isProcessing || !recognitionRef.current}
                                className={cn(
                                    "h-16 w-16 rounded-full transition-all duration-300",
                                    isListening ? "bg-red-500 hover:bg-red-600 scale-110" : "gradient-btn"
                                )}
                            >
                                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <audio ref={audioRef} className="hidden" />
        </>
    );
}
