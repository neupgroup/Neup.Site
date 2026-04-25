import type { CanvasElementData } from "@/core/lib/schemas";

export const input: CanvasElementData = {
    id: '',
    type: 'input',
    properties: {
        'padding': '10px',
        'display': 'block',
        'height': '40px',
        'width': '200px',
        'placeholder': 'Enter text...',
        'type': 'text'
    },
    editorProperties: ['layout', 'spacing', 'effects']
};
