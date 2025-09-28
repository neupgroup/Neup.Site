import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Layout" },
    { groupName: "Spacing" },
    { groupName: "Background" },
    { groupName: "Borders" },
];

export const form: CanvasElementData = {
    id: '',
    type: 'form',
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
