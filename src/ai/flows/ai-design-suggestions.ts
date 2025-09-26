'use server';

/**
 * @fileOverview Provides AI-powered design suggestions for website improvements.
 *
 * - getAiDesignSuggestions - A function that generates design suggestions based on the current design.
 * - AiDesignSuggestionsInput - The input type for the getAiDesignSuggestions function.
 * - AiDesignSuggestionsOutput - The return type for the getAiDesignSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDesignSuggestionsInputSchema = z.object({
  designDescription: z
    .string()
    .describe('A detailed description of the current website design, including colors, fonts, layout, and content.'),
  desiredAesthetic: z
    .string()
    .describe('A description of the desired aesthetic or style for the website (e.g., minimalist, modern, corporate).'),
});
export type AiDesignSuggestionsInput = z.infer<typeof AiDesignSuggestionsInputSchema>;

const AiDesignSuggestionsOutputSchema = z.object({
  colorSuggestions: z
    .string()
    .describe('Suggestions for optimal color combinations to enhance the visual appeal.'),
  fontPairingSuggestions: z
    .string()
    .describe('Suggestions for font pairings that align with the desired aesthetic.'),
  layoutSuggestions: z
    .string()
    .describe('Suggestions for layout improvements to enhance user experience.'),
  contentSuggestions: z
    .string()
    .describe('Suggestions for content improvements to better align with the overall design and purpose.'),
});
export type AiDesignSuggestionsOutput = z.infer<typeof AiDesignSuggestionsOutputSchema>;

export async function getAiDesignSuggestions(input: AiDesignSuggestionsInput): Promise<AiDesignSuggestionsOutput> {
  return aiDesignSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDesignSuggestionsPrompt',
  input: {schema: AiDesignSuggestionsInputSchema},
  output: {schema: AiDesignSuggestionsOutputSchema},
  prompt: `You are an AI-powered design assistant that provides suggestions for website improvements.

  Analyze the current design based on the provided description and desired aesthetic, and offer suggestions for color combinations, font pairings, layout, and content.

Current Design Description: {{{designDescription}}}
Desired Aesthetic: {{{desiredAesthetic}}}

Suggestions:

Color Combinations: {{colorSuggestions}}
Font Pairings: {{fontPairingSuggestions}}
Layout Improvements: {{layoutSuggestions}}
Content Improvements: {{contentSuggestions}}`,
});

const aiDesignSuggestionsFlow = ai.defineFlow(
  {
    name: 'aiDesignSuggestionsFlow',
    inputSchema: AiDesignSuggestionsInputSchema,
    outputSchema: AiDesignSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
