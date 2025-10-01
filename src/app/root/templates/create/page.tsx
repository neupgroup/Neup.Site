
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
import { Label } from '@/components/ui/label';

const NO_SOURCE_VALUE = '--none--';

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'codebase' | 'textual' | 'dragger'>('codebase');
  const [sourceId, setSourceId] = useState(NO_SOURCE_VALUE);

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
    
    const result = await saveTemplate({ 
        name, 
        description, 
        method, 
        source: sourceId === NO_SOURCE_VALUE ? '' : sourceId,
        code: '', // Code will be added in the next step
        elements: [],
        type: 'section', // Defaulting to section
    });

    if (result.success && result.id) {
        toast({ title: 'Template Created!', description: 'Now, let\'s define its content.' });
        router.push(`/root/templates/${result.id}/edit/content`);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
        <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Define the basic information for your new reusable component. You'll add content in the next step.
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
                        <SelectItem value={NO_SOURCE_VALUE}>None</SelectItem>
                        {sources.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save and Continue'}
              </Button>
            </CardFooter>
          </Card>
    </div>
  );
}
