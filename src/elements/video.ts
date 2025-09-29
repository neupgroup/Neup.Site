import type { CanvasElementData } from "@/lib/schemas";

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    properties: {
        'padding': '0px',
        'display': 'block',
        'width': '100%',
        'height': 'auto',
        'src': 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    editorProperties: ['video', 'layout', 'spacing', 'effects']
};
