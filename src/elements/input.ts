import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Input Attributes",
        properties: [
            { key: "input.type", label: "Type", inputType: 'select', target: 'props', options: { selectOptions: [{label: 'Text', value: 'text'}, {label: 'Email', value: 'email'}, {label: 'Password', value: 'password'}]} },
            { key: "input.value", label: "Value", inputType: 'text', target: 'props' },
            { key: "input.placeholder", label: "Placeholder", inputType: 'text', target: 'props' }
        ]
    },
    {
        groupName: "Layout",
        properties: [
            { key: "layout.width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "layout.height", label: "Height", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "spacing.padding", label: "Padding", inputType: 'text', target: 'styles' },
            { key: "spacing.margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
];

export const input: CanvasElementData = {
    id: '',
    type: 'input',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.height': '40px',
        'layout.width': '200px',
        'input.placeholder': 'Enter text...',
        'input.type': 'text'
    },
    editorProperties
};
