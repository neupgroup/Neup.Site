'use server';

/**
 * @fileOverview Provides an AI-powered service to generate website section designs.
 *
 * - generateSiteSection - A function that generates a site section based on a user prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSiteSectionInputSchema = z.object({
  prompt: z.string().describe('A user prompt describing the desired website section.'),
});
type GenerateSiteSectionInput = z.infer<typeof GenerateSiteSectionInputSchema>;


const CanvasElementDataSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().describe("A unique identifier for the element. Should be a descriptive slug, e.g., 'hero-title-123'."),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading']).describe("The type of the element."),
    content: z.string().optional().describe("Text content for elements like text, button, or heading."),
    styles: z.record(z.string(), z.any()).describe("A map of CSS properties and their values. Use camelCase for property names (e.g., 'fontSize'). You can use standard CSS values, including pixels ('px'), percentages ('%'), and HSL variables like 'hsl(var(--primary))'."),
    props: z.record(z.string(), z.any()).optional().describe("A map of additional properties for the element. For 'heading', use 'level' (1-6). For 'image', use 'src' and 'alt'. For 'input', use 'placeholder'."),
    children: z.array(CanvasElementDataSchema).optional().describe("An array of child elements, for container-type elements like 'section', 'div', or 'container'."),
    customCss: z.string().optional().describe("A string of raw CSS to be applied directly to the element. Use this for advanced styles like pseudo-classes (:hover) or complex selectors."),
}));

const GenerateSiteSectionOutputSchema = z.object({
  section: CanvasElementDataSchema.describe('The generated website section as a single root CanvasElementData object, which should be of type "section".'),
});
type GenerateSiteSectionOutput = z.infer<typeof GenerateSiteSectionOutputSchema>;

export async function generateSiteSection(input: GenerateSiteSectionInput): Promise<GenerateSiteSectionOutput> {
  return generateSiteSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSiteSectionPrompt',
  input: {schema: GenerateSiteSectionInputSchema},
  output: {schema: GenerateSiteSectionOutputSchema},
  prompt: `You are an expert web designer AI. Your task is to generate the JSON structure for a single website section based on a user's prompt. The output must be a single root element of type "section".

  - Interpret the user's prompt to create a visually appealing and functional layout.
  - Use the available element types: 'section', 'div', 'container', 'heading', 'text', 'button', 'image', 'input'.
  - Apply appropriate styling using the 'styles' object. You can use standard CSS properties in camelCase. Use placeholder images from 'https://picsum.photos/seed/<seedId>/<width>/<height>' where needed.
  - Structure nested elements correctly using the 'children' array. A 'section' must contain other elements.
  - Ensure the final output is a single JSON object with a 'section' key, containing one root element of type 'section' that adheres to the provided schema.
  - Do not invent new element types. Stick to the provided list.
  - For colors, prefer using the HSL CSS variables available in a Tailwind/ShadCN theme, for example: 'hsl(var(--background))', 'hsl(var(--foreground))', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted))', 'hsl(var(--accent))'.

  User Prompt: {{{prompt}}}
  `,
});

const generateSiteSectionFlow = ai.defineFlow(
  {
    name: 'generateSiteSectionFlow',
    inputSchema: GenerateSiteSectionInputSchema,
    outputSchema: GenerateSiteSectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate site section. The AI model did not return any output.');
    }
    return output;
  }
);
