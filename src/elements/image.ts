import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Image",
        properties: [
            { key: "src", label: "Source URL", inputType: 'text', target: 'props' },
            { key: "alt", label: "Alt Text", inputType: 'text', target: 'props' }
        ]
    },
    {
        groupName: "Layout",
        properties: [
            { key: "width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "height", label: "Height", inputType: 'text', target: 'styles' }
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
        groupName: "Borders",
        properties: [
            { key: "borderRadius", label: "Border Radius", inputType: 'text', target: 'styles' }
        ]
    }
];


export const image: CanvasElementData = {
    id: '',
    type: 'image',
    styles: {
        padding: '10px',
        display: 'block',
        height: '100px',
    },
    props: {
        src: 'https://picsum.photos/seed/1/200/100',
        alt: 'Placeholder image',
        'data-ai-hint': 'placeholder',
    },
    editorProperties
};
