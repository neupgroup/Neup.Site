'use server';

import {
  getAiDesignSuggestions,
  type AiDesignSuggestionsInput,
  type AiDesignSuggestionsOutput,
} from '@/ai/flows/ai-design-suggestions';

export async function getAiDesignSuggestionsAction(
  input: AiDesignSuggestionsInput
): Promise<AiDesignSuggestionsOutput> {
  // Here you could add authentication or validation logic
  const suggestions = await getAiDesignSuggestions(input);
  return suggestions;
}
