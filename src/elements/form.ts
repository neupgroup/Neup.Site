import type { CanvasElementData } from "@/lib/schemas";

export const form: CanvasElementData = {
    id: '',
    type: 'form',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
