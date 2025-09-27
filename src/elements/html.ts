import type { CanvasElementData } from "@/lib/schemas";

export const html: CanvasElementData = {
    id: '',
    type: 'html',
    htmlContent: '<div>Generated HTML</div>',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '50px',
    },
    props: {}
};
