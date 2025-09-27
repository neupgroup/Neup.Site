import type { CanvasElementData } from "@/lib/schemas";

export const image: CanvasElementData = {
    id: '',
    type: 'image',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        height: '100px',
    },
    props: {
        src: 'https://picsum.photos/seed/1/200/100',
        alt: 'Placeholder image',
        'data-ai-hint': 'placeholder',
    }
};
