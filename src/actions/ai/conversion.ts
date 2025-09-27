'use server';

import {
  htmlToJson,
  type HtmlToJsonInput,
} from '@/ai/flows/html-to-json';
import { type GenerateSiteSectionOutput } from '@/lib/schemas';


export async function htmlToJsonAction(
  input: HtmlToJsonInput
): Promise<GenerateSiteSectionOutput> {
  const result = await htmlToJson(input);
  if (!result) {
    throw new Error(
      'Failed to convert HTML to JSON. The AI model did not return any output.'
    );
  }
  return result;
}
