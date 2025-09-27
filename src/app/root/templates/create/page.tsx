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

export default function CreateTemplatePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'section' | 'page' | 'element'>('section');
  const [elementsJson, setElementsJson] = useState('[]');
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    
    let elements: CanvasElementData[];
    try {
        elements = JSON.parse(elementsJson);
        if (!Array.isArray(elements) || elements.length === 0) {
            toast({ variant: 'destructive', title: 'Invalid Structure', description: 'The JSON structure must be a non-empty array of elements.' });
            return;
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The element structure is not valid JSON.' });
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
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Define the details for your new template.
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
                    <Label>Structure (JSON)</Label>
                    <Textarea
                        value={elementsJson}
                        onChange={(e) => setElementsJson(e.target.value)}
                        rows={15}
                        className="font-mono text-xs bg-muted/50"
                        placeholder='[{"id": "element-1", "type": "text", "content": "Hello World"}]'
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
