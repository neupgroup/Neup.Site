'use server';

/**
 * @fileOverview Provides an AI flow to generate a website template from an image and a prompt.
 */

import { ai } from '@/ai/genkit';
import { GenerateSiteSectionOutputSchema, GenerateTemplateFromImageInputSchema, type GenerateTemplateFromImageInput } from '@/lib/schemas';

const systemPrompt = `You are an expert web designer AI. Your task is to generate the JSON structure for a single website section based on a user's prompt and an optional accompanying image. The output must be a single root element of type "section".

- Interpret the user's prompt and analyze the image (if provided) to create a visually appealing and functional layout.
- If an image is provided, use it as the primary inspiration for the design, colors, and layout.
- Use the available element types: 'section', 'div', 'container', 'heading', 'text', 'button', 'image', 'input'.
- Apply appropriate styling using the 'styles' object. You can use standard CSS properties in camelCase. Use placeholder images from 'https://picsum.photos/seed/<seedId>/<width>/<height>' where needed.
- Structure nested elements correctly using the 'children' array. A 'section' must contain other elements.
- Ensure the final output is a single JSON object with a 'section' key, containing one root element of type 'section' that adheres to the provided schema.
- Do not invent new element types. Stick to the provided list.
- For colors, prefer using the HSL CSS variables available in a Tailwind/ShadCN theme, for example: 'hsl(var(--background))', 'hsl(var(--foreground))', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted))', 'hsl(var(--accent))'.
`;


const generateTemplateFromImageFlow = ai.defineFlow(
  {
    name: 'generateTemplateFromImageFlow',
    inputSchema: GenerateTemplateFromImageInputSchema,
    outputSchema: GenerateSiteSectionOutputSchema,
  },
  async (input) => {
    
    const { prompt, imageDataUri } = input;
    
    let fullPrompt: any[] = [{text: systemPrompt}, {text: `User Prompt: ${prompt}`}];

    if (imageDataUri) {
      fullPrompt.push({media: {url: imageDataUri }});
      fullPrompt.push({text: 'Use the provided image as inspiration for the design.'});
    }

    const { output } = await ai.generate({
      prompt: fullPrompt,
      output: {
        schema: GenerateSiteSectionOutputSchema,
      },
    });
    
    return output!;
  }
);


export async function generateTemplateFromImage(input: GenerateTemplateFromImageInput) {
    return generateTemplateFromImageFlow(input);
}
