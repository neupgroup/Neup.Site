import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Content",
        properties: [
            { key: "content.text", label: "Text", inputType: 'text', target: 'content' }
        ]
    },
    {
        groupName: "Typography",
        properties: [
            { key: "typography.color", label: "Color", inputType: 'color', target: 'styles' },
            { key: "typography.fontSize", label: "Font Size", inputType: 'text', target: 'styles' }
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

export const label: CanvasElementData = {
    id: '',
    type: 'label',
    properties: {
        'content.text': 'Label',
        'spacing.padding': '10px',
        'layout.display': 'block',
    },
    editorProperties
};
