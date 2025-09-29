import type { CanvasElementData } from "@/lib/schemas";

export const listItem: CanvasElementData = {
    id: '',
    type: 'list-item',
    properties: {
        'text': 'List Item',
        'padding': '10px',
        'display': 'block',
    },
    editorProperties: ['content', 'typography', 'spacing', 'effects']
};
