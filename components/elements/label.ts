
import type { CanvasElementData } from '@/services/canvas/type';

export const label: CanvasElementData = {
    id: '',
    type: 'label',
    properties: {
        'text': 'Label',
        'padding': '10px',
        'display': 'block',
    },
    editorProperties: ['content', 'layout', 'typography', 'spacing', 'effects']
};
