import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Layout", properties: [
        { key: 'layout.display', label: 'Display', inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Block', value: 'block'}, {label: 'Flex', value: 'flex'}]} },
        { key: 'layout.maxWidth', label: 'Max Width', inputType: 'text', target: 'styles', placeholder: '1100px'},
    ]},
    { groupName: "Spacing", properties: [
        { key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px'},
        { key: 'spacing.marginLeft', label: 'Margin Left', inputType: 'text', target: 'styles', placeholder: 'auto'},
        { key: 'spacing.marginRight', label: 'Margin Right', inputType: 'text', target: 'styles', placeholder: 'auto'},
    ]},
    { groupName: "Background", properties: [
        { key: 'background.backgroundColor', label: 'Background Color', inputType: 'color', target: 'styles' },
    ]},
    { groupName: "Borders", properties: [
        { key: 'borders.border', label: 'Border', inputType: 'text', target: 'styles', placeholder: '1px dashed #ccc' },
    ]},
];

export const container: CanvasElementData = {
    id: '',
    type: 'container',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
        'layout.maxWidth': '1100px',
        'spacing.marginLeft': 'auto',
        'spacing.marginRight': 'auto',
    },
    editorProperties
};
