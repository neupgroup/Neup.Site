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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);


    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onSave(id, value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn("bg-transparent border-0 outline-none w-full", className)}
                style={style}
            />
        );
    }

    return (
        <div onDoubleClick={handleDoubleClick} className={cn("w-full", className)} style={style}>
            {value}
        </div>
    );
};
