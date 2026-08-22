
import type { CanvasElementData } from '@/services/canvas/type';

export const listItem: CanvasElementData = {
    id: '',
    type: 'list-item',
    properties: {
        'text': 'List Item',
        'padding': '10px',
        'display': 'block',
    },
    editorProperties: ['content', 'layout', 'typography', 'spacing', 'effects']
};
