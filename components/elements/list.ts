import type { CanvasElementData } from "@/core/lib/schemas";

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