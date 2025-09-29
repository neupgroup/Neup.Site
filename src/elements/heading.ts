import type { CanvasElementData } from "@/lib/schemas";

export const heading: CanvasElementData = {
    id: '',
    type: 'heading',
    properties: {
        'content.text': 'New Heading',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.fontSize': '24px',
        'typography.fontWeight': 'bold',
        'typography.textAlign': 'left',
        'heading.level': 1,
    },
    editorProperties: ['content', 'typography', 'spacing', 'effects']
};
