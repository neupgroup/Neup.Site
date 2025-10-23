
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, onChange, ...props}, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
      if (internalRef.current) {
        internalRef.current.style.height = 'auto';
        // Add a small buffer (e.g., 4px) to show there's more space
        internalRef.current.style.height = `${internalRef.current.scrollHeight + 4}px`;
      }
      if (onChange) {
        onChange(event);
      }
    };
    
    React.useEffect(() => {
        if(internalRef.current) {
            internalRef.current.style.height = 'auto';
            internalRef.current.style.height = `${internalRef.current.scrollHeight + 4}px`;
        }
    }, [props.value])


    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground placeholder:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden',
          className
        )}
        ref={internalRef}
        onInput={handleInput}
        rows={1}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
