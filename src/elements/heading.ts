import type { CanvasElementData } from "@/lib/schemas";

export const heading: CanvasElementData = {
    id: '',
    type: 'heading',
    content: 'New Heading',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'left',
    },
    props: {
        level: 1,
    }
};
