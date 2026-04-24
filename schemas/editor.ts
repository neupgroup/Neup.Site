
export type EditorProperty = {
    key: string;
    label: string;
    inputType: 'text' | 'select' | 'color' | 'textarea';
    target: 'styles' | 'props' | 'content' | 'htmlContent' | 'customCss' | 'className';
    options?: {
        selectOptions?: { label: string, value: string }[];
        rows?: number;
    };
    placeholder?: string;
    suggestions?: string[];
    showIf?: {
        key: string;
        value: any;
    }
}

export type EditorPropertyGroup = {
    groupName: string;
    properties?: EditorProperty[];
}

export type EditorProperties = string[];
