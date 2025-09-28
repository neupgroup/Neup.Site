import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content", properties: [{ key: 'content.text', label: 'Text', inputType: 'text', target: 'content'}] },
    { groupName: "Typography", properties: [
        { key: 'typography.color', label: 'Color', inputType: 'color', target: 'styles' },
        { key: 'typography.fontSize', label: 'Font Size', inputType: 'text', target: 'styles', placeholder: '16px' },
        { key: 'typography.textAlign', label: 'Text Align', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}
        ]}},
    ]},
    { groupName: "Spacing", properties: [{ key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px'}] },
];

export const text: CanvasElementData = {
    id: '',
    type: 'text',
    properties: {
        'content.text': 'New Text',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.fontSize': '16px',
        'typography.textAlign': 'left',
    },
    editorProperties
};
