

import { z } from 'zod';

export const RepeaterSchema = z.object({
  enabled: z.boolean(),
  dataPath: z.string(),
});

export const CanvasElementDataSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']),
  properties: z.record(z.any()),
  children: z.array(z.lazy(() => CanvasElementDataSchema)).optional(),
  repeater: RepeaterSchema.optional(),
  dataBindings: z.record(z.string()).optional(),
});

export type CanvasElementData = z.infer<typeof CanvasElementDataSchema>;
export type Repeater = z.infer<typeof RepeaterSchema>;
