
"use client"

import React, { useCallback, useRef, type RefAttributes, useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Strikethrough,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Input } from './input'

type EditorProps = {
  onChange: (value: string) => void
  value: string
  name: string
  onBlur: () => void
  disabled?: boolean
  ref: React.Ref<HTMLDivElement>
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  disabled,
}: Omit<EditorProps, 'ref' | 'name'>) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);


  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleLink = () => {
    const url = prompt('Enter the URL')
    if (url) {
      execCommand('createLink', url)
    }
  }

  return (
    <div className="rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="p-2 border-b">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => execCommand('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => execCommand('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => execCommand('strikeThrough')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => execCommand('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => execCommand('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
                <Button type="button" size="icon" variant="ghost">
                    <LinkIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Add Link</h4>
                        <p className="text-sm text-muted-foreground">
                        Enter the URL to create a link.
                        </p>
                    </div>
                     <div className="grid gap-2">
                        <Input
                            id="link-url"
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
                </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={onBlur}
        className="min-h-[15rem] p-4 text-sm"
      />
    </div>
  )
}
