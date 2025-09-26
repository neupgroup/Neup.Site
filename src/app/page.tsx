'use client';
import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
        id: 'main-section',
        type: 'section',
        styles: {
            paddingTop: '20px',
            paddingBottom: '20px',
            paddingLeft: '20px',
            paddingRight: '20px',
            minHeight: '100px',
            backgroundColor: 'white'
        },
        children: [
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
    }
];


const WebsiteBuilderPage: FC = () => {
  const [elements, setElements] = useState<CanvasElementData[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasElementData | null>(null);

  const findElementRecursive = (elements: CanvasElementData[], id: string): {element: CanvasElementData, parent?: CanvasElementData} | null => {
      for (const el of elements) {
          if (el.id === id) {
              return {element: el};
          }
          if (el.children) {
              const found = findElementRecursive(el.children, id);
              if (found) {
                  return {element: found.element, parent: found.parent || el};
              }
          }
      }
      return null;
  }

  const moveElement = (draggedId: string, dropZoneId: string, parentId?: string) => {
    let draggedElement: CanvasElementData | undefined;

    const removeElement = (els: CanvasElementData[], id: string): CanvasElementData[] => {
      return els.reduce((acc, el) => {
        if (el.id === id) {
          draggedElement = el;
          return acc;
        }
        if (el.children) {
          el.children = removeElement(el.children, id);
        }
        acc.push(el);
        return acc;
      }, [] as CanvasElementData[]);
    };

    const newElements = removeElement([...elements], draggedId);

    if (!draggedElement) return;

    const addElementToParent = (els: CanvasElementData[], pId: string, element: CanvasElementData): boolean => {
      for (let i = 0; i < els.length; i++) {
        if (els[i].id === pId && els[i].children) {
          // Find drop zone and insert
          const dropIndex = els[i].children!.findIndex(child => child.id === dropZoneId);
          if (dropIndex !== -1) {
            els[i].children!.splice(dropIndex, 0, element);
          } else {
             els[i].children!.push(element);
          }
          return true;
        }
        if (els[i].children && addElementToParent(els[i].children, pId, element)) {
          return true;
        }
      }
      return false;
    }
    
    const insertElement = (els: CanvasElementData[], dZoneId: string, element: CanvasElementData): CanvasElementData[] => {
        const dropIndex = els.findIndex(el => el.id === dZoneId);
        if (dropIndex !== -1) {
            const newEls = [...els];
            newEls.splice(dropIndex, 0, element);
            return newEls;
        }

        return els.map(el => {
            if (el.children) {
                return { ...el, children: insertElement(el.children, dZoneId, element) };
            }
            return el;
        });
    };

    if (parentId) {
      if(addElementToParent(newElements, parentId, draggedElement)) {
        setElements(newElements);
      }
    } else {
      setElements(insertElement(newElements, dropZoneId, draggedElement));
    }
  };

  const addElement = (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string) => {
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
        const addRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
            return els.map(el => {
                if (el.id === parentId && el.children) {
                    const dropIndex = dropZoneId ? el.children.findIndex(child => child.id === dropZoneId) : -1;
                    const newChildren = [...el.children];
                    if (dropIndex !== -1) {
                        newChildren.splice(dropIndex, 0, newElement);
                    } else {
                        newChildren.push(newElement);
                    }
                    return { ...el, children: newChildren };
                } else if (el.children) {
                    return { ...el, children: addRecursively(el.children) };
                }
                return el;
            });
        };

        if (parentId) {
            return addRecursively(prev);
        }

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
    const updateRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
      return els.map(el => {
        if (el.id === id) {
          const updatedElement = {
            ...el,
            styles: newStyles !== undefined ? newStyles : el.styles,
            props: newProps !== undefined ? newProps : el.props,
          };
          if (newContent !== undefined) {
            updatedElement.content = newContent;
          }
          return updatedElement;
        }
        if (el.children) {
          return { ...el, children: updateRecursively(el.children) };
        }
        return el;
      });
    };
    setElements(prev => updateRecursively(prev));
  };
  
  const deleteElement = useCallback((id: string) => {
    const deleteRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
        return els.filter(el => {
            if (el.id === id) {
                return false;
            }
            if (el.children) {
                el.children = deleteRecursively(el.children);
            }
            return true;
        });
    };
    setElements(prev => deleteRecursively(prev));
    setSelectedElement(null);
  }, []);

  const copyElement = useCallback(() => {
    if (!selectedElement) return;
    const result = findElementRecursive(elements, selectedElement);
    if (result) {
        // Deep copy and generate new IDs
        const deepCopy = (el: CanvasElementData): CanvasElementData => {
            const newEl = {
                ...el,
                id: `${el.type}-${Date.now()}-${Math.random()}`
            };
            if (el.children) {
                newEl.children = el.children.map(deepCopy);
            }
            return newEl;
        };
        setClipboard(deepCopy(result.element));
    }
  }, [selectedElement, elements]);

  const pasteElement = useCallback(() => {
    if (!clipboard) return;

    const pasteRecursively = (els: CanvasElementData[], targetId: string, parentEl?: CanvasElementData): CanvasElementData[] => {
        const targetIndex = els.findIndex(el => el.id === targetId);

        if (targetIndex !== -1) {
            const newElements = [...els];
            newElements.splice(targetIndex + 1, 0, clipboard);
            return newElements;
        }

        return els.map(el => {
            if (el.children) {
                return { ...el, children: pasteRecursively(el.children, targetId, el) };
            }
            return el;
        });
    };

    setElements(prev => {
        if (!selectedElement) {
            // Paste at the root level
            return [...prev, clipboard];
        }

        const result = findElementRecursive(prev, selectedElement);
        if (!result) return [...prev, clipboard];

        const { element: selectedEl, parent } = result;

        if (selectedEl && ['section', 'div', 'container'].includes(selectedEl.type)) {
            // Paste inside container as last element
            const newElements = [...prev];
            const addInside = (els: CanvasElementData[]) => {
                return els.map(el => {
                    if (el.id === selectedEl.id) {
                        return { ...el, children: [...(el.children || []), clipboard] };
                    }
                    if (el.children) {
                        return { ...el, children: addInside(el.children) };
                    }
                    return el;
                });
            };
            return addInside(newElements);
        } else {
            // Paste after selected element
            const parentChildren = parent ? parent.children || [] : prev;
            const targetIndex = parentChildren.findIndex(el => el.id === selectedEl.id);

            const addSibling = (els: CanvasElementData[]) => {
                 for (let i = 0; i < els.length; i++) {
                    if (els[i].id === (parent?.id || '')) {
                        const targetIdx = els[i].children!.findIndex(c => c.id === selectedEl.id);
                        els[i].children!.splice(targetIdx + 1, 0, clipboard);
                        return prev;
                    }
                    if (els[i].children) {
                        addSibling(els[i].children!);
                    }
                }
                // Handle root elements
                if(!parent) {
                    const rootIndex = els.findIndex(c => c.id === selectedEl.id);
                    if (rootIndex !== -1) {
                       els.splice(rootIndex + 1, 0, clipboard);
                    }
                }
                return prev;
            };

            const newEls = [...prev];
            addSibling(newEls);
            return newEls;
        }
    });

  }, [clipboard, selectedElement, elements]);

  const cutElement = useCallback(() => {
    if (!selectedElement) return;
    copyElement();
    deleteElement(selectedElement);
  }, [selectedElement, copyElement, deleteElement]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedElement) {
                e.preventDefault();
                deleteElement(selectedElement);
            }
        } else if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'c':
                    e.preventDefault();
                    copyElement();
                    break;
                case 'x':
                     e.preventDefault();
                    cutElement();
                    break;
                case 'v':
                     e.preventDefault();
                    pasteElement();
                    break;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, deleteElement, copyElement, cutElement, pasteElement]);


  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            moveElement={moveElement}
        />
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
            deleteElement={deleteElement}
        />
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;
