import type { CanvasElementData } from "@/lib/schemas";

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    properties: {
        'spacing.padding': '0px',
        'layout.display': 'block',
        'layout.width': '100%',
        'layout.height': 'auto',
        'video.src': 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    editorProperties: ['video', 'layout', 'spacing']
};
