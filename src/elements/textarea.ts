
import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Textarea Attributes",
        properties: [
            { key: "value", label: "Value", inputType: 'textarea', target: 'props' },
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


export const textarea: CanvasElementData = {
    id: '',
    type: 'textarea',
    styles: {
        padding: '10px',
        display: 'block',
        height: '80px',
        width: '200px',
    },
    props: {
        placeholder: 'Enter more text...',
    },
    editorProperties
};
