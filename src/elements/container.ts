import type { CanvasElementData } from "@/lib/schemas";

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': '1px dashed hsl(var(--border))',
        'maxWidth': '1100px',
        'marginLeft': 'auto',
        'marginRight': 'auto',
        'height': '60px',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
