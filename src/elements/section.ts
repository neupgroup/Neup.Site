
import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Layout",
        properties: [
            { key: "display", label: "Display", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Block', value: 'block'}, {label: 'Flex', value: 'flex'}]} },
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

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    styles: {
        padding: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
    },
    props: {},
    editorProperties
};
