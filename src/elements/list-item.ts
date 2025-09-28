import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content" },
    { groupName: "Typography" },
    { groupName: "Spacing" },
];


export const listItem: CanvasElementData = {
    id: '',
    type: 'list-item',
    content: 'List Item',
    styles: {
        padding: '10px',
        display: 'block',
    },
    props: {},
    editorProperties
};
