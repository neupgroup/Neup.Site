import { z } from 'zod';

export type CanvasElementType =
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'section'
  | 'div'
  | 'container'
  | 'input'
  | 'video'
  | 'list'
  | 'list-item'
  | 'form'
  | 'label'
  | 'textarea'
  | 'html';

export interface Repeater {
  enabled: boolean;
  dataPath: string;
}

export interface CanvasElementData {
  id: string;
  type: CanvasElementType;
  properties: Record<string, any>;
  children?: CanvasElementData[];
  repeater?: Repeater;
  dataBindings?: Record<string, string>;
  editorProperties?: string[];
}

export const RepeaterSchema = z.object({
  enabled: z.boolean(),
  dataPath: z.string(),
});

export const CanvasElementDataSchema: z.ZodType<CanvasElementData> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum([
      'text',
      'heading',
      'image',
      'button',
      'section',
      'div',
      'container',
      'input',
      'video',
      'list',
      'list-item',
      'form',
      'label',
      'textarea',
      'html',
    ]),
    properties: z.record(z.any()),
    children: z.array(CanvasElementDataSchema).optional(),
    repeater: RepeaterSchema.optional(),
    dataBindings: z.record(z.string()).optional(),
    editorProperties: z.array(z.string()).optional(),
  }),
);
