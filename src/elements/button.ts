import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Content",
        properties: [
            { key: "content", label: "Text", inputType: 'text', target: 'content' }
        ]
    },
    {
        groupName: "Layout",
        properties: [
            { key: "display", label: "Display", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Inline Block', value: 'inline-block'}, {label: 'Block', value: 'block'}] } },
            { key: "width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' }
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
    {
        groupName: "Custom CSS",
        properties: [
            { key: "customCss", label: "Custom CSS", inputType: 'textarea', target: 'customCss' }
        ]
    }
];


export const button: CanvasElementData = {
    id: '',
    type: 'button',
    content: 'New Button',
    styles: {
        display: 'inline-block',
        padding: '10px 20px',
        fontSize: '16px',
        color: 'hsl(var(--primary-foreground))',
        backgroundColor: 'hsl(var(--primary))',
        textAlign: 'center',
        borderRadius: 'var(--radius)',
        border: 'none',
        cursor: 'pointer',
    },
    props: {},
    editorProperties
};
