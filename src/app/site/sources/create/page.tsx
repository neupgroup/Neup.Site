
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSource } from '@/actions/editor/sources';
import Link from 'next/link';

export default function CreateSourcePage() {
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceBasePath, setNewSourceBasePath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateSource = async () => {
    if (!newSourceName || !newSourceBasePath) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a name and a base path.' });
      return;
    }
    setIsSaving(true);
    
    const result = await createSource({ 
        name: newSourceName, 
        basePath: newSourceBasePath,
        methods: [],
        permitControl: false,
        ownedBy: 'system' // In a real app, you'd get the current user ID.
    });

    if (result.success) {
      toast({ title: 'Source Created!', description: `Successfully created ${newSourceName}.` });
      router.push('/site/sources');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" asChild>
            <Link href="/site/sources">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sources
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Data Source</CardTitle>
          <CardDescription>Add a new API endpoint to fetch data from.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-name">Source Name</Label>
            <Input id="source-name" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="e.g., My CRM API" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-path">Base Path</Label>
            <Input id="base-path" value={newSourceBasePath} onChange={e => setNewSourceBasePath(e.target.value)} placeholder="https://api.example.com/v1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateSource} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Source'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
