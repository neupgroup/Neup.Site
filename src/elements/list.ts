import type { CanvasElementData } from "@/lib/schemas";

export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
    },
    props: {}
};
