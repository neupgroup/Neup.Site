import type { CanvasElementData } from "@/lib/schemas";

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': '1px dashed hsl(var(--border))',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
