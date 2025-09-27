'use server';

import { promptToJson } from '@/ai/flows/prompt-to-json';

export async function generateJsonFromPrompt(prompt: string) {
  try {
    const result = await promptToJson({ prompt });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error generating JSON from prompt:', error);
    return { success: false, error: error.message || 'Failed to generate content.' };
  }
}
