import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content", properties: [{ key: 'content.text', label: 'Text', inputType: 'text', target: 'content'}] },
    { groupName: "Typography", properties: [{ key: 'typography.color', label: 'Color', inputType: 'color', target: 'styles' }] },
    { groupName: "Spacing", properties: [{ key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px'}] },
];


export const listItem: CanvasElementData = {
    id: '',
    type: 'list-item',
    properties: {
        'content.text': 'List Item',
        'spacing.padding': '10px',
        'layout.display': 'block',
    },
    editorProperties
};
