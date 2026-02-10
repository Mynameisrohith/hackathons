import { NextResponse } from 'next/server';
import { getStrategicInsight } from '@/ai/flows/strategic-insight-flow';

// Main POST handler for the insight API
export async function POST(request: Request) {
    try {
        // In a real app, you might protect this route by checking for an admin user session
        
        const insight = await getStrategicInsight(null);
        
        return NextResponse.json({ insight });

    } catch (error: any) {
        console.error('AI Insight API Error:', error.message);
        return NextResponse.json({ error: 'Failed to get a response from the AI assistant.' }, { status: 500 });
    }
}
