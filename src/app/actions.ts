'use server';

import {
  getAiDesignSuggestions,
  type AiDesignSuggestionsInput,
  type AiDesignSuggestionsOutput,
} from '@/ai/flows/ai-design-suggestions';
import {
  processCss,
  type ProcessCssInput,
  type ProcessCssOutput,
} from '@/ai/flows/process-css';

export async function getAiDesignSuggestionsAction(
  input: AiDesignSuggestionsInput
): Promise<AiDesignSuggestionsOutput> {
  // Here you could add authentication or validation logic
  const suggestions = await getAiDesignSuggestions(input);
  return suggestions;
}

export async function processCssAction(
  input: ProcessCssInput
): Promise<ProcessCssOutput> {
  const result = await processCss(input);
  return result;
}
