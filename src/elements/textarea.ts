import type { CanvasElementData } from "@/lib/schemas";

export const textarea: CanvasElementData = {
    id: '',
    type: 'textarea',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        height: '80px',
        width: '200px',
    },
    props: {
        placeholder: 'Enter more text...',
    }
};
