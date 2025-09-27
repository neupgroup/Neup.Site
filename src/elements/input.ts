import type { CanvasElementData } from "@/lib/schemas";

export const input: CanvasElementData = {
    id: '',
    type: 'input',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        height: '40px',
        width: '200px',
    },
    props: {
        placeholder: 'Enter text...',
    }
};
