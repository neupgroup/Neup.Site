
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
} from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { createSource, SourceType } from '@/services/editor/sources';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';

export default function CreateSourcePage() {
  const [name, setName] = useState('');
  const [type, setType] = useState<SourceType>('api');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateSource = async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a name.' });
      return;
    }
    setIsSaving(true);
    
    let sourceData: any = { name, type, methods: [] };
    if (type === 'api') {
      sourceData.url = '';
      sourceData.headers = {};
    } else if (type === 'database') {
      sourceData.connection = '';
    } else if (type === 'static') {
      sourceData.data = {};
    } else if (type === 'datalist') {
        sourceData.datalistId = '';
    }

    const result = await createSource(sourceData);

    if (result.success && result.id) {
      toast({ title: 'Source Created!', description: `Now, let's configure ${name}.` });
      router.push(`/site/sources/${result.id}/edit`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="plain" asChild>
            <Link href="/site/sources">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sources
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Data Source</CardTitle>
          <CardDescription>Add a new API endpoint, database query, or static data to fetch data from.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-name">Source Name</Label>
            <Input id="source-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Blog API" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-type">Source Type</Label>
            <Select value={type} onValueChange={(v: SourceType) => setType(v)}>
                <SelectTrigger id="source-type">
                    <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="datalist">Datalist</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" onClick={handleCreateSource} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save and Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
