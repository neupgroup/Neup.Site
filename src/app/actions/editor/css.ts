'use server';

import {
  processCss,
  type ProcessCssInput,
  type ProcessCssOutput,
} from '@/ai/flows/process-css';

export async function processCssAction(
  input: ProcessCssInput
): Promise<ProcessCssOutput> {
  const result = await processCss(input);
  return result;
}
