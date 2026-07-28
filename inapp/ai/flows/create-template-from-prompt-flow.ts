
'use server';
/**
 * @fileOverview Creates a template's CanvasElementData JSON from a natural language prompt.
 *
 * - createTemplateFromPrompt - A function that handles the prompt to JSON conversion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CanvasElementDataSchema, type CanvasElementData } from '@/services/canvas/type';

const TemplateFromPromptOutputSchema = z.object({
  elements: z.array(CanvasElementDataSchema).describe("An array of canvas elements that make up the component."),
});

export async function createTemplateFromPrompt(prompt: string): Promise<CanvasElementData[]> {
  const { output } = await createTemplatePrompt(prompt);
  if (!output?.elements) {
    throw new Error('AI failed to generate a valid element array for the template.');
  }
  return output.elements;
}

const createTemplatePrompt = ai.definePrompt({
  name: 'createTemplateFromPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.string(),
  },
  output: {
    schema: TemplateFromPromptOutputSchema,
  },
  prompt: `
    You are an expert at converting a user's description of a UI component into a specific JSON structure for a website builder.
    Your task is to convert the provided prompt into a JSON array of objects that conform to the CanvasElementData schema.
    The user is describing a SINGLE, REPEATING item in a list (e.g., a single product card, a single list item). You must output an array containing the root element(s) for that single item.
    The root element should almost always be a 'section' or a 'div'.

    Schema Definition:
    - Each element must have an 'id' (string, unique), 'type' (string enum), and 'properties' (object).
    - It can optionally have a 'children' array of other elements.
    - 'type' can be one of: 'text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html'.
    - 'properties' should contain CSS styles and other attributes.
    - Text content of an element should be placed in 'properties.text'. For elements that will be bound to data, use placeholders like '{{item.name}}'.
    - For <img> tags, map 'src' to 'properties.src' and 'alt' to 'properties.alt'. Use placeholder images from 'https://picsum.photos/seed/...' and use a 'data-ai-hint' attribute with one or two keywords.
    - Map style attributes to properties directly (e.g., 'font-weight: bold;' becomes '"fontWeight": "bold"').
    - Generate unique, descriptive IDs for each element (e.g., 'product-card-section', 'item-title-heading').
    - Apply sensible default styles. Use flexbox for layout within containers.

    Example User Prompt:
    "A blog post preview card. It should have a main image at the top, a category label, a bold title, a short author byline, and a 'Read More' button."

    Example JSON Output:
    \'\'\'json
    {
      "elements": [
        {
          "id": "blog-post-card",
          "type": "section",
          "properties": {
            "display": "flex",
            "flexDirection": "column",
            "gap": "1rem",
            "padding": "1rem",
            "border": "1px solid #eee",
            "borderRadius": "8px"
          },
          "children": [
            {
              "id": "post-image",
              "type": "image",
              "properties": {
                "src": "https://picsum.photos/seed/1/400/200",
                "alt": "{{item.title}}",
                "width": "100%",
                "height": "200px",
                "objectFit": "cover",
                "data-ai-hint": "blog post"
              }
            },
            {
                "id": "post-category",
                "type": "text",
                "properties": { "text": "{{item.category}}", "fontSize": "0.8rem", "color": "#555" }
            },
            {
              "id": "post-title",
              "type": "heading",
              "properties": { "text": "{{item.title}}", "level": 3, "fontWeight": "bold" }
            },
            {
              "id": "post-author",
              "type": "text",
              "properties": { "text": "By {{item.author}}", "fontSize": "0.9rem", "color": "#777" }
            },
            {
              "id": "read-more-button",
              "type": "button",
              "properties": { "text": "Read More" }
            }
          ]
        }
      ]
    }
    \'\'\'

    IMPORTANT:
    - ALWAYS wrap the generated elements in a root 'section' or 'div'.
    - Use placeholders like '{{item.fieldName}}' for any text or image 'src' that looks like it should be dynamic.
    - Do not use the 'style' property. Extract all CSS styles into individual properties in the 'properties' object (e.g., "backgroundColor": "red").
    - Ensure the output is a valid JSON object with an 'elements' array representing the structure of a SINGLE item.

    Convert the following user prompt:
    "{{{input}}}"
  `,
});
