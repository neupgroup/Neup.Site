'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { generateTemplateFromImageAction } from '@/actions/ai/generation';
import { saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import Canvas from '@/components/editor/canvas';
import { type CanvasElementData } from '@/app/site/editor/page';

const createTemplateSchema = z.object({
  prompt: z.string().min(10, 'Please provide a more detailed prompt.'),
  image: z.any().optional(),
});

type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

// Dummy functions to satisfy Canvas component props
const dummyFunction = () => {};

export default function CreateTemplatePage() {
  const [generatedElement, setGeneratedElement] = useState<CanvasElementData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit: SubmitHandler<CreateTemplateFormValues> = async (data) => {
    setIsLoading(true);
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
        setGeneratedElement(result.section);
        toast({ title: 'Success', description: 'Template structure generated. You can now save it.' });
      } else {
        throw new Error('AI did not return a valid section.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate template. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedElement) {
        toast({ variant: 'destructive', title: 'Error', description: 'No element to save.' });
        return;
    }
    
    // For simplicity, we'll use the prompt as the name
    const templateName = form.getValues('prompt').substring(0, 50);

    const result = await saveTemplate({
        name: templateName,
        description: `Generated from prompt: "${templateName}..."`,
        elements: [generatedElement],
        type: 'section',
    });

    if (result.success) {
        toast({ title: 'Template Saved!', description: `Template "${templateName}" has been saved.` });
        router.push('/templates');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Create AI-Powered Template</CardTitle>
          <CardDescription>Generate a new template section using a text prompt and an optional image.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., a modern hero section with a dark background and a glowing button" {...field} rows={4} />
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
                <div className="relative w-full h-48 rounded-md border overflow-hidden">
                   <img src={imagePreview} alt="Image Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate Template'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>This is a preview of the generated template. Save it to add it to your library.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
            {isLoading && (
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
                    <p>Your generated preview will appear here.</p>
                </div>
            )}
           </div>
        </CardContent>
        {generatedElement && (
            <CardContent>
                 <Button onClick={handleSave} className="w-full">Save Template</Button>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
