import type { CanvasElementData } from "@/lib/schemas";

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'minHeight': '100px',
        'border': '1px dashed hsl(var(--border))',
        'maxWidth': '1100px',
        'marginLeft': 'auto',
        'marginRight': 'auto',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
