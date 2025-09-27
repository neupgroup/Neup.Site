'use server';

import { generateSiteSectionPrompt } from '@/ai/flows/generate-site-section';
import {
  type GenerateSiteSectionInput,
  type GenerateSiteSectionOutput,
} from '@/lib/schemas';

export async function generateSiteSectionAction(
  input: GenerateSiteSectionInput
): Promise<GenerateSiteSectionOutput> {
  const { output } = await generateSiteSectionPrompt(input);
  if (!output) {
    throw new Error(
      'Failed to generate site section. The AI model did not return any output.'
    );
  }
  return output;
}
