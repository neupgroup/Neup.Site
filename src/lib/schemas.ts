

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

export interface CanvasElementData {
  id: string;
  type: 'text' | 'image' | 'button' | 'section' | 'div' | 'container' | 'input' | 'heading' | 'video' | 'list' | 'list-item' | 'form' | 'label' | 'textarea' | 'html';
  properties: Record<string, any>;
  children?: CanvasElementData[];
  editorProperties?: EditorProperties;
  dataBindings?: Record<string, string>;
  repeater?: {
    enabled: boolean;
    dataPath: string;
  };
}

export const CanvasElementDataSchema: z.ZodType<CanvasElementData> = z.lazy(() => z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']),
    properties: z.record(z.any()),
    children: z.array(z.lazy(() => CanvasElementDataSchema)).optional(),
    editorProperties: z.any().optional(),
    dataBindings: z.record(z.string()).optional(),
    repeater: z.object({
        enabled: z.boolean(),
        dataPath: z.string(),
    }).optional(),
}));

export const TemplateSchema = z.object({
  id: z.string().optional(),
  siteId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  elements: z.array(CanvasElementDataSchema).optional(),
  reactComponent: z.string().optional(),
  type: z.enum(['section', 'page', 'element']),
  method: z.enum(['codebase', 'textual', 'dragger']).optional(),
  source: z.string().optional(),
  code: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.any().optional(),
});

export type Template = z.infer<typeof TemplateSchema>;
