import type { CanvasElementData } from "@/schemas/canvas";

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    properties: {
        'text': 'New Text Block',
        'tag': 'p', // p, h1, h2, h3, h4, h5, h6
        'padding': '10px',
        'display': 'block',
        'fontSize': '16px',
        'textAlign': 'left',
    },
    editorProperties: ['content', 'layout', 'typography', 'spacing', 'effects']
};