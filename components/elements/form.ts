import type { CanvasElementData } from '@/services/canvas/type';

export const form: CanvasElementData = {
    id: '',
    type: 'form',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
    },
    editorProperties: ['layout', 'spacing', 'background', 'borders', 'effects']
};
