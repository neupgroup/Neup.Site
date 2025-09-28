import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Image" },
    { groupName: "Layout" },
    { groupName: "Spacing" },
    { groupName: "Borders" },
];


export const image: CanvasElementData = {
    id: '',
    type: 'image',
    styles: {
        padding: '10px',
        display: 'block',
        height: '100px',
    },
    props: {
        src: 'https://picsum.photos/seed/1/200/100',
        alt: 'Placeholder image',
        'data-ai-hint': 'placeholder',
    },
    editorProperties
};
