import type { CanvasElementData } from "@/schemas/canvas";

export const form: CanvasElementData = {
    id: '',
    type: 'form',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};