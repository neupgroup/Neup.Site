import { FC, useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Blend, AlignCenter, ArrowLeftRight, StretchHorizontal, Trash2, Brush, Settings, Code, Save, Square as SquareIcon } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { saveTemplate } from '@/actions/editor/templates';


interface SaveTemplateDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    element: CanvasElementData;
}

const SaveTemplateDialog: FC<SaveTemplateDialogProps> = ({ isOpen, onOpenChange, element }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'section' | 'page' | 'element'>('element');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (element) {
            setName(element.id);
            setType(element.type === 'section' ? 'section' : 'element');
        }
    }, [element]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Name is required' });
            return;
        }
        setIsSaving(true);
        const templateData = {
            name,
            description,
            type,
            elements: [element]
        };
        const result = await saveTemplate(templateData);
        if (result.success) {
            toast({ title: 'Template Saved!', description: `Template "${name}" has been saved.` });
            onOpenChange(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save as Template</DialogTitle>
                    <DialogDescription>Save the selected element and its children as a reusable template.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template-description">Description (Optional)</Label>
                        <Textarea id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={(value: any) => setType(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="section">Section</SelectItem>
                            <SelectItem value="page">Page</SelectItem>
                            <SelectItem value="element">Element</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface RightSidebarProps {
  selectedElementId: string | null;
  elements: CanvasElementData[];
  updateElement: (id: string, newStyles?: React.CSSProperties, newProps?: Record<string, any>, newContent?: string, newCustomCss?: string, newClassName?: string, newHtmlContent?: string, recordHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  updateElementId: (oldId: string, newId: string) => void;
}

const RightSidebar: FC<RightSidebarProps> = ({ selectedElementId, elements, updateElement, deleteElement, updateElementId }) => {
  
  const findElementRecursive = (id: string, els: CanvasElementData[]): CanvasElementData | undefined => {
    for (const el of els) {
      if (el.id === id) {
        return el;
      }
      if (el.children) {
        const found = findElementRecursive(id, el.children);
        if (found) {
          return found;
        }
      }
    }
  };
  
  const selectedElement = selectedElementId ? findElementRecursive(selectedElementId, elements) : undefined;

  const [styles, setStyles] = useState<React.CSSProperties>({});
  const [props, setProps] = useState<Record<string, any>>({});
  const [content, setContent] = useState<string | undefined>(undefined);
  const [htmlContent, setHtmlContent] = useState<string | undefined>(undefined);
  const [customCss, setCustomCss] = useState<string | undefined>(undefined);
  const [className, setClassName] = useState<string | undefined>(undefined);
  const [elementId, setElementId] = useState<string | undefined>(undefined);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const isTyping = useRef(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (selectedElement) {
        setStyles(selectedElement.styles);
        setProps(selectedElement.props || {});
        setContent(selectedElement.content);
        setHtmlContent(selectedElement.htmlContent);
        setCustomCss(selectedElement.customCss);
        setClassName(selectedElement.className);
        setElementId(selectedElement.id);
    }
  }, [selectedElement]);

  const handleStyleChange = (property: keyof React.CSSProperties, value: string) => {
      const newStyles = {...styles, [property]: value};
      setStyles(newStyles);
      
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      isTyping.current = true;
      if (selectedElementId) {
          updateElement(selectedElementId, newStyles, undefined, undefined, undefined, undefined, undefined, false);
      }
      typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
          if (selectedElementId) {
              updateElement(selectedElementId, newStyles);
          }
      }, 500);
  }

  const handlePropChange = (property: string, value: any) => {
    const newProps = {...props, [property]: value};
    setProps(newProps);
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, newProps);
    }
  }
  
  const handleContentChange = (value: string) => {
    setContent(value);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = true;
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, undefined, value, undefined, undefined, undefined, false);
    }
     typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
          if (selectedElementId) {
            updateElement(selectedElementId, undefined, undefined, value);
          }
      }, 500);
  }

  const handleHtmlContentChange = (value: string) => {
    setHtmlContent(value);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = true;
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, undefined, undefined, undefined, undefined, value, false);
    }
     typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
          if (selectedElementId) {
            updateElement(selectedElementId, undefined, undefined, undefined, undefined, undefined, value);
          }
      }, 500);
  }

  const handleCustomCssChange = (value: string) => {
    setCustomCss(value);
     if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = true;
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, undefined, undefined, value, undefined, undefined, false);
    }
     typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
          if (selectedElementId) {
            updateElement(selectedElementId, undefined, undefined, undefined, value);
          }
      }, 500);
  }

    const handleClassNameChange = (value: string) => {
    setClassName(value);
     if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = true;
    if (selectedElementId) {
        updateElement(selectedElementId, undefined, undefined, undefined, undefined, value, undefined, false);
    }
     typingTimeout.current = setTimeout(() => {
          isTyping.current = false;
          if (selectedElementId) {
            updateElement(selectedElementId, undefined, undefined, undefined, undefined, value);
          }
      }, 500);
  }

  const handleIdChange = (value: string) => {
      setElementId(value);
  }
  
  const handleIdBlur = () => {
    if (selectedElementId && elementId) {
        updateElementId(selectedElementId, elementId);
    }
  }

  const showFor = (types: CanvasElementData['type'][]) => {
      if (!selectedElement) return false;
      return types.includes(selectedElement.type);
  }


  return (
    <aside className="w-80 border-l bg-card">
        {selectedElement && <SaveTemplateDialog isOpen={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen} element={selectedElement} />}
      <ScrollArea className="h-full">
            {selectedElement ? (
              <Accordion type="single" collapsible className="w-full" defaultValue="element-id">
                 <AccordionItem value="element-id">
                  <AccordionTrigger className="px-4 text-sm font-medium">Element</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground break-words">{selectedElement.id}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsSaveTemplateOpen(true)}>
                                <Save className="h-4 w-4 mr-2"/>
                                Save as Template
                            </Button>
                            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteElement(selectedElement.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="attributes">
                    <AccordionTrigger className="px-4 text-sm font-medium">Attributes</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                            <Label>ID</Label>
                            <Input value={elementId || ''} onChange={e => handleIdChange(e.target.value)} onBlur={handleIdBlur} />
                        </div>
                         <div className="space-y-2">
                            <Label>Classes</Label>
                            <Input value={className || ''} onChange={e => handleClassNameChange(e.target.value)} />
                        </div>
                    </AccordionContent>
                </AccordionItem>


                 {showFor(['text', 'button', 'heading', 'link', 'label', 'list-item']) && (
                    <AccordionItem value="content">
                        <AccordionTrigger className="px-4 text-sm font-medium">Content</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-2">
                            <Label>Text</Label>
                            <Input value={content || ''} onChange={e => handleContentChange(e.target.value)} />
                        </AccordionContent>
                    </AccordionItem>
                )}

                {showFor(['html']) && (
                    <AccordionItem value="html-content">
                        <AccordionTrigger className="px-4 text-sm font-medium flex items-center gap-2"><Code className="h-4 w-4" /> Raw HTML</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-2">
                            <Textarea 
                              value={htmlContent || ''} 
                              onChange={(e) => handleHtmlContentChange(e.target.value)}
                              rows={10}
                              placeholder="<p>Your HTML here...</p>"
                            />
                        </AccordionContent>
                    </AccordionItem>
                )}

                {showFor(['link']) && (
                    <AccordionItem value="link">
                        <AccordionTrigger className="px-4 text-sm font-medium">Link</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-2">
                             <div className="space-y-2">
                                <Label>URL (href)</Label>
                                <Input value={props.href || ''} onChange={e => handlePropChange('href', e.target.value)} placeholder="#" />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {showFor(['heading']) && (
                    <AccordionItem value="heading">
                        <AccordionTrigger className="px-4 text-sm font-medium">Heading</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-2">
                             <div className="space-y-2">
                                <Label>Level</Label>
                                <Select value={props.level ? String(props.level) : '1'} onValueChange={value => handlePropChange('level', parseInt(value, 10))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">H1</SelectItem>
                                    <SelectItem value="2">H2</SelectItem>
                                    <SelectItem value="3">H3</SelectItem>
                                    <SelectItem value="4">H4</SelectItem>
                                    <SelectItem value="5">H5</SelectItem>
                                    <SelectItem value="6">H6</SelectItem>
                                  </SelectContent>
                              </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {showFor(['input', 'textarea']) && (
                    <AccordionItem value="input-attributes">
                        <AccordionTrigger className="px-4 text-sm font-medium">Input Attributes</AccordionTrigger>
                        <AccordionContent className="px-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Placeholder</Label>
                                <Input value={props.placeholder || ''} onChange={e => handlePropChange('placeholder', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}


                <AccordionItem value="layout">
                  <AccordionTrigger className="px-4 text-sm font-medium">Layout</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                     <div className="space-y-2">
                        <Label>Display</Label>
                        <Select value={styles.display || ''} onValueChange={value => handleStyleChange('display', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select display type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="inline-block">Inline Block</SelectItem>
                            <SelectItem value="inline">Inline</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="inline-flex">Inline Flex</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Alignment</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', '0'); handleStyleChange('marginRight', 'auto');}} title="Align Left">
                                <ArrowLeftRight className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', 'auto'); handleStyleChange('marginRight', 'auto');}} title="Align Center">
                                <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => {handleStyleChange('marginLeft', 'auto'); handleStyleChange('marginRight', '0');}} title="Align Right">
                                <ArrowLeftRight className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Width</Label>
                        <div className="flex items-center gap-2">
                           <Input value={styles.width as string || ''} onChange={e => handleStyleChange('width', e.target.value)} placeholder="auto" />
                           <Button variant="outline" size="icon" onClick={() => handleStyleChange('width', '100%')} title="Full Width">
                               <StretchHorizontal className="h-4 w-4" />
                           </Button>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="position">
                  <AccordionTrigger className="px-4 text-sm font-medium">Positioning</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                     <div className="space-y-2">
                        <Label>Position</Label>
                        <Select value={styles.position || ''} onValueChange={value => handleStyleChange('position', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Static</SelectItem>
                            <SelectItem value="relative">Relative</SelectItem>
                            <SelectItem value="absolute">Absolute</SelectItem>
                            <SelectItem value="sticky">Sticky</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>

                    {styles.position && styles.position !== 'static' && (
                        <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Top</Label>
                                <Input value={styles.top as string || ''} onChange={e => handleStyleChange('top', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Right</Label>
                                <Input value={styles.right as string || ''} onChange={e => handleStyleChange('right', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Bottom</Label>
                                <Input value={styles.bottom as string || ''} onChange={e => handleStyleChange('bottom', e.target.value)} placeholder="auto" />
                            </div>
                             <div className="space-y-2">
                                <Label>Left</Label>
                                <Input value={styles.left as string || ''} onChange={e => handleStyleChange('left', e.target.value)} placeholder="auto" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Z-Index</Label>
                             <Input type="number" value={styles.zIndex || ''} onChange={e => handleStyleChange('zIndex', e.target.value)} placeholder="auto" />
                        </div>
                        </>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {showFor(['text', 'button', 'heading', 'link', 'label', 'list-item']) && (
                <AccordionItem value="typography">
                  <AccordionTrigger className="px-4 text-sm font-medium">Typography</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Input value={styles.fontSize || ''} onChange={e => handleStyleChange('fontSize', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <Select value={styles.fontWeight as string || ''} onValueChange={value => handleStyleChange('fontWeight', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="300">Light</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semi-bold</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Align</Label>
                      <Select value={styles.textAlign as string || ''} onValueChange={value => handleStyleChange('textAlign', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Line Height</Label>
                      <Input value={styles.lineHeight as string || ''} onChange={e => handleStyleChange('lineHeight', e.target.value)} placeholder="normal" />
                    </div>
                     <div className="space-y-2">
                      <Label>Letter Spacing</Label>
                      <Input value={styles.letterSpacing as string || ''} onChange={e => handleStyleChange('letterSpacing', e.target.value)} placeholder="normal" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {showFor(['text', 'heading', 'link', 'label', 'list-item']) && (
                 <AccordionItem value="color">
                    <AccordionTrigger className="px-4 text-sm font-medium">Color</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-2">
                        <div className="flex items-center gap-2">
                           <Input value={styles.color || ''} onChange={e => handleStyleChange('color', e.target.value)} className="flex-1" placeholder="e.g. #FFFFFF or hsl(var(--...))"/>
                           <Button variant="outline" size="icon" onClick={() => colorInputRef.current?.click()}>
                              <Blend className="h-4 w-4" />
                              <input
                                ref={colorInputRef}
                                type="color"
                                value={typeof styles.color === 'string' ? styles.color : '#000000'}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="absolute h-0 w-0 opacity-0"
                                />
                           </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                )}
                
                 <AccordionItem value="background">
                    <AccordionTrigger className="px-4 text-sm font-medium">Background</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex items-center gap-2">
                            <Input value={styles.backgroundColor || ''} onChange={e => handleStyleChange('backgroundColor', e.target.value)} className="flex-1" placeholder="e.g. #FFFFFF or hsl(var(--...))"/>
                            <Button variant="outline" size="icon" onClick={() => bgColorInputRef.current?.click()}>
                                <Brush className="h-4 w-4" />
                                <input
                                  ref={bgColorInputRef}
                                  type="color"
                                  value={typeof styles.backgroundColor === 'string' ? styles.backgroundColor : '#FFFFFF'}
                                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                  className="absolute h-0 w-0 opacity-0"
                                  />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Background Image</Label>
                          <Input 
                            value={styles.backgroundImage?.replace(/url\(['"]?(.*?)['"]?\)/, '$1') || ''} 
                            onChange={e => handleStyleChange('backgroundImage', e.target.value ? `url('${e.target.value}')` : '')} 
                            placeholder="Image URL" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Background Repeat</Label>
                          <Select value={styles.backgroundRepeat || ''} onValueChange={value => handleStyleChange('backgroundRepeat', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select repeat" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-repeat">No Repeat</SelectItem>
                              <SelectItem value="repeat">Repeat</SelectItem>
                              <SelectItem value="repeat-x">Repeat X</SelectItem>
                              <SelectItem value="repeat-y">Repeat Y</SelectItem>
                              <SelectItem value="space">Space</SelectItem>
                              <SelectItem value="round">Round</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="spacing">
                    <AccordionTrigger className="px-4 text-sm font-medium">Spacing</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Padding</Label>
                          <Input value={styles.padding as string || ''} onChange={e => handleStyleChange('padding', e.target.value)} placeholder="10px or 10px 20px" />
                        </div>
                        <div className="space-y-2">
                          <Label>Margin</Label>
                          <Input value={styles.margin as string || ''} onChange={e => handleStyleChange('margin', e.target.value)} placeholder="10px or 10px 20px" />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="border">
                    <AccordionTrigger className="px-4 text-sm font-medium">Borders</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Border</Label>
                          <Input value={styles.border as string || ''} onChange={e => handleStyleChange('border', e.target.value)} placeholder="1px solid #000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cornering (Radius)</Label>
                          <Input value={styles.borderRadius as string || ''} onChange={e => handleStyleChange('borderRadius', e.target.value)} placeholder="8px" />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {showFor(['image']) && (
                   <AccordionItem value="image">
                    <AccordionTrigger className="px-4 text-sm font-medium">Image</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Source URL</Label>
                          <Input value={props.src || ''} onChange={e => handlePropChange('src', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Alt Text</Label>
                          <Input value={props.alt || ''} onChange={e => handlePropChange('alt', e.target.value)} />
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                 {showFor(['video']) && (
                   <AccordionItem value="video">
                    <AccordionTrigger className="px-ax-4 text-sm font-medium">Video</AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Source URL</Label>
                          <Input value={props.src || ''} onChange={e => handlePropChange('src', e.target.value)} />
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                <AccordionItem value="custom-css">
                  <AccordionTrigger className="px-4 text-sm font-medium">Custom CSS</AccordionTrigger>
                  <AccordionContent className="px-4 space-y-2">
                      <Label>Add your own CSS</Label>
                      <Textarea 
                        value={customCss || ''} 
                        onChange={e => handleCustomCssChange(e.target.value)}
                        placeholder={`/* Example */\n:hover {\n  opacity: 0.8;\n}`}
                        rows={5}
                      />
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground p-4">
                <Settings className="h-10 w-10 mb-4" />
                <p className="font-semibold">Customize Element</p>
                <p>Select an element on the canvas to edit its styles and properties.</p>
              </div>
            )}
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
