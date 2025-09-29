import type { CanvasElementData } from "@/lib/schemas";

export const button: CanvasElementData = {
    id: '',
    type: 'button',
    properties: {
        'content.text': 'New Button',
        'layout.display': 'inline-block',
        'spacing.padding': '10px 20px',
        'typography.fontSize': '16px',
        'typography.color': 'hsl(var(--primary-foreground))',
        'background.backgroundColor': 'hsl(var(--primary))',
        'typography.textAlign': 'center',
        'borders.borderRadius': 'var(--radius)',
        'borders.border': 'none',
        'attributes.cursor': 'pointer',
    },
    editorProperties: ['content', 'layout', 'spacing', 'typography', 'background', 'borders', 'effects']
};
