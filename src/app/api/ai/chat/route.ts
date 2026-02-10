import { NextResponse } from 'next/server';
import { chatWithAssistant } from '@/ai/flows/chat-assistant-flow';

// Main POST handler for the chat API
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, userId, language = 'English' } = body;

        if (!message || !userId) {
            return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 });
        }

        const reply = await chatWithAssistant({ message, userId, language });
        
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('AI Chat API Error:', error.message);
        return NextResponse.json({ error: 'Failed to get a response from the AI assistant.' }, { status: 500 });
    }
}
