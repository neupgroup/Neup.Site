
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { generateTemplateFromImageAction } from '@/actions/ai/generation';
import { saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Image as ImageIcon, Save } from 'lucide-react';
import Canvas from '@/components/editor/canvas';
import { type CanvasElementData } from '@/app/site/editor/page';
import Link from 'next/link';

const createTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters.'),
  description: z.string().optional(),
  prompt: z.string().min(10, 'Please provide a more detailed prompt.'),
  image: z.any().optional(),
});

type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

// Dummy functions to satisfy Canvas component props
const dummyFunction = () => {};

export default function CreateTemplatePage() {
  const [generatedElement, setGeneratedElement] = useState<CanvasElementData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      prompt: '',
    },
  });

  const handleGenerate: SubmitHandler<CreateTemplateFormValues> = async (data) => {
    setIsGenerating(true);
    setGeneratedElement(null);
    let imageDataUri: string | undefined = undefined;

    if (data.image && data.image.length > 0) {
      const file = data.image[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          imageDataUri = reader.result as string;
          resolve();
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
    }

    try {
      const result = await generateTemplateFromImageAction({ prompt: data.prompt, imageDataUri });
      if (result.section) {
        // Also pre-fill the name from the prompt for convenience
        form.setValue('name', data.prompt.substring(0, 50));
        setGeneratedElement(result.section);
        toast({ title: 'Preview Generated', description: 'AI has generated a preview. You can now save it as a template.' });
      } else {
        throw new Error('AI did not return a valid section.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate template preview. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedElement) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please generate an element before saving.' });
        return;
    }
    
    const { name, description } = form.getValues();
    if (!name.trim()) {
        form.setError('name', { type: 'manual', message: 'Template name is required.'});
        return;
    }

    setIsSaving(true);
    const result = await saveTemplate({
        name,
        description,
        elements: [generatedElement],
        type: 'section', // Currently hardcoded, can be a form field later
    });

    if (result.success) {
        toast({ title: 'Template Saved!', description: `Template "${name}" has been saved.` });
        router.push('/root/templates');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template with AI</CardTitle>
          <CardDescription>
            Use AI to generate an initial structure from a prompt and/or an image. 
            You can also create templates manually by saving a selection in the 
            <Button variant="link" asChild className="p-0 h-auto ml-1"><Link href="/site/editor">main editor</Link></Button>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                 <h3 className="text-sm font-medium text-muted-foreground">AI Generation</h3>
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Prompt</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., a modern hero section with a dark background..." {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Image (Optional)</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={(e) => {
                                field.onChange(e.target.files);
                                if (e.target.files && e.target.files[0]) {
                                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                                } else {
                                    setImagePreview(null);
                                }
                            }} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />

                 {imagePreview && (
                    <div className="relative w-full h-32 rounded-md border overflow-hidden">
                       <img src={imagePreview} alt="Image Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Preview'}
                  </Button>
              </div>

               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Hero Section Dark Mode'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of this template" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Preview & Save</CardTitle>
          <CardDescription>The generated element will appear here. Once you are happy with it, save the template.</CardDescription>
        </CardHeader>
        <CardContent className="relative flex-1">
            {isGenerating && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <p className="flex items-center gap-2"><Sparkles className="h-5 w-5 animate-spin" /> Generating...</p>
                </div>
            )}
           <div className="rounded-lg border bg-background p-4 min-h-[300px]">
            {generatedElement ? (
                 <Canvas
                    elements={[generatedElement]}
                    selectedElement={null}
                    onSelectElement={dummyFunction}
                    updateElement={dummyFunction}
                    moveElement={dummyFunction}
                    addElement={dummyFunction}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <p>Generate a preview using the AI tools above.</p>
                </div>
            )}
           </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={!generatedElement || isSaving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
