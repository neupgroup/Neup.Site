'use client';
import type { FC } from 'react';
import { useState } from 'react';
import EditorHeader from '@/components/editor/header';
import LeftSidebar from '@/components/editor/left-sidebar';
import RightSidebar from '@/components/editor/right-sidebar';
import Canvas from '@/components/editor/canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface CanvasElementData {
  id: string;
  type: 'text' | 'image' | 'button' | 'hero' | 'hero-subtitle' | 'hero-cta' | 'feature-image' | 'section' | 'div' | 'container' | 'input';
  content?: string;
  styles: React.CSSProperties;
  props?: Record<string, any>;
  children?: CanvasElementData[];
}

const initialElements: CanvasElementData[] = [
    {
        id: "hero",
        type: 'hero',
        content: "Build Your Website Visually",
        styles: {
            paddingTop: '48px',
            paddingRight: '20px',
            paddingLeft: '20px',
            paddingBottom: '20px',
            textAlign: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            display: 'block',
        }
    },
    {
        id: "hero-subtitle",
        type: 'hero-subtitle',
        content: "Create stunning, professional websites with our intuitive drag-and-drop editor. No code required.",
        styles: {
            paddingTop: '0px',
            paddingRight: '48px',
            paddingBottom: '0px',
            paddingLeft: '48px',
            marginTop: '-32px',
            textAlign: 'center',
            fontSize: '18px',
            color: 'hsl(var(--muted-foreground))',
            display: 'block',
        }
    },
    {
        id: "hero-cta",
        type: "hero-cta",
        content: "Get Started Now",
        styles: {
            marginTop: '32px',
            textAlign: 'center',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingBottom: '48px',
            paddingLeft: '0px',
            display: 'block',
        }
    },
    {
        id: "feature-image",
        type: 'feature-image',
        props: {
            src: PlaceHolderImages.find(p => p.id === 'feature-1')?.imageUrl,
            alt: PlaceHolderImages.find(p => p.id === 'feature-1')?.description,
            'data-ai-hint': PlaceHolderImages.find(p => p.id === 'feature-1')?.imageHint
        },
        styles: {
            width: '100%',
            display: 'block',
        }
    }
]


const WebsiteBuilderPage: FC = () => {
  const [elements, setElements] = useState<CanvasElementData[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const moveElement = (draggedId: string, dropZoneId: string) => {
    const draggedIndex = elements.findIndex(el => el.id === draggedId);
    const dropIndex = elements.findIndex(el => el.id === dropZoneId);
    
    if (draggedIndex === -1 || dropIndex === -1 || draggedIndex === dropIndex) {
      return;
    }

    setElements(prev => {
        const newElements = [...prev];
        const [draggedElement] = newElements.splice(draggedIndex, 1);
        
        const newDropIndex = newElements.findIndex(el => el.id === dropZoneId);
        newElements.splice(newDropIndex, 0, draggedElement);
        return newElements;
    });
  };

  const addElement = (elementType: CanvasElementData['type'], dropZoneId?: string) => {
    const newElement: CanvasElementData = {
        id: `${elementType}-${Date.now()}`,
        type: elementType,
        styles: {
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            display: 'block',
        }
    }

    if (elementType === 'text') {
        newElement.content = 'New Text';
        newElement.styles.fontSize = '16px';
        newElement.styles.textAlign = 'left';
        newElement.styles.height = '40px';
    } else if (elementType === 'button') {
        newElement.content = 'New Button';
        newElement.styles.height = '40px';
    } else if (elementType === 'image') {
        const placeholder = PlaceHolderImages.find(p => p.id === 'feature-2');
        newElement.props = {
            src: placeholder?.imageUrl,
            alt: placeholder?.description,
            'data-ai-hint': placeholder?.imageHint,
        };
        newElement.styles.height = '100px';
    } else if (elementType === 'section' || elementType === 'div' || elementType === 'container') {
      newElement.children = [];
      newElement.styles.minHeight = '100px';
      newElement.styles.border = '1px dashed hsl(var(--border))';
      if (elementType === 'container') {
        newElement.styles.maxWidth = '1100px';
        newElement.styles.marginLeft = 'auto';
        newElement.styles.marginRight = 'auto';
      }
    } else if (elementType === 'input') {
      newElement.props = { placeholder: 'Enter text...' };
      newElement.styles.height = '40px';
      newElement.styles.width = '200px';
    }
    
    setElements(prev => {
        if (dropZoneId) {
            const dropIndex = prev.findIndex(el => el.id === dropZoneId);
            if (dropIndex !== -1) {
                const newElements = [...prev];
                newElements.splice(dropIndex, 0, newElement);
                return newElements;
            }
        }
        return [...prev, newElement];
    });
  };

  const updateElement = (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string) => {
    setElements(prev => prev.map(el => {
        if (el.id === id) {
            const updatedElement = {
                ...el, 
                styles: newStyles !== undefined ? newStyles : el.styles,
                props: newProps !== undefined ? newProps : el.props
            };
            if (newContent !== undefined) {
                updatedElement.content = newContent;
            }
            return updatedElement;
        }
        return el;
    }));
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Canvas 
            elements={elements} 
            selectedElement={selectedElement} 
            onSelectElement={setSelectedElement}
            updateElement={updateElement}
            moveElement={moveElement}
            addElement={addElement}
            />
        </main>
        <RightSidebar 
            selectedElementId={selectedElement} 
            elements={elements}
            updateElement={updateElement}
        />
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;
