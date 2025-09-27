'use server';

/**
 * @fileOverview Provides an AI flow to convert an HTML string into a CanvasElementData JSON structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateSiteSectionOutputSchema } from '@/lib/schemas';


export const HtmlToJsonInputSchema = z.object({
  html: z.string().describe('An HTML string, representing a website section, component, or element. It may contain inline styles.'),
});
export type HtmlToJsonInput = z.infer<typeof HtmlToJsonInputSchema>;


const systemPrompt = `You are an expert web developer tasked with converting a raw HTML snippet into a structured JSON object that conforms to the CanvasElementData schema.

- Analyze the provided HTML and map its structure, content, and inline styles to the corresponding fields in the JSON schema.
- Convert kebab-case CSS properties from inline styles to camelCase (e.g., 'background-color' becomes 'backgroundColor').
- Ensure the output is a single, valid JSON object representing the root element of the provided HTML. The root element's type should be "section".

User's HTML snippet:
{{{html}}}
`;


export async function htmlToJson(input: HtmlToJsonInput) {
    const { output } = await ai.generate({
      prompt: systemPrompt.replace('{{{html}}}', input.html), // Simple replacement as we have a single variable
      output: {
        schema: GenerateSiteSectionOutputSchema,
      },
    });

    if (!output) {
        throw new Error('Failed to convert HTML to JSON. The AI model did not return any output.');
    }

    return output;
}
