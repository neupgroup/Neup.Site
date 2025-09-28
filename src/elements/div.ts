import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Layout" },
    { groupName: "Flexbox" },
    { groupName: "Spacing" },
    { groupName: "Background" },
    { groupName: "Borders" },
];

export const div: CanvasElementData = {
    id: '',
    type: 'div',
    children: [],
    styles: {
        padding: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
    },
    props: {},
    editorProperties
};
