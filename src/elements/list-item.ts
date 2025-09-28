
import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Content",
        properties: [
            { key: "content", label: "Text", inputType: 'text', target: 'content' }
        ]
    },
    {
        groupName: "Typography",
        properties: [
            { key: "color", label: "Color", inputType: 'color', target: 'styles' },
            { key: "fontSize", label: "Font Size", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' },
            { key: "margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
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
