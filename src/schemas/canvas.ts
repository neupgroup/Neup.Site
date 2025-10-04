
import { z } from 'zod';

export const CanvasElementDataSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']),
  properties: z.record(z.any()),
  children: z.array(z.lazy(() => CanvasElementDataSchema)).optional(),
});

export type CanvasElementData = z.infer<typeof CanvasElementDataSchema>;
