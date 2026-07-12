import type { CanvasElementData } from "@/services/canvas/type";

export const html: CanvasElementData = {
    id: '',
    type: 'html',
    properties: {
        'htmlContent': '<div>Generated HTML</div>',
        'padding': '10px',
        'display': 'block',
        'minHeight': '50px',
    },
    editorProperties: [] // No standard properties, controlled by custom HTML
};
