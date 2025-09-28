import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Content",
        properties: [
            { key: "content", label: "Text", inputType: 'textarea', target: 'content' }
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

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    content: 'New Text',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        fontSize: '16px',
        textAlign: 'left',
    },
    props: {},
    editorProperties
};
