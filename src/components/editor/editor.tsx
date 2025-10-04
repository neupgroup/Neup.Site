'use client';
import type { FC } from 'react';
import { useState, useEffect, useCallback, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import EditorHeader from '@/components/editor/header';
import LeftSidebar from '@/components/editor/left-sidebar';
import RightSidebar from '@/components/editor/right-sidebar';
import Canvas from '@/components/editor/canvas';
import { logErrorToFirestore } from '@/actions/logging';
import { savePage, createPage } from '@/actions/editor/pages';
import { useToast } from '@/hooks/use-toast';
import type { CanvasElementData } from '@/schemas/canvas';
import { elementDefinitions } from '@/elements';
import { temp_element } from '@/elements/html';

interface EditorProps {
    initialElements: CanvasElementData[];
    pageId?: string;
}

const Editor: FC<EditorProps> = ({ initialElements, pageId: initialPageId }) => {
  const [pageId, setPageId] = useState(initialPageId);
  const router = useRouter();
  const [history, setHistory] = useState<CanvasElementData[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const elements = history[historyIndex];
  const { toast } = useToast();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

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

  const handleUpdateAllElements = (newElements: CanvasElementData[], recordHistory = true) => {
    setElements(() => newElements, recordHistory);
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

  const handleDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({id, type: 'canvas-element'}));
    setDraggedId(id);
    console.log('Drag state started.');
  };

  const removeElementRecursive = (els: CanvasElementData[], id: string): [CanvasElementData[], CanvasElementData | null] => {
    let foundElement: CanvasElementData | null = null;
    const newEls = els.reduce((acc, el) => {
        if (el.id === id) {
            foundElement = el;
            return acc;
        }
        if (el.children) {
            const [updatedChildren, childFound] = removeElementRecursive(el.children, id);
            if (childFound) {
                foundElement = childFound;
            }
            el.children = updatedChildren;
        }
        acc.push(el);
        return acc;
    }, [] as CanvasElementData[]);
    return [newEls, foundElement];
  };

  const handleDragOver = (e: DragEvent, targetParentId?: string | null, targetElementId?: string | null) => {
      e.preventDefault();
      e.stopPropagation();

      setElements(prev => {
          let [cleanedElements] = removeElementRecursive(prev, 'temp_element');
          
          if (targetElementId === 'temp_element') return cleanedElements;

          const insertPlaceholder = (els: CanvasElementData[]): CanvasElementData[] => {
              if (targetParentId) {
                  return els.map(el => {
                      if (el.id === targetParentId) {
                          const newChildren = el.children ? [...el.children] : [];
                          const dropIndex = targetElementId ? newChildren.findIndex(c => c.id === targetElementId) : newChildren.length;
                          newChildren.splice(dropIndex, 0, temp_element);
                          return {...el, children: newChildren};
                      }
                      if (el.children) {
                          return {...el, children: insertPlaceholder(el.children)};
                      }
                      return el;
                  });
              } else {
                  const dropIndex = targetElementId ? els.findIndex(c => c.id === targetElementId) : els.length;
                  const newEls = [...els];
                  newEls.splice(dropIndex, 0, temp_element);
                  return newEls;
              }
          };
          return insertPlaceholder(cleanedElements);
      }, false);
  };
  
  const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
       // Only remove if leaving the canvas entirely
      const canvas = (e.currentTarget as HTMLElement).closest('.h-screen.w-full');
      if (canvas && !canvas.contains(e.relatedTarget as Node)) {
          setElements(prev => removeElementRecursive(prev, 'temp_element')[0], false);
          console.log('Drag state exited.');
      }
  }

  const handleDrop = (e: DragEvent, parentId?: string, dropZoneId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Drag state exited.');

      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      setElements(prev => {
          const [elementsWithoutPlaceholder] = removeElementRecursive(prev, 'temp_element');
          let [elementsWithoutDragged, draggedElement] = removeElementRecursive(elementsWithoutPlaceholder, data.id);

          if (!draggedElement) {
              // It's a new element from the sidebar
              const definition = elementDefinitions[data.elementType as CanvasElementData['type']];
              draggedElement = {
                  ...JSON.parse(JSON.stringify(definition)),
                  id: `${data.elementType}-${Date.now()}`,
                  properties: definition.properties || {},
              };
          }

          if (!draggedElement) return elementsWithoutPlaceholder;

          const insertElement = (els: CanvasElementData[]): CanvasElementData[] => {
              if (parentId) {
                  return els.map(el => {
                      if (el.id === parentId) {
                          const newChildren = el.children ? [...el.children] : [];
                          const dropIndex = dropZoneId ? newChildren.findIndex(c => c.id === dropZoneId) : newChildren.length;
                          newChildren.splice(dropIndex, 0, draggedElement!);
                          return {...el, children: newChildren};
                      }
                      if (el.children) {
                          return {...el, children: insertElement(el.children)};
                      }
                      return el;
                  });
              } else {
                  const newEls = [...els];
                  const dropIndex = dropZoneId ? newEls.findIndex(c => c.id === dropZoneId) : newEls.length;
                  newEls.splice(dropIndex, 0, draggedElement!);
                  return newEls;
              }
          }
          return insertElement(elementsWithoutDragged);
      });

      setDraggedId(null);
  };


  const moveElement = (draggedId: string, dropZoneId: string | null, parentId?: string) => {
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
                const dropIndex = dropZoneId ? els[i].children!.findIndex(child => child.id === dropZoneId) : -1;
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
        } else if (dropZoneId) {
            return insertElement(newElements, dropZoneId, draggedElement);
        } else {
          // If no drop zone, add to the end of the root
          newElements.push(draggedElement);
          return newElements;
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
        const definition = elementDefinitions[elementType];
        if (!definition) {
            console.error(`No definition for element type: ${elementType}`);
            return;
        }

        const newElement: CanvasElementData = {
            ...JSON.parse(JSON.stringify(definition)),
            id: `${elementType}-${Date.now()}`,
            properties: definition.properties || {},
        };
        
        setElements(prev => {
            const clonedPrev = JSON.parse(JSON.stringify(prev));

            // Auto-wrap in section if dropped at root and is not a section
            if (!parentId && elementType !== 'section') {
                const sectionDef = elementDefinitions['section'];
                const newSection: CanvasElementData = {
                    ...JSON.parse(JSON.stringify(sectionDef)),
                    id: `section-${Date.now()}`,
                    properties: sectionDef.properties || {},
                    children: [newElement],
                };

                if (dropZoneId) {
                    const dropIndex = clonedPrev.findIndex((el: CanvasElementData) => el.id === dropZoneId);
                    if (dropIndex !== -1) {
                        clonedPrev.splice(dropIndex, 0, newSection);
                        return clonedPrev;
                    }
                }
                return [...clonedPrev, newSection];
            }

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
                const dropIndex = clonedPrev.findIndex((el: CanvasElementData) => el.id === dropZoneId);
                if (dropIndex !== -1) {
                    clonedPrev.splice(dropIndex, 0, newElement);
                    return clonedPrev;
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

            // Auto-wrap in section if dropped at root and is not a section
            if (!parentId && newElement.type !== 'section') {
                const sectionDef = elementDefinitions['section'];
                const newSection: CanvasElementData = {
                    ...JSON.parse(JSON.stringify(sectionDef)),
                    id: `section-${Date.now()}`,
                    properties: sectionDef.properties || {},
                    children: [newElement],
                };

                if (dropZoneId) {
                    const dropIndex = clonedPrev.findIndex((el: CanvasElementData) => el.id === dropZoneId);
                    if (dropIndex !== -1) {
                        clonedPrev.splice(dropIndex, 0, newSection);
                        return clonedPrev;
                    }
                }
                return [...clonedPrev, newSection];
            }


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
                const dropIndex = clonedPrev.findIndex((el: CanvasElementData) => el.id === dropZoneId);
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

  const updateElement = (id: string, newProperties: Record<string, any>, recordHistory = true) => {
    try {
        setElements(prev => {
            // Deep clone to avoid mutation
            const clonedPrev = JSON.parse(JSON.stringify(prev));
            const updateRecursively = (els: CanvasElementData[]): CanvasElementData[] => {
                return els.map(el => {
                if (el.id === id) {
                    const updatedElement: CanvasElementData = {
                      ...el,
                      properties: newProperties,
                    };
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
        setElements(prev => removeElementRecursive(prev, id)[0]);
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

  const handleSaveFlow = async () => {
    let currentPageId = pageId;
    if (!currentPageId) {
        const createResult = await createPage();
        if (createResult.success && createResult.id) {
            currentPageId = createResult.id;
            setPageId(currentPageId);
             // Update the URL to reflect the new ID for editing mode
            router.push(`/site/editor/dragger?id=${currentPageId}`, { scroll: false });
        } else {
            throw new Error(createResult.error || 'Failed to create a new page entry.');
        }
    }

    const result = await savePage(currentPageId, { elements });
    if (!result.success) {
        throw new Error(result.error);
    }
    return currentPageId;
  }

  const handlePublish = async () => {
    setIsSaving(true);
    try {
        await handleSaveFlow();
        toast({
            title: 'Page Saved!',
            description: 'Your page has been saved successfully.',
        });
    } catch (error: any) {
        console.error("Error saving page:", error);
        toast({
            variant: 'destructive',
            title: 'Saving Failed',
            description: error.message || 'An unknown error occurred while saving.',
        });
        logErrorToFirestore({ message: error.message, stack: error.stack });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const savedPageId = await handleSaveFlow();
      if (savedPageId) {
        window.open(`/preview/${savedPageId}`, '_blank');
      }
    } catch (error: any) {
      console.error("Error saving for preview:", error);
      toast({
        variant: 'destructive',
        title: 'Preview Failed',
        description: `Could not save the page for previewing. ${error.message}`,
      });
      logErrorToFirestore({ message: error.message, stack: error.stack });
    } finally {
      setIsPreviewing(false);
    }
  };


  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground" onDragLeave={handleDragLeave}>
      <EditorHeader 
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onViewCode={() => {}}
        onPublish={handlePublish}
        onPreview={handlePreview}
        isSaving={isSaving}
        isPreviewing={isPreviewing}
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
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedId={draggedId}
            />
        </main>
        <RightSidebar 
            selectedElementId={selectedElement} 
            elements={elements}
            updateElement={updateElement}
            deleteElement={deleteElement}
            updateElementId={updateElementId}
            onUpdateAllElements={handleUpdateAllElements}
            pageId={pageId}
        />
      </div>
    </div>
  );
};

export default Editor;
