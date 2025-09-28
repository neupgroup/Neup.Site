import type { CanvasElementData } from "@/lib/schemas";

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
    },
    editorProperties: ['spacing', 'background', 'borders']
};
