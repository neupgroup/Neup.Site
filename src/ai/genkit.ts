import {genkit, Ai} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = new Ai({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
