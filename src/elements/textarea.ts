import type { CanvasElementData } from "@/lib/schemas";

export const textarea: CanvasElementData = {
    id: '',
    type: 'textarea',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.height': '80px',
        'layout.width': '200px',
        'textarea.placeholder': 'Enter more text...',
    },
    editorProperties: ['layout', 'spacing', 'effects']
};
