import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content", properties: [
        { key: 'content.text', label: 'Text', inputType: 'text', target: 'content'},
    ]},
    { groupName: "Heading", properties: [
        { key: 'heading.level', label: 'Level', inputType: 'select', target: 'props', options: { selectOptions: [
            {label: 'H1', value: '1'}, {label: 'H2', value: '2'}, {label: 'H3', value: '3'}, {label: 'H4', value: '4'}, {label: 'H5', value: '5'}, {label: 'H6', value: '6'}
        ]} },
    ]},
    { groupName: "Typography", properties: [
        { key: 'typography.color', label: 'Color', inputType: 'color', target: 'styles' },
        { key: 'typography.fontSize', label: 'Font Size', inputType: 'text', target: 'styles', placeholder: '24px' },
        { key: 'typography.fontWeight', label: 'Font Weight', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Normal', value: 'normal'}, {label: 'Bold', value: 'bold'}
        ]}},
        { key: 'typography.textAlign', label: 'Text Align', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}
        ]}},
    ]},
    { groupName: "Spacing", properties: [
        { key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px' },
    ]},
];

export const heading: CanvasElementData = {
    id: '',
    type: 'heading',
    properties: {
        'content.text': 'New Heading',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.fontSize': '24px',
        'typography.fontWeight': 'bold',
        'typography.textAlign': 'left',
        'heading.level': 1,
    },
    editorProperties
};
