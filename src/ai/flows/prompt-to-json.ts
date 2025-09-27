'use server';
/**
 * @fileOverview A flow that generates structured JSON for a web component based on a text prompt.
 *
 * - promptToJson - A function that handles the generation process.
 * - PromptToJsonInput - The input type for the promptToJson function.
 * - PromptToJsonOutput - The return type for the promptToJson function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CanvasElementDataSchema } from '@/lib/schemas';

const PromptToJsonInputSchema = z.object({
  prompt: z.string().describe('A text description of the component or section to generate.'),
});
export type PromptToJsonInput = z.infer<typeof PromptToJsonInputSchema>;

const PromptToJsonOutputSchema = z.array(CanvasElementDataSchema);
export type PromptToJsonOutput = z.infer<typeof PromptToJsonOutputSchema>;


export async function promptToJson(input: PromptToJsonInput): Promise<PromptToJsonOutput> {
  return promptToJsonFlow(input);
}

const generationPrompt = ai.definePrompt({
  name: 'promptToJsonPrompt',
  input: { schema: PromptToJsonInputSchema },
  output: { schema: PromptToJsonOutputSchema },
  prompt: `You are an expert web designer who creates structured JSON for components.
  
  Your task is to generate a JSON array representing a web component or section based on the user's prompt.
  The JSON structure must conform to the provided schema.

  Key considerations:
  - Use Tailwind CSS classes for styling where appropriate, but prefer inline styles for properties not easily covered by Tailwind (like specific pixel values for padding, margin, etc., if needed).
  - Use 'hsl(var(--...))' for colors to respect the application's theme. For example: 'hsl(var(--primary))' for primary color, 'hsl(var(--background))' for background.
  - For placeholder images, use 'https://picsum.photos/seed/{seedId}/{width}/{height}'.
  - Ensure all elements have a unique 'id'.
  - Your entire output must be only the JSON array, with no other text or explanation.

  User Prompt:
  {{{prompt}}}
  `,
});


const promptToJsonFlow = ai.defineFlow(
  {
    name: 'promptToJsonFlow',
    inputSchema: PromptToJsonInputSchema,
    outputSchema: PromptToJsonOutputSchema,
  },
  async (input) => {
    const { output } = await generationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate valid JSON from the prompt.');
    }
    return output;
  }
);
