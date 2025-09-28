import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Video",
        properties: [
            { key: "video.src", label: "Source URL", inputType: 'text', target: 'props' }
        ]
    },
    {
        groupName: "Layout",
        properties: [
            { key: "layout.width", label: "Width", inputType: 'text', target: 'styles' },
            { key: "layout.height", label: "Height", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "spacing.padding", label: "Padding", inputType: 'text', target: 'styles' }
        ]
    }
];

export const video: CanvasElementData = {
    id: '',
    type: 'video',
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.width': '320px',
        'layout.height': '240px',
        'video.src': 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    editorProperties
};
