import type { CanvasElementData } from "@/lib/schemas";

export const form: CanvasElementData = {
    id: '',
    type: 'form',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'minHeight': '100px',
        'border': '1px dashed hsl(var(--border))',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
