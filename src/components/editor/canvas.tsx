import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CanvasElementData } from '@/app/page';
import { EditableText } from './editable-text';

interface CanvasProps {
  elements: CanvasElementData[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string) => void;
}

const CanvasElementWrapper: FC<{
  id: string;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ id, selectedElement, onSelectElement, children, className, style }) => {
  const isSelected = selectedElement === id;
  return (
    <div
      style={style}
      className={cn(
        'relative cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-primary/50',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement(id);
      }}
    >
      {children}
    </div>
  );
};


const Canvas: FC<CanvasProps> = ({ elements, selectedElement, onSelectElement, updateElement }) => {
  
    const handleSaveText = (id: string, newContent: string) => {
        updateElement(id, undefined, undefined, newContent);
    }
    
    const renderElement = (element: CanvasElementData) => {
        const { id, type, content, styles, props } = element;
        const wrapperProps = {
            id,
            selectedElement,
            onSelectElement,
            style: styles,
            key: id
        };

        switch (type) {
            case 'hero':
                return (
                    <CanvasElementWrapper {...wrapperProps} className="text-center">
                        <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, fontWeight: styles.fontWeight}} className="font-headline tracking-tight" />
                    </CanvasElementWrapper>
                )
            case 'hero-subtitle':
                return (
                     <CanvasElementWrapper {...wrapperProps} className="text-center">
                        <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize}} className="mx-auto max-w-2xl text-muted-foreground"/>
                    </CanvasElementWrapper>
                )
            case 'hero-cta':
                 return (
                     <CanvasElementWrapper {...wrapperProps} className="text-center">
                        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">{content}</Button>
                    </CanvasElementWrapper>
                )
            case 'feature-image':
                return (
                    <CanvasElementWrapper {...wrapperProps}>
                       {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 1200} height={props.height || 600} className="aspect-[2/1] w-full object-cover" {...props} />}
                    </CanvasElementWrapper>
                )
            case 'text':
                return (
                    <CanvasElementWrapper {...wrapperProps}>
                        <EditableText id={id} initialValue={content || ''} onSave={handleSaveText} style={{fontSize: styles.fontSize, textAlign: styles.textAlign}} />
                    </CanvasElementWrapper>
                );
            case 'button':
                return (
                    <CanvasElementWrapper {...wrapperProps}>
                        <Button>{content}</Button>
                    </CanvasElementWrapper>
                );
            case 'image':
                 return (
                    <CanvasElementWrapper {...wrapperProps}>
                        {props?.src && <Image src={props.src} alt={props.alt || ''} width={props.width || 200} height={props.height || 100} {...props} />}
                    </CanvasElementWrapper>
                 );
            default:
                return null;
        }
    }
  
  return (
    <div className="mx-auto h-full w-full max-w-screen-xl p-4 md:p-8" onClick={() => onSelectElement(null)}>
      <div className="rounded-lg bg-card shadow-lg">
        {elements.map(renderElement)}
      </div>
    </div>
  );
};

export default Canvas;
