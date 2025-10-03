
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveTemplate } from '@/actions/editor/templates';
import { getSources, type Source } from '@/actions/editor/sources';
import { createTemplateFromPrompt } from '@/ai/flows/create-template-from-prompt-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const NO_SOURCE_VALUE = '--none--';

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // State for Manual Tab
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualMethod, setManualMethod] = useState<'codebase' | 'textual' | 'dragger'>('codebase');
  const [manualSourceId, setManualSourceId] = useState(NO_SOURCE_VALUE);
  
  // State for AI Tab
  const [aiName, setAiName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

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
  
  const handleManualSave = async () => {
    if (!manualName.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    
    setIsSaving(true);
    
    const result = await saveTemplate({ 
        name: manualName, 
        description: manualDescription, 
        method: manualMethod, 
        source: manualSourceId === NO_SOURCE_VALUE ? '' : manualSourceId,
        code: '',
        elements: [],
        type: 'section',
        createdBy: 'user', // This would be dynamic in a real app
    });

    if (result.success && result.id) {
        toast({ title: 'Template Created!', description: 'Now, let\'s define its content.' });
        router.push(`/root/templates/${result.id}/edit/content`);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setIsSaving(false);
    }
  };

  const handleAiSave = async () => {
    if (!aiName.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    if (!aiPrompt.trim()) {
        toast({ variant: 'destructive', title: 'Prompt is required' });
        return;
    }
    
    setIsSaving(true);
    toast({ title: 'AI is generating your template...', description: 'This may take a moment.' });
    
    try {
        const generatedElements = await createTemplateFromPrompt(aiPrompt);

        const result = await saveTemplate({ 
            name: aiName, 
            description: `AI-generated: ${aiPrompt.substring(0, 100)}...`,
            method: 'codebase', // AI-generated templates are treated as codebase
            elements: generatedElements,
            type: 'section',
            createdBy: 'ai',
        });

        if (result.success && result.id) {
            toast({ title: 'Template Generated!', description: 'You can now view or edit the template.' });
            router.push(`/root/templates/${result.id}`);
        } else {
            throw new Error(result.error || 'Failed to save the generated template.');
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unknown error occurred during AI generation.' });
        setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
        <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                <TabsTrigger value="ai">
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Assistant
                </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
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
                            <Input id="name" placeholder="e.g., 'Primary Button'" value={manualName} onChange={e => setManualName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea id="description" placeholder="A short description of this template" value={manualDescription} onChange={e => setManualDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Method</Label>
                            <Select value={manualMethod} onValueChange={(v: any) => setManualMethod(v)}>
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
                            <Select value={manualSourceId} onValueChange={setManualSourceId} disabled={loadingSources}>
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
                      <Button onClick={handleManualSave} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save and Continue'}
                      </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="ai">
                 <Card>
                    <CardHeader>
                      <CardTitle>Create with AI</CardTitle>
                      <CardDescription>
                        Describe the component you want to create. The AI will generate the structure for you.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ai-name">Template Name</Label>
                            <Input id="ai-name" placeholder="e.g., 'Product Card'" value={aiName} onChange={e => setAiName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-prompt">Prompt</Label>
                            <Textarea 
                                id="ai-prompt" 
                                placeholder="A card with a large image at the top. Below the image, there's a bold title, a paragraph for description, and a button at the bottom that says 'Learn More'."
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                rows={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleAiSave} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
