
import type { CanvasElementData } from '@/services/canvas/type';

export const heading: CanvasElementData = {
    id: '',
    type: 'heading',
    properties: {
        'text': 'New Heading',
        'padding': '10px',
        'display': 'block',
        'fontSize': '24px',
        'fontWeight': 'bold',
        'textAlign': 'left',
        'level': 1,
    },
    editorProperties: ['content', 'layout', 'typography', 'spacing', 'effects']
};
