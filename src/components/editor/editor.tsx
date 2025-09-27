'use client';
import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EditorHeader from '@/components/editor/header';
import LeftSidebar from '@/components/editor/left-sidebar';
import RightSidebar from '@/components/editor/right-sidebar';
import Canvas from '@/components/editor/canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { logErrorToFirestore } from '@/actions/logging';
import { saveSite, createSite } from '@/actions/editor/site';
import { useToast } from '@/hooks/use-toast';
import type { Template, CanvasElementData } from '@/lib/schemas';

interface EditorProps {
    initialElements: CanvasElementData[];
    siteId?: string;
}

const Editor: FC<EditorProps> = ({ initialElements, siteId: initialSiteId }) => {
  const [siteId, setSiteId] = useState(initialSiteId);
  const router = useRouter();
  const [history, setHistory] = useState<CanvasElementData[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const elements = history[historyIndex];
  const { toast } = useToast();

  const setElements = (updater: (prev: CanvasElementData[]) => CanvasElementData[], recordHistory = true) => {
    try {
      const newElements = updater(history[historyIndex]);
      if (recordHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        const newHistory = [...history];
        newHistory[historyIndex] = newElements;
        setHistory(newHistory);
      }
    } catch(e: any) {
        console.error("Error updating elements:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
        throw e; // Re-throw to be caught by a higher-level boundary if needed
    }
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

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
    try {
        setElements(prevElements => {
        let draggedElement: CanvasElementData | undefined;
        // Deep clone to avoid mutation
        const clonedElements = JSON.parse(JSON.stringify(prevElements)) as CanvasElementData[];

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

        const newElements = removeElement(clonedElements, draggedId);

        if (!draggedElement) return prevElements;

        const addElementToParent = (els: CanvasElementData[], pId: string, element: CanvasElementData): boolean => {
            for (let i = 0; i < els.length; i++) {
            if (els[i].id === pId && els[i].children) {
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
            return newElements;
            }
        } else {
            return insertElement(newElements, dropZoneId, draggedElement);
        }
        return newElements;
        });
    } catch (e: any) {
        console.error("Error moving element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  };

  const addElement = (elementType: CanvasElementData['type'], dropZoneId?: string, parentId?: string) => {
    try {
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
        } else if (elementType === 'heading') {
            newElement.content = 'New Heading';
            newElement.props = { level: 1 };
            newElement.styles.fontSize = '24px';
            newElement.styles.fontWeight = 'bold';
            newElement.styles.textAlign = 'left';
        } else if (elementType === 'button') {
            newElement.content = 'New Button';
        } else if (elementType === 'image') {
            const placeholder = PlaceHolderImages.find(p => p.id === 'feature-2');
            newElement.props = {
                src: placeholder?.imageUrl,
                alt: placeholder?.description,
                'data-ai-hint': placeholder?.imageHint,
            };
            newElement.styles.height = '100px';
        } else if (elementType === 'section' || elementType === 'div' || elementType === 'container' || elementType === 'form' || elementType === 'list' || elementType === 'list-item') {
            newElement.children = [];
            newElement.styles.minHeight = '100px';
            newElement.styles.border = '1px dashed hsl(var(--border))';
            if (elementType === 'container') {
                newElement.styles.maxWidth = '1100px';
                newElement.styles.marginLeft = 'auto';
                newElement.styles.marginRight = 'auto';
            }
            if (elementType === 'list-item') {
              newElement.content = "List Item";
              newElement.styles.minHeight = 'auto';
            }
        } else if (elementType === 'input') {
            newElement.props = { placeholder: 'Enter text...' };
            newElement.styles.height = '40px';
            newElement.styles.width = '200px';
        } else if (elementType === 'link') {
            newElement.content = 'Link';
            newElement.props = { href: '#' };
            newElement.styles.textDecoration = 'underline';
        } else if (elementType === 'video') {
            newElement.props = { src: 'https://www.w3schools.com/html/mov_bbb.mp4' };
            newElement.styles.width = '320px';
            newElement.styles.height = '240px';
        } else if (elementType === 'textarea') {
            newElement.props = { placeholder: 'Enter more text...' };
            newElement.styles.height = '80px';
            newElement.styles.width = '200px';
        } else if (elementType === 'label') {
            newElement.content = 'Label';
        } else if (elementType === 'html') {
            newElement.htmlContent = '<div>Generated HTML</div>';
            newElement.styles.minHeight = '50px';
        }
        
        setElements(prev => {
            // Deep clone to avoid mutation
            const clonedPrev = JSON.parse(JSON.stringify(prev));

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
                return addRecursively(clonedPrev);
            }

            if (dropZoneId) {
                const dropIndex = clonedPrev.findIndex(el => el.id === dropZoneId);
                if (dropIndex !== -1) {
                    const newElements = [...clonedPrev];
                    newElements.splice(dropIndex, 0, newElement);
                    return newElements;
                }
            }
            return [...clonedPrev, newElement];
        });
    } catch (e: any) {
        console.error("Error adding element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  };

  const addGeneratedElement = (element: CanvasElementData, dropZoneId?: string, parentId?: string) => {
    try {
        const deepCopyAndNewIds = (el: CanvasElementData): CanvasElementData => {
            const newEl = {
                ...el,
                id: `${el.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            };
            if (el.children) {
                newEl.children = el.children.map(deepCopyAndNewIds);
            }
            return newEl;
        };

        const newElement = deepCopyAndNewIds(element);

        setElements(prev => {
            const clonedPrev = JSON.parse(JSON.stringify(prev));

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
                return addRecursively(clonedPrev);
            }

            if (dropZoneId) {
                const dropIndex = clonedPrev.findIndex(el => el.id === dropZoneId);
                if (dropIndex !== -1) {
                    const newElements = [...clonedPrev];
                    newElements.splice(dropIndex, 0, newElement);
                    return newElements;
                }
            }
            return [...clonedPrev, newElement];
        });
    } catch (e: any) {
        console.error("Error adding generated element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  };

  const updateElement = (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string, newCustomCss?: string, newClassName?: string, newHtmlContent?: string, recordHistory = true) => {
    try {
        setElements(prev => {
        // Deep clone to avoid mutation
        const clonedPrev = JSON.parse(JSON.stringify(prev));
        const updateRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
            return els.map(el => {
            if (el.id === id) {
                const updatedElement: CanvasElementData = {
                  ...el,
                  styles: newStyles !== undefined ? newStyles : el.styles,
                  props: newProps !== undefined ? newProps : el.props,
                };
                if (newContent !== undefined) {
                  updatedElement.content = newContent;
                }
                if (newCustomCss !== undefined) {
                    updatedElement.customCss = newCustomCss;
                }
                if (newClassName !== undefined) {
                    updatedElement.className = newClassName;
                }
                if (newHtmlContent !== undefined) {
                    updatedElement.htmlContent = newHtmlContent;
                }
                return updatedElement;
            }
            if (el.children) {
                return { ...el, children: updateRecursively(el.children) };
            }
            return el;
            });
        };
        return updateRecursively(clonedPrev);
        }, recordHistory);
    } catch (e: any) {
        console.error("Error updating element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  };

  const updateElementId = (oldId: string, newId: string) => {
    if (!newId || oldId === newId) return;
    
    // Check for uniqueness
    if (findElementRecursive(elements, newId)) {
        toast({
            variant: 'destructive',
            title: 'ID already exists',
            description: 'Please choose a unique ID for the element.',
        });
        return;
    }

    try {
      setElements(prev => {
        const clonedPrev = JSON.parse(JSON.stringify(prev));
        const updateIdRecursive = (els: CanvasElementData[]): CanvasElementData[] => {
            return els.map(el => {
            if (el.id === oldId) {
                return { ...el, id: newId };
            }
            if (el.children) {
                return { ...el, children: updateIdRecursive(el.children) };
            }
            return el;
            });
        };
        return updateIdRecursive(clonedPrev);
      });
      setSelectedElement(newId);
    } catch (e: any) {
        console.error("Error updating element ID:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  };
  
  const deleteElement = useCallback((id: string) => {
    try {
        setElements(prev => {
        // Deep clone to avoid mutation
        const clonedPrev = JSON.parse(JSON.stringify(prev));
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
        return deleteRecursively(clonedPrev);
        });
        setSelectedElement(null);
    } catch (e: any) {
        console.error("Error deleting element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  }, [setElements]);

  const copyElement = useCallback(() => {
    try {
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
    } catch (e: any) {
        console.error("Error copying element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  }, [selectedElement, elements]);

  const pasteElement = useCallback(() => {
    try {
        if (!clipboard) return;
        setElements(prev => {
            // Deep clone to avoid mutation
            const clonedPrev = JSON.parse(JSON.stringify(prev));
            const newClipboard = { ...clipboard, id: `${clipboard.type}-${Date.now()}` };

            if (!selectedElement) {
                // Paste at the root level
                return [...clonedPrev, newClipboard];
            }

            const result = findElementRecursive(clonedPrev, selectedElement);
            if (!result) return [...clonedPrev, newClipboard];

            const { element: selectedEl, parent } = result;

            if (selectedEl && ['section', 'div', 'container', 'form', 'list'].includes(selectedEl.type)) {
                // Paste inside container as last element
                const addInside = (els: CanvasElementData[]): CanvasElementData[] => {
                    return els.map(el => {
                        if (el.id === selectedEl.id) {
                            return { ...el, children: [...(el.children || []), newClipboard] };
                        }
                        if (el.children) {
                            return { ...el, children: addInside(el.children) };
                        }
                        return el;
                    });
                };
                return addInside(clonedPrev);
            } else {
                // Paste after selected element
                const addSibling = (els: CanvasElementData[], targetId: string, parentId?: string): CanvasElementData[] => {
                    if (parentId) {
                        for (let i = 0; i < els.length; i++) {
                            if (els[i].id === parentId && els[i].children) {
                                const targetIdx = els[i].children!.findIndex(c => c.id === targetId);
                                if (targetIdx !== -1) {
                                    els[i].children!.splice(targetIdx + 1, 0, newClipboard);
                                }
                                return els;
                            }
                            if (els[i].children) {
                            addSibling(els[i].children, targetId, parentId);
                            }
                        }
                    } else { // root level
                        const rootIndex = els.findIndex(c => c.id === targetId);
                        if (rootIndex !== -1) {
                        els.splice(rootIndex + 1, 0, newClipboard);
                        }
                    }
                    return els;
                };

                return addSibling(clonedPrev, selectedEl.id, parent?.id);
            }
        });
    } catch (e: any) {
        console.error("Error pasting element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  }, [clipboard, selectedElement, setElements]);

  const cutElement = useCallback(() => {
    try {
        if (!selectedElement) return;
        copyElement();
        deleteElement(selectedElement);
    } catch (e: any) {
        console.error("Error cutting element:", e);
        logErrorToFirestore({ message: e.message, stack: e.stack });
    }
  }, [selectedElement, copyElement, deleteElement]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        try {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedElement) {
                    e.preventDefault();
                    deleteElement(selectedElement);
                }
            } else if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
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
                    case 'z':
                        e.preventDefault();
                        undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        redo();
                        break;
                }
            }
        } catch (error) {
            console.error("Error during keydown event:", error);
            logErrorToFirestore({ message: (error as Error).message, stack: (error as Error).stack });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, deleteElement, copyElement, cutElement, pasteElement, undo, redo]);

  const handlePublish = async () => {
    try {
        let currentSiteId = siteId;
        if (!currentSiteId) {
            const createResult = await createSite();
            if (createResult.success && createResult.id) {
                currentSiteId = createResult.id;
                setSiteId(currentSiteId);
                 // Update the URL to reflect the new ID for editing mode
                router.push(`/site/editor?mode=edit&id=${currentSiteId}`, { scroll: false });
            } else {
                throw new Error(createResult.error || 'Failed to create a new site entry.');
            }
        }

        const result = await saveSite(currentSiteId, elements);
        if (result.success) {
            toast({
                title: 'Site Published!',
                description: 'Your website has been saved successfully.',
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        console.error("Error publishing site:", error);
        toast({
            variant: 'destructive',
            title: 'Publishing Failed',
            description: error.message || 'An unknown error occurred while publishing.',
        });
        logErrorToFirestore({ message: error.message, stack: error.stack });
    }
  };


  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader 
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onViewCode={() => {}}
        onPublish={handlePublish}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            moveElement={moveElement}
            addGeneratedElement={addGeneratedElement}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <Canvas 
            elements={elements} 
            selectedElement={selectedElement} 
            onSelectElement={setSelectedElement}
            updateElement={updateElement}
            moveElement={moveElement}
            addElement={addElement}
            addGeneratedElement={addGeneratedElement}
            />
        </main>
        <RightSidebar 
            selectedElementId={selectedElement} 
            elements={elements}
            updateElement={updateElement}
            deleteElement={deleteElement}
            updateElementId={updateElementId}
        />
      </div>
    </div>
  );
};

export default Editor;
