
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPage } from '@/services/editor/pages';
import { useToast } from '@/core/hooks/use-toast';

export default function CreateFromTextPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [description, setDescription] = useState('');

    const handleGenerate = async () => {
        setIsCreating(true);
        const result = await createPage('ai');
        if (result.success && result.id) {
            // Here you would typically pass the description to the AI page
            // For now, we just redirect.
            router.push(`/site/editor/textual?id=${result.id}&prompt=${encodeURIComponent(description)}`);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setIsCreating(false);
        }
    };

  return (
    <div className="w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create from Natural Language</CardTitle>
          <CardDescription>
            Describe the page you want to create. Be as specific as you can. Mention the sections, content, and the overall style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="page-description">Page Description</Label>
                 <Textarea 
                    id="page-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`e.g., 'A landing page for a new SaaS product called "SynthWave". It should have a hero section with a signup form, a features section with three columns, a pricing table, and a simple footer.'`}
                    rows={8}
                    className="bg-muted/50"
                 />
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={isCreating}>
                <Wand2 className="mr-2 h-4 w-4" />
                {isCreating ? 'Generating...' : 'Generate Page'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
