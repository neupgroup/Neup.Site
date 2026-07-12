import type { CanvasElementData } from "@/services/canvas/type";

export const textarea: CanvasElementData = {
    id: '',
    type: 'textarea',
    properties: {
        'padding': '10px',
        'display': 'block',
        'height': '80px',
        'width': '200px',
        'placeholder': 'Enter more text...',
    },
    editorProperties: ['layout', 'spacing', 'effects']
};
