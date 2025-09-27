import type { CanvasElementData } from "@/lib/schemas";

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    props: {}
};
