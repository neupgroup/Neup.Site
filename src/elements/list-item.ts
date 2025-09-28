import type { CanvasElementData } from "@/lib/schemas";

export const listItem: CanvasElementData = {
    id: '',
    type: 'list-item',
    properties: {
        'content.text': 'List Item',
        'spacing.padding': '10px',
        'layout.display': 'block',
    },
    editorProperties: ['content', 'typography', 'spacing']
};
