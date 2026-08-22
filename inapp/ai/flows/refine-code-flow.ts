
'use server';
/**
 * @fileOverview Refines a given code snippet based on a user's prompt.
 *
 * - refineCode - A function that handles the code refinement.
 */

import { ai } from '@/inapp/ai/genkit';
import { z } from 'genkit';

const RefineCodeInputSchema = z.object({
  code: z.string().describe('The code snippet to be refined.'),
  prompt: z.string().describe('The user prompt guiding the refinement.'),
});
type RefineCodeInput = z.infer<typeof RefineCodeInputSchema>;

const RefineCodeOutputSchema = z.object({
  code: z.string().describe('The refined code snippet.'),
});
type RefineCodeOutput = z.infer<typeof RefineCodeOutputSchema>;


export async function refineCode(input: RefineCodeInput): Promise<RefineCodeOutput> {
  const { output } = await refineCodePrompt(input);
  if (!output?.code) {
    throw new Error('AI failed to generate a valid refined code.');
  }
  return output;
}

const refineCodePrompt = ai.definePrompt({
  name: 'refineCodePrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: RefineCodeInputSchema,
  },
  output: {
    schema: RefineCodeOutputSchema,
  },
  prompt: `
    You are an expert code assistant. Your task is to refine the given code based on the user's prompt.
    Only return the full, updated code. Do not add any explanations or markdown formatting.

    Code to refine:
    \'\'\'
    {{{code}}}
    \'\'\'

    User's instruction:
    "{{{prompt}}}"

    Return the complete, refined code as a single block.
  `,
});
