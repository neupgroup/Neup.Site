import type { CanvasElementData } from "@/lib/schemas";

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
        'layout.maxWidth': '1100px',
        'spacing.marginLeft': 'auto',
        'spacing.marginRight': 'auto',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
