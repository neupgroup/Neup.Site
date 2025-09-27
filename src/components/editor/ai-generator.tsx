'use client';
import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateSiteSectionAction } from '@/actions/ai/generation';
import { Sparkles } from 'lucide-react';
import type { CanvasElementData } from '@/app/site/editor/page';
import { logErrorToFirestore } from '@/actions/logging';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AiGeneratorProps {
    addGeneratedElement: (element: CanvasElementData, dropZoneId?: string, parentId?: string) => void;
}

const AiGenerator: FC<AiGeneratorProps> = ({ addGeneratedElement }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                variant: 'destructive',
                title: 'Prompt is empty',
                description: 'Please describe the section you want to generate.',
            });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateSiteSectionAction({ prompt });
            if (result && result.section) {
                addGeneratedElement(result.section);
                toast({
                    title: 'Section Generated!',
                    description: 'The new section has been added to the bottom of your page.',
                });
                setPrompt('');
            } else {
                 throw new Error('AI did not return a valid section.');
            }
        } catch (error: any) {
            console.error("Error generating site section:", error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: error.message || 'An unknown error occurred while generating the section.',
            });
            logErrorToFirestore({ message: error.message, stack: error.stack });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate with AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Textarea 
                        placeholder="e.g., A two-column feature section with an image on the left and text on the right."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                    />
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                        {isLoading ? (
                            'Generating...'
                        ) : (
                           <>
                             <Sparkles className="mr-2 h-4 w-4" />
                             Generate Section
                           </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default AiGenerator;
