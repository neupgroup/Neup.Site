import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Layout",
        properties: [
            { key: "width", label: "Max Width", inputType: 'text', target: 'styles' },
            { key: "margin", label: "Margin", inputType: 'text', target: 'styles', placeholder: "e.g. auto" }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Background",
        properties: [
            { key: "backgroundColor", label: "Background Color", inputType: 'color', target: 'styles' }
        ]
    },
    {
        groupName: "Borders",
        properties: [
            { key: "border", label: "Border", inputType: 'text', target: 'styles' },
            { key: "borderRadius", label: "Border Radius", inputType: 'text', target: 'styles' }
        ]
    },
];

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    props: {},
    editorProperties
};
