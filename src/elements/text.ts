
import type { CanvasElementData } from "@/lib/schemas";

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    properties: {
        'text': 'New Text Block. Double click to edit.',
        'padding': '10px',
        'display': 'block',
        'fontSize': '16px',
        'textAlign': 'left',
    },
    editorProperties: ['content', 'layout', 'typography', 'spacing', 'effects']
};
