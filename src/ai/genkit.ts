import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { firebaseConfig } from '@/firebase/config';

export const ai = genkit({
  plugins: [googleAI({
    projectId: firebaseConfig.projectId,
    location: 'us-central1'
  })],
});
