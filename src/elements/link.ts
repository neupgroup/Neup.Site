import type { CanvasElementData } from "@/lib/schemas";

export const link: CanvasElementData = {
    id: '',
    type: 'link',
    properties: {
        'content.text': 'Link',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.textDecoration': 'underline',
        'link.href': '#',
    },
    editorProperties: ['content', 'link', 'typography', 'spacing']
};
