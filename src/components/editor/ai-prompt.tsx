'use client';
import { useState } from 'react';
import { generateJsonFromPrompt } from '@/actions/ai/generation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';

interface AiPromptProps {
    onGenerate: (json: string) => void;
}

export default function AiPrompt({ onGenerate }: AiPromptProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'Prompt is required.' });
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateJsonFromPrompt(prompt);
            if (result.success && result.data) {
                const jsonString = JSON.stringify(result.data, null, 2);
                onGenerate(jsonString);
                toast({ title: 'Success', description: 'JSON structure generated successfully.' });
            } else {
                throw new Error(result.error || 'Failed to generate content.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 />
                    Generate with AI
                </CardTitle>
                <CardDescription>
                    Describe the component or section you want to build, and the AI will generate the JSON structure for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Prompt</Label>
                    <Textarea
                        id="ai-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A hero section with a large heading, a descriptive paragraph, and a call-to-action button."
                        rows={3}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? 'Generating...' : 'Generate'}
                </Button>
            </CardContent>
        </Card>
    );
}
