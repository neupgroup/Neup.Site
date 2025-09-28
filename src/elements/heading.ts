import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content" },
    { groupName: "Typography" },
    { groupName: "Spacing" },
];

export const heading: CanvasElementData = {
    id: '',
    type: 'heading',
    content: 'New Heading',
    styles: {
        padding: '10px',
        display: 'block',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'left',
    },
    props: {
        level: 1,
    },
    editorProperties
};
