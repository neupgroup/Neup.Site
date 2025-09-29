import type { CanvasElementData } from "@/lib/schemas";

export const input: CanvasElementData = {
    id: '',
    type: 'input',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.height': '40px',
        'layout.width': '200px',
        'input.placeholder': 'Enter text...',
        'input.type': 'text'
    },
    editorProperties: ['layout', 'spacing', 'effects']
};
