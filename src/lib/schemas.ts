'use client';
import { z } from 'zod';

export const GenerateSiteSectionInputSchema = z.object({
  prompt: z.string().describe('A user prompt describing the desired website section.'),
});
export type GenerateSiteSectionInput = z.infer<typeof GenerateSiteSectionInputSchema>;


const CanvasElementDataSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().describe("A unique identifier for the element. Should be a descriptive slug, e.g., 'hero-title-123'."),
    type: z.enum(['text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'link', 'video', 'list', 'list-item', 'form', 'label', 'textarea']).describe("The type of the element."),
    content: z.string().optional().describe("Text content for elements like text, button, or heading."),
    styles: z.any().describe("A map of CSS properties and their values. Use camelCase for property names (e.g., 'fontSize'). You can use standard CSS values, including pixels ('px'), percentages ('%'), and HSL variables like 'hsl(var(--primary))'."),
    props: z.any().optional().describe("A map of additional properties for the element. For 'heading', use 'level' (1-6). For 'image', use 'src' and 'alt'. For 'input', use 'placeholder'."),
    children: z.array(CanvasElementDataSchema).optional().describe("An array of child elements, for container-type elements like 'section', 'div', or 'container'."),
    customCss: z.string().optional().describe("A string of raw CSS to be applied directly to the element. Use this for advanced styles like pseudo-classes (:hover) or complex selectors."),
    className: z.string().optional().describe("A string of CSS classes to apply to the element."),
}));

export const GenerateSiteSectionOutputSchema = z.object({
  section: CanvasElementDataSchema.describe('The generated website section as a single root CanvasElementData object, which should be of type "section".'),
});
export type GenerateSiteSectionOutput = z.infer<typeof GenerateSiteSectionOutputSchema>;

export const GenerateTemplateFromImageInputSchema = z.object({
    prompt: z.string().describe('A user prompt describing the desired website section.'),
    imageDataUri: z.string().optional().describe("An optional image of a website section, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateTemplateFromImageInput = z.infer<typeof GenerateTemplateFromImageInputSchema>;


export const TemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  templateHtml: z.string(),
  type: z.enum(['section', 'page', 'element']),
  createdBy: z.string().optional(), // Assuming user ID will be stored here
  createdAt: z.any().optional(), // serverTimestamp will be used
});

export type Template = z.infer<typeof TemplateSchema>;
