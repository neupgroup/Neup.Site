
import type { CanvasElementData } from "@/lib/schemas";

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


export const temp_element: CanvasElementData = {
    id: 'temp_element',
    type: 'html',
    properties: {
        htmlContent: `<div style="width: 100%; height: 4rem; border: 2px dashed hsl(var(--primary)); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: hsl(var(--primary)); background-color: hsla(var(--primary) / 0.1); margin: 0.5rem 0; transition: all 150ms ease-in-out;">Drop here</div>`
    }
}

    