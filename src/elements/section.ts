import type { CanvasElementData, EditorProperties } from "@/lib/schemas";

const editorProperties: EditorProperties = [
    { groupName: "Layout", properties: [
         { key: 'layout.display', label: 'Display', inputType: 'select', target: 'styles', options: { selectOptions: [{label: 'Block', value: 'block'},{label: 'Flex', value: 'flex'}]} },
         { key: 'layout.width', label: 'Width', inputType: 'text', target: 'styles' },
         { key: 'layout.height', label: 'Height', inputType: 'text', target: 'styles' },
    ]},
    { groupName: "Flexbox", showIf: { key: 'layout.display', value: 'flex' }, properties: [
        { key: 'flexbox.flexDirection', label: 'Direction', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Row', value: 'row'}, {label: 'Column', value: 'column'}, {label: 'Row Reverse', value: 'row-reverse'}, {label: 'Column Reverse', value: 'column-reverse'}
        ]}},
        { key: 'flexbox.justifyContent', label: 'Justify Content', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Flex Start', value: 'flex-start'}, {label: 'Flex End', value: 'flex-end'}, {label: 'Center', value: 'center'}, {label: 'Space Between', value: 'space-between'}, {label: 'Space Around', value: 'space-around'}, {label: 'Space Evenly', value: 'space-evenly'}
        ]}},
        { key: 'flexbox.alignItems', label: 'Align Items', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'Stretch', value: 'stretch'}, {label: 'Flex Start', value: 'flex-start'}, {label: 'Flex End', value: 'flex-end'}, {label: 'Center', value: 'center'}, {label: 'Baseline', value: 'baseline'}
        ]}},
        { key: 'flexbox.flexWrap', label: 'Wrap', inputType: 'select', target: 'styles', options: { selectOptions: [
            {label: 'No Wrap', value: 'nowrap'}, {label: 'Wrap', value: 'wrap'}, {label: 'Wrap Reverse', value: 'wrap-reverse'}
        ]}},
    ]},
    { groupName: "Spacing", properties: [
        { key: 'spacing.padding', label: 'Padding', inputType: 'text', target: 'styles', placeholder: '10px' },
    ]},
    { groupName: "Background", properties: [
        { key: 'background.backgroundColor', label: 'Background Color', inputType: 'color', target: 'styles' },
        { key: 'background.backgroundImage', label: 'Background Image', inputType: 'text', target: 'styles', placeholder: 'url(...)'},
        { key: 'background.backgroundRepeat', label: 'Background Repeat', inputType: 'select', target: 'styles', options: { selectOptions: [
            { label: 'No Repeat', value: 'no-repeat' }, { label: 'Repeat', value: 'repeat' }, { label: 'Repeat X', value: 'repeat-x' }, { label: 'Repeat Y', value: 'repeat-y' }
        ]}},
    ]},
    { groupName: "Borders", properties: [
        { key: 'borders.border', label: 'Border', inputType: 'text', target: 'styles', placeholder: '1px dashed #ccc' },
    ]},
];

export const section: CanvasElementData = {
    id: '',
    type: 'section',
    children: [],
    properties: {
        'spacing.padding': '10px',
        'layout.display': 'block',
        'layout.minHeight': '100px',
        'borders.border': '1px dashed hsl(var(--border))',
        'flexbox.flexDirection': 'row',
        'flexbox.justifyContent': 'flex-start',
        'flexbox.alignItems': 'stretch',
        'flexbox.flexWrap': 'nowrap',
    },
    editorProperties
};
