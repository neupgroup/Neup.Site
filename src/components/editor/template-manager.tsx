
'use client';
import { FC, useState, useEffect } from 'react';
import { getTemplates, saveTemplate, deleteTemplate } from '@/actions/editor/templates';
import type { Template } from '@/lib/schemas';
import type { CanvasElementData } from '@/app/site/editor/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import Link from 'next/link';

interface TemplateManagerProps {
  selectedElement: CanvasElementData | null;
  addGeneratedElement: (element: CanvasElementData) => void;
}

const TemplateManager: FC<TemplateManagerProps> = ({ selectedElement, addGeneratedElement }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTemplates();
      if (result.success && result.templates) {
        setTemplates(result.templates);
      } else {
        throw new Error(result.error || 'Failed to fetch templates.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const handleSaveTemplate = async () => {
    if (!selectedElement || !newTemplateName.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected element and template name are required.' });
        return;
    }

    const newTemplate: Omit<Template, 'id' | 'createdAt'> = {
        name: newTemplateName,
        description: newTemplateDescription,
        elements: [selectedElement], // Save the selected element as the content
        type: 'element',
    };

    const result = await saveTemplate(newTemplate);
    if (result.success) {
        toast({ title: 'Template Saved!', description: `Template "${newTemplateName}" has been saved.` });
        setIsSaveDialogOpen(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        fetchTemplates(); // Refresh the list
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleAddTemplateToCanvas = (template: Template) => {
    if (template.elements && template.elements[0]) {
      // We need to create new unique IDs for the element and its children
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

      const newElement = deepCopyAndNewIds(template.elements[0]);
      addGeneratedElement(newElement);
      toast({ title: 'Template Added', description: `Added "${template.name}" to the canvas.` });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const result = await deleteTemplate(id);
    if (result.success) {
      toast({ title: 'Template Deleted' });
      fetchTemplates();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };


  return (
    <div className="space-y-4">
      <Button 
        className="w-full"
        onClick={() => setIsSaveDialogOpen(true)}
        disabled={!selectedElement}
      >
        <Plus className="mr-2 h-4 w-4" />
        Save Selection as Template
      </Button>

       <Button variant="outline" className="w-full" asChild>
        <Link href="/root/templates/create">
            <Plus className="mr-2 h-4 w-4" />
            Create with AI
        </Link>
      </Button>
       
      <h3 className="font-semibold text-muted-foreground text-sm pt-4">My Templates</h3>

      {loading && (
         <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && templates.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">No templates saved yet.</p>
      )}
      
      {!loading && templates.length > 0 && (
        <div className="space-y-2">
          {templates.map(template => (
            <div key={template.id} className="flex items-center justify-between gap-2 p-2 rounded-md border group">
              <button
                onClick={() => handleAddTemplateToCanvas(template)}
                className="flex-1 text-left truncate"
              >
                  <p className="font-medium text-sm">{template.name}</p>
                  {template.description && <p className="text-xs text-muted-foreground truncate">{template.description}</p>}
              </button>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => template.id && handleDeleteTemplate(template.id)}
              >
                  <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Save Selection as Template</DialogTitle>
                <DialogDescription>
                    This will save the currently selected element and its children as a reusable template.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input id="template-name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="template-description">Description (optional)</Label>
                    <Textarea id="template-description" value={newTemplateDescription} onChange={e => setNewTemplateDescription(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}>Save Template</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
