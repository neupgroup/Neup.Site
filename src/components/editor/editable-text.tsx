'use client';
import { useState, useRef, useEffect, FC } from 'react';

interface EditableTextProps {
    id: string;
    initialValue: string;
    onSave: (id: string, value: string) => void;
}

export const EditableText: FC<EditableTextProps> = ({ id, initialValue, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

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
                className="bg-transparent border-0 outline-none w-full"
            />
        );
    }

    return (
        <div onDoubleClick={handleDoubleClick} className="w-full">
            {value}
        </div>
    );
};
