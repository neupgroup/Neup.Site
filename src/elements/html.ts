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
    type: 'div', // Changed from 'html' to 'div'
    properties: {
        'width': '100%',
        'height': '4rem',
        'border': '2px dashed hsl(var(--primary))',
        'borderRadius': '0.5rem',
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'center',
        'color': 'hsl(var(--primary))',
        'backgroundColor': 'hsla(var(--primary) / 0.1)',
        'margin': '0.5rem 0',
        'transition': 'all 150ms ease-in-out',
        // 'text': 'Drop here', // Removed text property for the placeholder
    }
}