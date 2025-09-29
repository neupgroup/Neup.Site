import type { CanvasElementData } from "@/lib/schemas";

export const label: CanvasElementData = {
    id: '',
    type: 'label',
    properties: {
        'content.text': 'Label',
        'spacing.padding': '10px',
        'layout.display': 'block',
    },
    editorProperties: ['content', 'typography', 'spacing', 'effects']
};
