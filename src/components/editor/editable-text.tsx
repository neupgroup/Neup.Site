'use client';
import { useState, useRef, useEffect, FC } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
    id: string;
    initialValue: string;
    onSave: (id: string, value: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const EditableText: FC<EditableTextProps> = ({ id, initialValue, onSave, className, style }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (isEditing) {
            autoResizeTextarea();
            textareaRef.current?.focus();
        }
    }, [isEditing, value]);
    
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);


    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onSave(id, value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
        }
    };

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn("bg-transparent border-0 outline-none w-full resize-none overflow-hidden", className)}
                style={style}
                rows={1}
            />
        );
    }

    return (
        <div 
            onDoubleClick={handleDoubleClick} 
            className={cn("w-full whitespace-pre-wrap", className)} 
            style={style}
            dangerouslySetInnerHTML={{ __html: value || ' ' }}
        />
    );
};
