import type { CanvasElementData } from '@/services/canvas/type';

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    properties: {
        'padding': '10px',
        'display': 'block',
        'border': 'none',
        'flexDirection': 'row',
        'justifyContent': 'flex-start',
        'alignItems': 'stretch',
        'flexWrap': 'nowrap',
        'minHeight': '100px', // Changed from height to minHeight
        'width': '100%',
    },
    editorProperties: ['layout', 'spacing', 'flexbox', 'background', 'borders', 'effects']
};
