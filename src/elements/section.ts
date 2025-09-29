import type { CanvasElementData } from "@/lib/schemas";

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
        'flexbox.flexDirection': 'row',
        'flexbox.justifyContent': 'flex-start',
        'flexbox.alignItems': 'stretch',
        'flexbox.flexWrap': 'nowrap',
    },
    editorProperties: ['layout', 'spacing', 'flexbox', 'background', 'borders', 'effects']
};
