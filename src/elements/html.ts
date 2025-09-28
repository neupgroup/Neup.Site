import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "HTML",
        properties: [
            { key: "html.htmlContent", label: "HTML Content", inputType: 'textarea', target: 'htmlContent', options: { rows: 10 } }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "spacing.padding", label: "Padding", inputType: 'text', target: 'styles' },
            { key: "spacing.margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Custom CSS",
        properties: [
            { key: "customCss.css", label: "Custom CSS", inputType: 'textarea', target: 'customCss' }
        ]
    }
];

export const html: CanvasElementData = {
    id: '',
    type: 'html',
    properties: {
        'html.htmlContent': '<div>Generated HTML</div>',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '50px',
    },
    editorProperties
};
