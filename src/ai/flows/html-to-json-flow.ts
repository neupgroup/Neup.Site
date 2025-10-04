
'use server';
/**
 * @fileOverview Converts HTML into the CanvasElementData JSON structure.
 *
 * - convertHtmlToJson - A function that handles the HTML to JSON conversion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CanvasElementDataSchema, type CanvasElementData } from '@/lib/schemas';
import { logErrorToFirestore } from '@/actions/logging';

const HtmlToJsonOutputSchema = z.object({
  elements: z.array(CanvasElementDataSchema),
});

export async function convertHtmlToJson(html: string): Promise<CanvasElementData[]> {
    try {
        const { output } = await htmlToJsonPrompt(html);
        if (!output?.elements) {
            throw new Error('AI failed to generate a valid element array.');
        }
        return output.elements;
    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to convert HTML to JSON: ${error.message}`,
            stack: error.stack,
            source: 'convertHtmlToJson',
        });
        throw new Error('Failed to convert HTML to JSON. An error has been logged.');
    }
}

const htmlToJsonPrompt = ai.definePrompt({
  name: 'htmlToJsonPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.string(),
  },
  output: {
    schema: HtmlToJsonOutputSchema,
  },
  prompt: `
    You are an expert at converting raw HTML into a specific JSON structure.
    Your task is to convert the provided HTML into a JSON array of objects that conform to the CanvasElementData schema.
    The user is providing HTML for a SINGLE, REPEATING item in a list (e.g., a single product card). You must output an array containing the root element(s) for that single item.

    Schema Definition:
    - Each element must have an 'id' (string, unique), 'type' (string enum), and 'properties' (object).
    - It can optionally have a 'children' array of other elements.
    - 'type' can be one of: 'text', 'image', 'button', 'section', 'div', 'container', 'input', 'heading', 'video', 'list', 'list-item', 'form', 'label', 'textarea', 'html'.
    - 'properties' should contain CSS styles and other attributes.
    - Text content of an element should be placed in 'properties.text'.
    - For <a> tags, convert them into a 'text' element with the full '<a>...</a>' tag as the value for 'properties.text'.
    - For <img> tags, map 'src' to 'properties.src' and 'alt' to 'properties.alt'.
    - Map style attributes to properties directly (e.g., 'style="font-weight: bold;"' becomes '"fontWeight": "bold"').

    Example HTML:
    '''html
    <section style="background-color: #f0f0f0; padding: 20px;">
      <h1>Welcome</h1>
      <p>This is a paragraph.</p>
    </section>
    '''

    Example JSON Output:
    '''json
    {
      "elements": [
        {
          "id": "section-1",
          "type": "section",
          "properties": {
            "backgroundColor": "#f0f0f0",
            "padding": "20px"
          },
          "children": [
            {
              "id": "heading-1",
              "type": "heading",
              "properties": {
                "text": "Welcome",
                "level": 1
              }
            },
            {
              "id": "text-1",
              "type": "text",
              "properties": {
                "text": "This is a paragraph."
              }
            }
          ]
        }
      ]
    }
    '''

    IMPORTANT:
    - Generate unique, descriptive IDs for each element (e.g., 'section-123').
    - Do not use the 'style' property. Extract all CSS styles into individual properties in the 'properties' object (e.g., "backgroundColor": "red").
    - Ensure the output is a valid JSON object with an 'elements' array representing the structure of a SINGLE item.

    Convert the following HTML:
    {{{input}}}
  `,
});
