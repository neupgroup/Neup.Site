import type { CanvasElementData } from "@/lib/schemas";

export const label: CanvasElementData = {
    id: '',
    type: 'label',
    properties: {
        'text': 'Label',
        'padding': '10px',
        'display': 'block',
    },
    editorProperties: ['content', 'typography', 'spacing', 'effects']
};
