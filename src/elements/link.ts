import type { CanvasElementData } from "@/lib/schemas";

export const link: CanvasElementData = {
    id: '',
    type: 'link',
    content: 'Link',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        textDecoration: 'underline',
    },
    props: {
        href: '#',
    }
};
