
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveTemplate } from '@/actions/editor/templates';
import { getSources, type Source } from '@/actions/editor/sources';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import { Label } from '@/components/ui/label';

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'codebase' | 'textual' | 'dragger'>('codebase');
  const [sourceId, setSourceId] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      const result = await getSources();
      if (result.success && result.sources) {
        setSources(result.sources);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load data sources',
          description: result.error,
        });
      }
      setLoadingSources(false);
    };
    fetchSources();
  }, [toast]);
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    
    setIsSaving(true);
    let elements: CanvasElementData[] = [];

    // For now, we are just saving the raw code.
    // In the future, this is where you'd process the code based on the method.
    // e.g., if (method === 'codebase' && looksLikeHtml(code)) { elements = await convertHtmlToJson(code); }
    
    const result = await saveTemplate({ 
        name, 
        description, 
        method, 
        source: sourceId,
        code,
        elements, // Pass empty array for now
        type: 'section', // Defaulting to section, could be made dynamic
    });

    if (result.success) {
        toast({ title: 'Template Saved!', description: `Template "${name}" has been saved.` });
        router.push('/root/templates');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };
  
  const getCodePlaceholder = () => {
      switch(method) {
          case 'codebase':
              return 'Enter HTML, JSON, or JSX...';
          case 'textual':
              return 'Describe the component you want to create. e.g., "A hero section with a title, subtitle, and a call-to-action button."';
          case 'dragger':
              return 'Template will be created from the dragger. (This method is not yet implemented).';
          default:
              return '';
      }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
        <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Define a new reusable component by specifying its creation method and data source.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" placeholder="e.g., 'Primary Button'" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" placeholder="A short description of this template" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a creation method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="codebase">Codebase (HTML, JSON)</SelectItem>
                        <SelectItem value="textual">Textual (AI)</SelectItem>
                        <SelectItem value="dragger" disabled>Dragger (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Data Source (Optional)</Label>
                    <Select value={sourceId} onValueChange={setSourceId} disabled={loadingSources}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingSources ? "Loading sources..." : "Select a data source"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {sources.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="code">Content</Label>
                    <Textarea
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        rows={15}
                        className="font-mono text-xs bg-muted/50"
                        placeholder={getCodePlaceholder()}
                        disabled={method === 'dragger'}
                      />
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </CardFooter>
          </Card>
    </div>
  );
}
