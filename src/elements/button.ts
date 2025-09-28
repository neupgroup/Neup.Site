import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content" },
    { groupName: "Layout" },
    { groupName: "Spacing" },
    { groupName: "Typography" },
    { groupName: "Background" },
    { groupName: "Borders" },
];


export const button: CanvasElementData = {
    id: '',
    type: 'button',
    content: 'New Button',
    styles: {
        display: 'inline-block',
        padding: '10px 20px',
        fontSize: '16px',
        color: 'hsl(var(--primary-foreground))',
        backgroundColor: 'hsl(var(--primary))',
        textAlign: 'center',
        borderRadius: 'var(--radius)',
        border: 'none',
        cursor: 'pointer',
    },
    props: {},
    editorProperties
};
