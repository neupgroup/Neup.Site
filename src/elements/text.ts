import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content" },
    { groupName: "Typography" },
    { groupName: "Spacing" },
];

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    content: 'New Text',
    styles: {
        padding: '10px',
        display: 'block',
        fontSize: '16px',
        textAlign: 'left',
    },
    props: {},
    editorProperties
};
