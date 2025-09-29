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
import { Save } from 'lucide-react';
import type { CanvasElementData } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { convertHtmlToJson } from '@/ai/flows/html-to-json-flow';

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'section' | 'page' | 'element'>('section');
  const [inputFormat, setInputFormat] = useState<'json' | 'html'>('json');
  const [structureContent, setStructureContent] = useState('[]');
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    
    setIsSaving(true);
    let elements: CanvasElementData[];

    try {
        if (inputFormat === 'html') {
            toast({ title: 'Converting HTML...', description: 'AI is converting your HTML to JSON. This may take a moment.' });
            const conversionResult = await convertHtmlToJson(structureContent);
            if (!conversionResult || conversionResult.length === 0) {
              throw new Error("AI conversion failed or returned empty result.");
            }
            elements = conversionResult;
        } else {
            elements = JSON.parse(structureContent);
        }

        if (!Array.isArray(elements) || elements.length === 0) {
            toast({ variant: 'destructive', title: 'Invalid Structure', description: 'The structure must result in a non-empty array of elements.' });
            setIsSaving(false);
            return;
        }
    } catch(e: any) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Invalid Input', description: e.message || 'The provided input could not be processed.' });
        setIsSaving(false);
        return;
    }

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
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Define the details for your new template. You can provide the structure as JSON or have AI convert it from HTML.
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
                    <Label>Structure Format</Label>
                     <RadioGroup defaultValue="json" value={inputFormat} onValueChange={(v: any) => setInputFormat(v)} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="json" id="r-json" />
                            <Label htmlFor="r-json">JSON</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="html" id="r-html" />
                            <Label htmlFor="r-html">HTML (AI Conversion)</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="structure-content">Structure</Label>
                    <Textarea
                        id="structure-content"
                        value={structureContent}
                        onChange={(e) => setStructureContent(e.target.value)}
                        rows={15}
                        className="font-mono text-xs bg-muted/50"
                        placeholder={inputFormat === 'json' ? '[{"id": "element-1", "type": "text", "content": "Hello World"}]' : '<div>\n  <h1>Hello World</h1>\n</div>'}
                      />
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </CardFooter>
          </Card>
    </div>
  );
}
