import type { CanvasElementData } from "@/lib/schemas";

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'minHeight': '100px',
        'border': '1px dashed hsl(var(--border))',
    },
    editorProperties: ['spacing', 'background', 'borders', 'effects']
};
