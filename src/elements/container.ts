import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Layout" },
    { groupName: "Spacing" },
    { groupName: "Background" },
    { groupName: "Borders" },
];

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    styles: {
        padding: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    props: {},
    editorProperties
};
