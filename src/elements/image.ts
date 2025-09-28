import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Image", properties: [
        { key: 'image.src', label: 'Source URL', inputType: 'text', target: 'props', placeholder: 'https://...' },
        { key: 'image.alt', label: 'Alt Text', inputType: 'text', target: 'props', placeholder: 'Descriptive text' },
    ]},
    { groupName: "Layout", properties: [
        { key: 'layout.width', label: 'Width', inputType: 'text', target: 'styles' },
        { key: 'layout.height', label: 'Height', inputType: 'text', target: 'styles' },
    ]},
    { groupName: "Spacing", properties: [
        { key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px' },
    ]},
    { groupName: "Borders", properties: [
        { key: 'borders.borderRadius', label: 'Border Radius', inputType: 'text', target: 'styles' },
    ]},
];


export const image: CanvasElementData = {
    id: '',
    type: 'image',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.height': '100px',
        'image.src': 'https://picsum.photos/seed/1/200/100',
        'image.alt': 'Placeholder image',
        'image.data-ai-hint': 'placeholder',
    },
    editorProperties
};
