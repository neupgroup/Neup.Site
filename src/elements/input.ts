import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Input Attributes",
        properties: [
            { key: "type", label: "Type", inputType: 'select', target: 'props', options: { selectOptions: [{label: 'Text', value: 'text'}, {label: 'Email', value: 'email'}, {label: 'Password', value: 'password'}]} },
            { key: "value", label: "Value", inputType: 'text', target: 'props' },
            { key: "placeholder", label: "Placeholder", inputType: 'text', target: 'props' }
        ]
    },
    {
        groupName: "Layout",
        properties: [
            { key: "width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "height", label: "Height", inputType: 'text', target: 'styles' }
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

export const input: CanvasElementData = {
    id: '',
    type: 'input',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        height: '40px',
        width: '200px',
    },
    props: {
        placeholder: 'Enter text...',
    },
    editorProperties
};
