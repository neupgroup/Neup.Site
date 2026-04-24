
import type { CanvasElementData } from "@/lib/schemas";

export const button: CanvasElementData = {
    id: '',
    type: 'button',
    properties: {
        'text': 'New Button',
        'display': 'inline-block',
        'padding': '10px 20px',
        'fontSize': '16px',
        'color': 'hsl(var(--primary-foreground))',
        'backgroundColor': 'hsl(var(--primary))',
        'textAlign': 'center',
        'borderRadius': 'var(--radius)',
        'border': 'none',
        'cursor': 'pointer',
    },
    editorProperties: ['content', 'layout', 'spacing', 'typography', 'background', 'borders', 'effects']
};
