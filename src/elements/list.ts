import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Spacing" },
    { groupName: "Background" },
    { groupName: "Borders" },
];


export const list: CanvasElementData = {
    id: '',
    type: 'list',
    children: [],
    styles: {
        padding: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
    },
    props: {},
    editorProperties
};
