import type { CanvasElementData } from "@/lib/schemas";

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': '1px dashed hsl(var(--border))',
        'flexDirection': 'row',
        'justifyContent': 'flex-start',
        'alignItems': 'stretch',
        'flexWrap': 'nowrap',
    },
    editorProperties: ['layout', 'spacing', 'flexbox', 'background', 'borders', 'effects']
};
