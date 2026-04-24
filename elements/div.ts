import type { CanvasElementData } from "@/lib/schemas";

export const div: CanvasElementData = {
    id: '',
    type: 'div',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
        'flexDirection': 'row',
        'justifyContent': 'flex-start',
        'alignItems': 'stretch',
        'flexWrap': 'nowrap',
    },
    editorProperties: ['layout', 'spacing', 'flexbox', 'background', 'borders', 'effects']
};