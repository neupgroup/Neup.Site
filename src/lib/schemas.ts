'use client';
import { z } from 'zod';

export type EditorPropertyGroup = {
    groupName: string;
}

export type EditorProperties = EditorPropertyGroup[];

// Define the TypeScript type for a canvas element first.
export interface CanvasElementData {
  id: string;
  type: 'text' | 'image' | 'button' | 'section' | 'div' | 'container' | 'input' | 'heading' | 'link' | 'video' | 'list' | 'list-item' | 'form' | 'label' | 'textarea' | 'html';
  content?: string;
  htmlContent?: string;
  styles: React.CSSProperties;
  props?: Record<string, any>;
  children?: CanvasElementData[];
  customCss?: string;
  className?: string;
  editorProperties?: EditorProperties;
}

// Now, define the Zod schema using the TypeScript type.
export const CanvasElementDataSchema: z.ZodType<CanvasElementData> = z.lazy(() => z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'link', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']),
    content: z.string().optional(),
    htmlContent: z.string().optional(),
    styles: z.any(),
    props: z.any().optional(),
    children: z.array(CanvasElementDataSchema).optional(),
    customCss: z.string().optional(),
    className: z.string().optional(),
    editorProperties: z.any().optional(), // Can't easily type this recursively with Zod
}));

export const TemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  elements: z.array(CanvasElementDataSchema),
  type: z.enum(['section', 'page', 'element']),
  createdBy: z.string().optional(), // Assuming user ID will be stored here
  createdAt: z.any().optional(), // serverTimestamp will be used, can be object or string
});

export type Template = z.infer<typeof TemplateSchema>;
