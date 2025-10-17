"use client";
import { useState, useRef, useEffect, FC } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Strikethrough, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EditableTextProps {
    id: string;
    initialValue: string;
    onSave: (id: string, value: string) => void;
    onTagChange?: (id: string, tag: string) => void;
    currentTag?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const EditableText: FC<EditableTextProps> = ({ id, initialValue, onSave, onTagChange, currentTag, className, style }) => {
    const [isEditing, setIsEditing] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Set initial content only when the initialValue prop changes
    useEffect(() => {
        if (editorRef.current && initialValue !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = initialValue;
        }
    }, [initialValue]);

    const handleFocus = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editorRef.current) {
            onSave(id, editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleToolbarInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent the editor from losing focus when a button is clicked.
        e.preventDefault();
    };

    const handleTagSelect = (tag: string) => {
        if (onTagChange) {
            onTagChange(id, tag);
        }
    }

    const tagOptions = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];


    return (
        <div className="relative">
            {isEditing && (
                 <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 flex items-center gap-1 bg-background p-1 rounded-md border shadow-md"
                    onMouseDown={handleToolbarInteraction} // Added onMouseDown here
                >
                     {onTagChange && currentTag && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" className="h-7 w-auto px-2 text-xs font-bold">
                                    {currentTag.toUpperCase()}
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onMouseDown={handleToolbarInteraction}> {/* Added onMouseDown here */}
                                {tagOptions.map(tag => (
                                    <DropdownMenuItem key={tag} onSelect={() => handleTagSelect(tag)}>
                                        {tag.toUpperCase()}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                     )}
                     <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => execCommand('bold')}>
                         <Bold className="h-4 w-4" />
                     </Button>
                     <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => execCommand('italic')}>
                         <Italic className="h-4 w-4" />
                     </Button>
                     <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => execCommand('strikeThrough')}>
                         <Strikethrough className="h-4 w-4" />
                     </Button>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7">
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" onMouseDown={handleToolbarInteraction}>
                            <div className="grid gap-2">
                                <Input
                                    id={`link-url-${id}`}
                                    placeholder="https://example.com"
                                    className="h-9"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            execCommand('createLink', (e.target as HTMLInputElement).value);
                                        }
                                    }}
                                />
                            </div>
                        </PopoverContent>
                     </Popover>
                 </div>
            )}
            <div 
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(
                    "w-full whitespace-pre-wrap outline-none",
                    "focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-sm",
                    className
                )} 
                style={style}
                dangerouslySetInnerHTML={{ __html: initialValue || ' ' }}
            />
        </div>
    );
};