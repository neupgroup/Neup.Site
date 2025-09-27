import type { CanvasElementData } from "@/lib/schemas";

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        width: '320px',
        height: '240px',
    },
    props: {
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    }
};
