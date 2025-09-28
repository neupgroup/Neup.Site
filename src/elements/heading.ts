
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
            { key: "fontSize", label: "Font Size", inputType: 'text', target: 'styles' },
            { key: "fontWeight", label: "Font Weight", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Normal', value: 'normal'}, {label: 'Bold', value: 'bold'}]} },
            { key: "textAlign", label: "Text Align", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]} }
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
