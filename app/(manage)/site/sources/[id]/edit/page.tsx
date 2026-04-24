
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, Controller } from 'react-hook-form';
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
import { Save, ArrowLeft, Loader2, Code, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source } from '@/server/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormValues = Partial<Source>;

const ApiFields = ({ control }: { control: any }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Base URL</Label>
        <Controller name="url" control={control} render={({ field }) => <Input {...field} placeholder="https://api.example.com/v1" />} />
      </div>
       <div className="space-y-2">
        <Label>Global Headers (JSON)</Label>
        <Controller name="headers" control={control} render={({ field }) => <Textarea {...field} placeholder='{ "Authorization": "Bearer ..." }' rows={5} className="font-mono"/>} />
      </div>
    </div>
  );
};


export default function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<FormValues>({
      defaultValues: {
          name: '',
          type: 'api',
      }
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        const sourceData = result.source;
        if (sourceData.type === 'api' && typeof sourceData.headers !== 'string') {
          sourceData.headers = JSON.stringify(sourceData.headers || {}, null, 2);
        }
        methods.reset(sourceData);
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id, methods]);

  const handleUpdateSource = async (data: FormValues) => {
    let dataToSave = { ...data };
    if (data.type === 'api' && typeof data.headers === 'string') {
      try {
        dataToSave.headers = data.headers ? JSON.parse(data.headers) : {};
      } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The headers are not valid JSON.' });
        return;
      }
    }
    
    // We only update the basic info here, not methods.
    const { methods: _, ...basicInfo } = dataToSave;
    const result = await updateSource(id, basicInfo);

    if (result.success) {
      toast({ title: 'Source Updated!', description: 'Now you can configure the methods.' });
      router.push(`/site/sources/${id}/edit/methods`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const { isSubmitting } = methods.formState;
  const sourceType = methods.watch('type');

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleUpdateSource)} className="w-full max-w-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Edit Data Source</h1>
            <Button variant="ghost" asChild>
                <Link href={`/site/sources/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Source
                </Link>
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings /> Basic Configuration</CardTitle>
            <CardDescription>Update the name and connection details for your data source.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={sourceType} onValueChange={() => {}} disabled>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="static">Static</SelectItem>
                        <SelectItem value="datalist">Datalist</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <Label>Source Name</Label>
              <Controller name="name" control={methods.control} render={({ field }) => <Input {...field} placeholder="e.g., My CRM API" />} />
            </div>

             {sourceType === 'api' && <ApiFields control={methods.control} />}
             
             {sourceType === 'datalist' && (
                <div className="space-y-2">
                    <Label>Datalist ID</Label>
                    <Controller name="datalistId" control={methods.control} render={({ field }) => <Input {...field} placeholder="Enter the Datalist ID" />} />
                </div>
             )}

          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Saving...' : 'Save and Continue'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
