'use server';

/**
 * @fileOverview Provides a service to process CSS with Tailwind directives.
 *
 * - processCss - A function that takes CSS content with Tailwind directives and returns processed, standard CSS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from '../../../tailwind.config.ts';

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
    const result = await postcss([tailwindcss(tailwindConfig as any)]).process(input.css, { from: undefined });
    return { processedCss: result.css };
  }
);
