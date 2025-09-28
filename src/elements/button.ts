import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content", properties: [
        { key: 'content.text', label: 'Text', inputType: 'text', target: 'content'},
    ]},
    { groupName: "Layout", properties: [
        { key: 'layout.display', label: 'Display', inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Inline Block', value: 'inline-block'},{label: 'Block', value: 'block'}]} },
    ]},
    { groupName: "Spacing", properties: [
        { key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px 20px' },
    ]},
    { groupName: "Typography", properties: [
         { key: 'typography.color', label: 'Color', inputType: 'color', target: 'styles' },
         { key: 'typography.fontSize', label: 'Font Size', inputType: 'text', target: 'styles', placeholder: '16px' },
         { key: 'typography.textAlign', label: 'Text Align', inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]} },
    ]},
    { groupName: "Background", properties: [
        { key: 'background.backgroundColor', label: 'Background Color', inputType: 'color', target: 'styles' },
    ]},
    { groupName: "Borders", properties: [
        { key: 'borders.borderRadius', label: 'Border Radius', inputType: 'text', target: 'styles', placeholder: '8px' },
        { key: 'borders.border', label: 'Border', inputType: 'text', target: 'styles', placeholder: '1px solid #000' },
    ]},
];


export const button: CanvasElementData = {
    id: '',
    type: 'button',
    properties: {
        'content.text': 'New Button',
        'layout.display': 'inline-block',
        'spacing.padding': '10px 20px',
        'typography.fontSize': '16px',
        'typography.color': 'hsl(var(--primary-foreground))',
        'background.backgroundColor': 'hsl(var(--primary))',
        'typography.textAlign': 'center',
        'borders.borderRadius': 'var(--radius)',
        'borders.border': 'none',
        // Non-style prop
        'attributes.cursor': 'pointer',
    },
    editorProperties
};
