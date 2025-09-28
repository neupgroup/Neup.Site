import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    {
        groupName: "Layout",
        properties: [
            { key: "display", label: "Display", inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Block', value: 'block'}, {label: 'Flex', value: 'flex'}]} },
        ]
    },
    {
        groupName: 'Flexbox',
        properties: [
            { 
                key: "flexDirection", 
                label: "Direction", 
                inputType: 'select', 
                target: 'styles', 
                options: { selectOptions: [
                    {label: 'Row', value: 'row'}, 
                    {label: 'Column', value: 'column'},
                    {label: 'Row Reverse', value: 'row-reverse'},
                    {label: 'Column Reverse', value: 'column-reverse'},
                ]},
                showIf: { key: 'display', value: 'flex' }
            },
            {
                key: "justifyContent",
                label: "Justify Content",
                inputType: 'select',
                target: 'styles',
                options: { selectOptions: [
                    {label: 'Flex Start', value: 'flex-start'},
                    {label: 'Flex End', value: 'flex-end'},
                    {label: 'Center', value: 'center'},
                    {label: 'Space Between', value: 'space-between'},
                    {label: 'Space Around', value: 'space-around'},
                    {label: 'Space Evenly', value: 'space-evenly'},
                ]},
                showIf: { key: 'display', value: 'flex' }
            },
            {
                key: "alignItems",
                label: "Align Items",
                inputType: 'select',
                target: 'styles',
                options: { selectOptions: [
                    {label: 'Stretch', value: 'stretch'},
                    {label: 'Flex Start', value: 'flex-start'},
                    {label: 'Flex End', value: 'flex-end'},
                    {label: 'Center', value: 'center'},
                    {label: 'Baseline', value: 'baseline'},
                ]},
                showIf: { key: 'display', value: 'flex' }
            },
            {
                key: 'flexWrap',
                label: 'Wrap',
                inputType: 'select',
                target: 'styles',
                options: { selectOptions: [
                    {label: 'No Wrap', value: 'nowrap'},
                    {label: 'Wrap', value: 'wrap'},
                    {label: 'Wrap Reverse', value: 'wrap-reverse'},
                ]},
                showIf: { key: 'display', value: 'flex' }
            }
        ]
    },
    {
        groupName: "Spacing",
        properties: [
            { key: "padding", label: "Padding", inputType: 'text', target: 'styles' }
        ]
    },
    {
        groupName: "Background",
        properties: [
            { key: "backgroundColor", label: "Background Color", inputType: 'color', target: 'styles' }
        ]
    },
    {
        groupName: "Borders",
        properties: [
            { key: "border", label: "Border", inputType: 'text', target: 'styles' },
            { key: "borderRadius", label: "Border Radius", inputType: 'text', target: 'styles' }
        ]
    },
];

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    styles: {
        padding: '10px',
        display: 'block',
        minHeight: '100px',
        border: '1px dashed hsl(var(--border))',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
    },
    props: {},
    editorProperties
};
