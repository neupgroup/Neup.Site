import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Content",
        properties: [
            { key: "content", label: "Text", inputType: 'text', target: 'content' }
        ]
    },
    {
        groupName: "Link",
        properties: [
            { key: "href", label: "URL (href)", inputType: 'text', target: 'props' }
        ]
    },
    {
        groupName: "Typography",
        properties: [
            { key: "color", label: "Color", inputType: 'color', target: 'styles' },
            { key: "fontSize", label: "Font Size", inputType: 'text', target: 'styles' },
            { key: "textDecoration", label: "Text Decoration", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'None', value: 'none'}, {label: 'Underline', value: 'underline'}]} }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' },
            { key: "margin", label: "Margin", inputType: 'text', target: 'styles' }
        ]
    },
];

export const link: CanvasElementData = {
    id: '',
    type: 'link',
    content: 'Link',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        textDecoration: 'underline',
    },
    props: {
        href: '#',
    },
    editorProperties
};
