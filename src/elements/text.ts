import type { CanvasElementData } from "@/lib/schemas";

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    properties: {
        'content.text': 'New Text',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.fontSize': '16px',
        'typography.textAlign': 'left',
    },
    editorProperties: ['content', 'typography', 'spacing']
};
