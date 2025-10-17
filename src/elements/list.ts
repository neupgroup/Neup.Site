import type { CanvasElementData } from "@/schemas/canvas";

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};