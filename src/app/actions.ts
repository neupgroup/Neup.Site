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
import { z } from 'zod';


// Schema and types for generateSiteSection, moved from the flow file.
export const GenerateSiteSectionInputSchema = z.object({
  prompt: z.string().describe('A user prompt describing the desired website section.'),
});
export type GenerateSiteSectionInput = z.infer<typeof GenerateSiteSectionInputSchema>;


const CanvasElementDataSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().describe("A unique identifier for the element. Should be a descriptive slug, e.g., 'hero-title-123'."),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading']).describe("The type of the element."),
    content: z.string().optional().describe("Text content for elements like text, button, or heading."),
    styles: z.record(z.string(), z.any()).describe("A map of CSS properties and their values. Use camelCase for property names (e.g., 'fontSize'). You can use standard CSS values, including pixels ('px'), percentages ('%'), and HSL variables like 'hsl(var(--primary))'."),
    props: z.record(z.string(), z.any()).optional().describe("A map of additional properties for the element. For 'heading', use 'level' (1-6). For 'image', use 'src' and 'alt'. For 'input', use 'placeholder'."),
    children: z.array(CanvasElementDataSchema).optional().describe("An array of child elements, for container-type elements like 'section', 'div', or 'container'."),
    customCss: z.string().optional().describe("A string of raw CSS to be applied directly to the element. Use this for advanced styles like pseudo-classes (:hover) or complex selectors."),
}));

export const GenerateSiteSectionOutputSchema = z.object({
  section: CanvasElementDataSchema.describe('The generated website section as a single root CanvasElementData object, which should be of type "section".'),
});
export type GenerateSiteSectionOutput = z.infer<typeof GenerateSiteSectionOutputSchema>;


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
