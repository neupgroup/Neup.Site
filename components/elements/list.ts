import type { CanvasElementData } from '@/services/canvas/type';

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
