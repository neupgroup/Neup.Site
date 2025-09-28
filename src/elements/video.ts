import type { CanvasElementData } from "@/lib/schemas";

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.width': '320px',
        'layout.height': '240px',
        'video.src': 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    editorProperties: ['layout', 'spacing']
};
