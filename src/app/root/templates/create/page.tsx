'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Sparkles } from 'lucide-react';
import type { CanvasElementData } from '@/app/site/editor/page';
import { generateSiteSectionAction } from '@/actions/ai/generation';
import { logErrorToFirestore } from '@/actions/logging';
import { Label } from '@/components/ui/label';

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'section' | 'page' | 'element'>('section');
  const [elements, setElements] = useState<CanvasElementData[]>([]);
  const [prompt, setPrompt] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        toast({ variant: 'destructive', title: 'Prompt is required' });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generateSiteSectionAction({ prompt });
        if (result && result.section) {
            setElements([result.section]);
            if (!name) {
                setName(result.section.id);
            }
            toast({ title: 'Generation Complete', description: 'Template structure has been generated.' });
        } else {
            throw new Error('AI did not return a valid section.');
        }
    } catch(e: any) {
        logErrorToFirestore({message: 'Failed to generate template structure: ' + e.message, stack: e.stack});
        toast({variant: 'destructive', title: 'Error', description: 'Failed to generate template from prompt.'});
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    if (elements.length === 0) {
      toast({ variant: 'destructive', title: 'Template is empty', description: 'Please generate a template structure first.' });
      return;
    }
    setIsSaving(true);
    const result = await saveTemplate({ name, description, type, elements });

    if (result.success) {
        toast({ title: 'Template Saved!', description: `Template "${name}" has been saved.` });
        router.push('/root/templates');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>1. Generate with AI</CardTitle>
                <CardDescription>
                    Describe the template you want to create. The AI will generate the underlying JSON structure for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Prompt</Label>
                    <Textarea 
                        id="ai-prompt"
                        placeholder="e.g., A hero section with a large centered title, a subtitle, a CTA button, and a background image."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={4}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Template Structure'}
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>2. Review and Save</CardTitle>
              <CardDescription>
                Provide the final details for your template and save it.
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
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="section">Section</SelectItem>
                        <SelectItem value="page">Page</SelectItem>
                        <SelectItem value="element">Element</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Generated Structure (JSON)</Label>
                    <Textarea
                        value={elements.length > 0 ? JSON.stringify(elements, null, 2) : 'Generate a template above to see the JSON structure.'}
                        rows={10}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving || elements.length === 0} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </CardFooter>
          </Card>
    </div>
  );
}