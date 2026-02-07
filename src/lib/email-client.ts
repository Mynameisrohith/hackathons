
'use client';
import type { EmailPayload } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export async function sendEmail(payload: EmailPayload) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }
    
    // Optional: show a success toast for certain email types, but can be noisy.
    // console.log(`Email of type "${payload.emailType}" sent successfully.`);

  } catch (error) {
    console.error('Email client error:', error);
    toast({
      variant: 'destructive',
      title: 'Email Error',
      description: (error as Error).message || 'Could not send notification email.',
    });
  }
}
