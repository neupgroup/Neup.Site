import type { CanvasElementData } from "@/lib/schemas";

export const image: CanvasElementData = {
    id: '',
    type: 'image',
    properties: {
        'spacing.padding': '0px',
        'layout.display': 'block',
        'layout.width': '100%',
        'layout.height': 'auto',
        'image.src': 'https://picsum.photos/seed/1/200/100',
        'image.alt': 'Placeholder image',
        'image.data-ai-hint': 'placeholder',
    },
    editorProperties: ['image', 'layout', 'spacing', 'borders', 'effects']
};
