
import type { CanvasElementData } from "@/core/lib/schemas";

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
