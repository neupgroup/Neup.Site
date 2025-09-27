'use server';

import {
  getAiDesignSuggestions,
  type AiDesignSuggestionsInput,
  type AiDesignSuggestionsOutput,
} from '@/ai/flows/ai-design-suggestions';
import { generateSiteSection } from '@/ai/flows/generate-site-section';
import {
  processCss,
  type ProcessCssInput,
  type ProcessCssOutput,
} from '@/ai/flows/process-css';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { type GenerateSiteSectionInput, type GenerateSiteSectionOutput } from '@/lib/schemas';


export async function getAiDesignSuggestionsAction(
  input: AiDesignSuggestionsInput
): Promise<AiDesignSuggestionsOutput> {
  // Here you could add authentication or validation logic
  const suggestions = await getAiDesignSuggestions(input);
  return suggestions;
}

export async function generateSiteSectionAction(
    input: GenerateSiteSectionInput
): Promise<GenerateSiteSectionOutput> {
    const result = await generateSiteSection(input);
    return result;
}

export async function processCssAction(
  input: ProcessCssInput
): Promise<ProcessCssOutput> {
  const result = await processCss(input);
  return result;
}

export async function logErrorToFirestore(error: { message: string, stack?: string, componentStack?: string }) {
    try {
        const errorsCollectionRef = collection(db, "errors");
        await addDoc(errorsCollectionRef, {
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

export async function saveSite(elements: any) {
    try {
        const siteRef = doc(db, 'sites', 'published-site');
        await setDoc(siteRef, {
            elements,
            publishedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to save site:", error);
        await logErrorToFirestore({ message: 'Failed to save site: ' + error.message, stack: error.stack });
        return { success: false, error: error.message || 'Failed to save site.' };
    }
}
