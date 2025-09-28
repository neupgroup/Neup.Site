import type { CanvasElementData } from "@/lib/schemas";

export const html: CanvasElementData = {
    id: '',
    type: 'html',
    properties: {
        'html.htmlContent': '<div>Generated HTML</div>',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '50px',
    },
    editorProperties: [] // No standard properties, controlled by custom HTML
};
