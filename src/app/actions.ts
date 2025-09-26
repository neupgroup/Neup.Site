'use server';

import {
  getAiDesignSuggestions,
  type AiDesignSuggestionsInput,
  type AiDesignSuggestionsOutput,
} from '@/ai/flows/ai-design-suggestions';
import {
  processCss,
  type ProcessCssInput,
  type ProcessCssOutput,
} from '@/ai/flows/process-css';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function getAiDesignSuggestionsAction(
  input: AiDesignSuggestionsInput
): Promise<AiDesignSuggestionsOutput> {
  // Here you could add authentication or validation logic
  const suggestions = await getAiDesignSuggestions(input);
  return suggestions;
}

export async function processCssAction(
  input: ProcessCssInput
): Promise<ProcessCssOutput> {
  const result = await processCss(input);
  return result;
}

export async function logErrorToFirestore(error: { message: string, stack?: string, componentStack?: string }) {
    try {
        await addDoc(collection(db, "errors"), {
            message: error.message,
            stack: error.stack,
            componentStack: error.componentStack,
            timestamp: serverTimestamp(),
            source: 'client-action',
        });
    } catch (dbError: any) {
        console.error("Failed to log error to Firestore:", dbError);
        // We can't throw here, or we might get into a loop.
        // The error is already logged to the console on the server.
    }
}
