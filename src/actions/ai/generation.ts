'use server';

import { generateSiteSectionPrompt } from '@/ai/flows/generate-site-section';
import { generateTemplateFromImage } from '@/ai/flows/generate-template-from-image';
import {
  type GenerateSiteSectionInput,
  type GenerateSiteSectionOutput,
  type GenerateTemplateFromImageInput,
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


export async function generateTemplateFromImageAction(
  input: GenerateTemplateFromImageInput
): Promise<GenerateSiteSectionOutput> {
  const output = await generateTemplateFromImage(input);
  // The null check is now inside generateTemplateFromImage, so we can just return the result.
  return output;
}
