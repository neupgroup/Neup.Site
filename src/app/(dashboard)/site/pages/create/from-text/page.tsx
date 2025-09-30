
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function CreateFromTextPage() {
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
                    placeholder="e.g., 'A landing page for a new SaaS product called "SynthWave". It should have a hero section with a signup form, a features section with three columns, a pricing table, and a simple footer.'"
                    rows={8}
                    className="bg-muted/50"
                 />
            </div>
            <Button className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Page
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
