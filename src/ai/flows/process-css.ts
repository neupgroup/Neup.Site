'use server';

/**
 * @fileOverview Provides a service to process CSS with Tailwind directives.
 *
 * - processCss - a function that takes CSS content with Tailwind directives and returns processed, standard CSS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const ProcessCssInputSchema = z.object({
  css: z.string().describe('The CSS content including Tailwind directives like @tailwind base;'),
});
export type ProcessCssInput = z.infer<typeof ProcessCssInputSchema>;

const ProcessCssOutputSchema = z.object({
  processedCss: z.string().describe('The processed CSS with Tailwind directives expanded.'),
});
export type ProcessCssOutput = z.infer<typeof ProcessCssOutputSchema>;


export async function processCss(input: ProcessCssInput): Promise<ProcessCssOutput> {
  return processCssFlow(input);
}


const processCssFlow = ai.defineFlow(
  {
    name: 'processCssFlow',
    inputSchema: ProcessCssInputSchema,
    outputSchema: ProcessCssOutputSchema,
  },
  async (input) => {
    const processor = postcss([tailwindcss('tailwind.config.ts' as any)]);
    const result = await processor.process(input.css, { from: undefined });
    return { processedCss: result.css };
  }
);
