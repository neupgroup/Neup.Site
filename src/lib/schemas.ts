'use client';
import { z } from 'zod';

export type EditorProperty = {
    key: string;
    label: string;
    inputType: 'text' | 'select' | 'color' | 'textarea';
    target: 'styles' | 'props' | 'content' | 'htmlContent' | 'customCss' | 'className';
    options?: {
        selectOptions?: { label: string, value: string }[];
        rows?: number;
    };
    placeholder?: string;
    suggestions?: string[];
    showIf?: {
        key: string;
        value: any;
    }
}

export type EditorPropertyGroup = {
    groupName: string;
    properties?: EditorProperty[];
}

export type EditorProperties = string[];

// Define the TypeScript type for a canvas element first.
export interface CanvasElementData {
  id: string;
  type: 'text' | 'image' | 'button' | 'section' | 'div' | 'container' | 'input' | 'heading' | 'video' | 'list' | 'list-item' | 'form' | 'label' | 'textarea' | 'html';
  properties: Record<string, any>;
  children?: CanvasElementData[];
  editorProperties?: EditorProperties;
}

// Now, define the Zod schema using the TypeScript type.
// We use z.any() for children to break the recursive loop that causes issues with some APIs.
// The AI's adherence to the prompt is what ensures the children are structured correctly.
export const CanvasElementDataSchema: z.ZodType<CanvasElementData> = z.lazy(() => z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']),
    properties: z.record(z.any()),
    children: z.array(CanvasElementDataSchema).optional(),
    editorProperties: z.any().optional(),
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
