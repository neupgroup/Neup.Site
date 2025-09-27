'use server';

/**
 * @fileOverview Provides an AI-powered service to generate website section designs.
 *
 * - generateSiteSectionPrompt - A Genkit prompt that generates a site section based on a user prompt.
 */

import {ai} from '@/ai/genkit';
import { GenerateSiteSectionInputSchema, GenerateSiteSectionOutputSchema, type GenerateSiteSectionInput, type GenerateSiteSectionOutput } from '@/lib/schemas';


export const generateSiteSectionPrompt = ai.definePrompt({
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
