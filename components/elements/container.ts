import type { CanvasElementData } from "@/core/lib/schemas";

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
        'maxWidth': '1100px',
        'marginLeft': 'auto',
        'marginRight': 'auto',
        'minHeight': '60px', // Changed from height to minHeight
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};