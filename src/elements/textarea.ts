import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Textarea Attributes",
        properties: [
            { key: "textarea.value", label: "Value", inputType: 'textarea', target: 'props' },
            { key: "textarea.placeholder", label: "Placeholder", inputType: 'text', target: 'props' }
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


export const textarea: CanvasElementData = {
    id: '',
    type: 'textarea',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.height': '80px',
        'layout.width': '200px',
        'textarea.placeholder': 'Enter more text...',
    },
    editorProperties
};
