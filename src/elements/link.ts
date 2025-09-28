import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content" },
    { groupName: "Link" },
    { groupName: "Typography" },
    { groupName: "Spacing" },
];

export const link: CanvasElementData = {
    id: '',
    type: 'link',
    content: 'Link',
    styles: {
        padding: '10px',
        display: 'block',
        textDecoration: 'underline',
    },
    props: {
        href: '#',
    },
    editorProperties
};
