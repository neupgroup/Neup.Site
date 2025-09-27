'use client';
import { z } from 'zod';

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
}

// Now, define the Zod schema using the TypeScript type.
export const CanvasElementDataSchema: z.ZodType<CanvasElementData> = z.lazy(() => z.object({
    id: z.string().describe("A unique identifier for the element. Should be a descriptive slug, e.g., 'hero-title-123'."),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'link', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html']).describe("The type of the element."),
    content: z.string().optional().describe("Text content for elements like text, button, or heading."),
    htmlContent: z.string().optional().describe("Raw HTML content for 'html' type elements."),
    styles: z.any().describe("A map of CSS properties and their values. Use camelCase for property names (e.g., 'fontSize'). You can use standard CSS values, including pixels ('px'), percentages ('%'), and HSL variables like 'hsl(var(--primary))'."),
    props: z.any().optional().describe("A map of additional properties for the element. For 'heading', use 'level' (1-6). For 'image', use 'src' and 'alt'. For 'input', use 'placeholder'."),
    children: z.array(CanvasElementDataSchema).optional().describe("An array of child elements, for container-type elements like 'section', 'div', or 'container'."),
    customCss: z.string().optional().describe("A string of raw CSS to be applied directly to the element. Use this for advanced styles like pseudo-classes (:hover) or complex selectors."),
    className: z.string().optional().describe("A string of CSS classes to apply to the element."),
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
