import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Layout",
        properties: [
            { key: "display", label: "Display", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Block', value: 'block'}, {label: 'Flex', value: 'flex'}, {label: 'Grid', value: 'grid'}]} },
            { key: "width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "height", label: "Height", inputType: 'text', target: 'styles' },
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

export const div: CanvasElementData = {
    id: '',
    type: 'div',
    children: [],
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
    },
    props: {},
    editorProperties
};
