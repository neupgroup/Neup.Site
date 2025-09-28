import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Video",
        properties: [
            { key: "src", label: "Source URL", inputType: 'text', target: 'props' }
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
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' }
        ]
    }
];

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        display: 'block',
        width: '320px',
        height: '240px',
    },
    props: {
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    editorProperties
};
