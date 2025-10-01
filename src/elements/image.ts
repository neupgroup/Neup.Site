
import type { CanvasElementData } from "@/lib/schemas";

export const image: CanvasElementData = {
    id: '',
    type: 'image',
    properties: {
        'padding': '0px',
        'display': 'block',
        'width': '100%',
        'height': 'auto',
        'src': 'https://picsum.photos/seed/1/200/100',
        'alt': 'Placeholder image',
        'data-ai-hint': 'placeholder',
    },
    editorProperties: ['image', 'layout', 'spacing', 'borders', 'effects']
};
