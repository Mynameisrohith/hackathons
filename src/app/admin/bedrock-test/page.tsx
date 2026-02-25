
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, User, Sparkles } from 'lucide-react';
import { fetchBedrockResponse } from '@/lib/bedrock-client';
import { toast } from '@/hooks/use-toast';

export default function BedrockTestPage() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setResponse('');

        try {
            const reply = await fetchBedrockResponse(prompt);
            setResponse(reply);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Calling AI Assistant',
                description: error.message || 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-card-enter">
            <PageHeader
                title="Bedrock AI Assistant"
                subtitle="Test the integration with the Amazon Bedrock API via a secure Firebase Cloud Function."
            />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="card-glass">
                        <CardHeader>
                            <CardTitle>AI Prompt</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., What were our top 5 selling products last month?"
                                    rows={4}
                                    disabled={isLoading}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isLoading || !prompt.trim()}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2" />
                                    )}
                                    Ask AI Assistant
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {(isLoading || response) && (
                        <Card className="card-glass mt-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot /> AI Response
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                    <div
                                        className="prose prose-sm prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
