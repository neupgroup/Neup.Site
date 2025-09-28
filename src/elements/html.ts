import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "HTML",
        properties: [
            { key: "htmlContent", label: "HTML Content", inputType: 'textarea', target: 'htmlContent', options: { rows: 10 } }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' },
            { key: "margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Custom CSS",
        properties: [
            { key: "customCss", label: "Custom CSS", inputType: 'textarea', target: 'customCss' }
        ]
    }
];

export const html: CanvasElementData = {
    id: '',
    type: 'html',
    htmlContent: '<div>Generated HTML</div>',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '50px',
    },
    props: {},
    editorProperties
};
