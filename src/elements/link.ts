import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Content", properties: [{ key: 'content.text', label: 'Text', inputType: 'text', target: 'content'}] },
    { groupName: "Link", properties: [{ key: 'link.href', label: 'URL', inputType: 'text', target: 'props', placeholder: '#'}] },
    { groupName: "Typography", properties: [
        { key: 'typography.color', label: 'Color', inputType: 'color', target: 'styles' },
        { key: 'typography.textDecoration', label: 'Text Decoration', inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'None', value: 'none'}, {label: 'Underline', value: 'underline'}]} }
    ]},
    { groupName: "Spacing", properties: [{ key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px'}] },
];

export const link: CanvasElementData = {
    id: '',
    type: 'link',
    properties: {
        'content.text': 'Link',
        'spacing.padding': '10px',
        'layout.display': 'block',
        'typography.textDecoration': 'underline',
        'link.href': '#',
    },
    editorProperties
};
