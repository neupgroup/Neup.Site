

'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider, Controller } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source, type SourceType } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FormValues = Partial<Source>;

const ApiFields = ({ control }: { control: any }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL</Label>
        <Controller name="url" control={control} render={({ field }) => <Input {...field} placeholder="https://api.example.com/data" />} />
      </div>
    </div>
  );
};

const DatabaseFields = ({ control }: { control: any }) => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
            <Label>Connection String</Label>
            <Controller name="connection" control={control} render={({ field }) => <Input {...field} placeholder="your-db-connection-string" />} />
        </div>
      </div>
    )
}

const StaticFields = ({ control }: { control: any }) => {
     return (
      <div className="space-y-2">
        <Label>JSON Data</Label>
        <Controller name="data" control={control} render={({ field }) => <Textarea {...field} rows={10} placeholder='{ "key": "value" }' />} />
      </div>
    )
}


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
          methods: [],
      }
  });
  
  const sourceType = methods.watch('type');
  const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: 'methods'
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        const sourceData = result.source;
        if (sourceData.type === 'static' && typeof sourceData.data !== 'string') {
          sourceData.data = JSON.stringify(sourceData.data, null, 2);
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
    if (data.type === 'static' && typeof data.data === 'string') {
      try {
        dataToSave.data = JSON.parse(data.data);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The static data is not valid JSON.' });
        return;
      }
    }
    
    const result = await updateSource(id, dataToSave);

    if (result.success) {
      toast({ title: 'Source Updated!', description: `Successfully updated ${data.name}.` });
      router.push(`/site/sources/${id}`);
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleUpdateSource)} className="w-full max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Data Source</CardTitle>
            <CardDescription>Update the details and methods for your data source.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Controller name="name" control={methods.control} render={({ field }) => <Input {...field} placeholder="e.g., My CRM API" />} />
            </div>
            <div className="space-y-2">
                <Label>Source Type</Label>
                <Controller name="type" control={methods.control} render={({ field }) => (
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="api">API</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="static">Static</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <CardTitle>Configuration</CardTitle>
                 <CardDescription>Specific settings for the "{sourceType}" source type.</CardDescription>
            </CardHeader>
            <CardContent>
                {sourceType === 'api' && <ApiFields control={methods.control} />}
                {sourceType === 'database' && <DatabaseFields control={methods.control} />}
                {sourceType === 'static' && <StaticFields control={methods.control} />}
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                 <CardTitle>Methods</CardTitle>
                 <CardDescription>Define the available functions for this data source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <Label>Method Name</Label>
                                <Input {...methods.register(`methods.${index}.methodName`)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Path/Query</Label>
                                <Input {...methods.register(`methods.${index}.path`)} />
                            </div>
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ methodName: '', path: '' })}>
                    <Plus className="mr-2" /> Add Method
                </Button>
            </CardContent>
        </Card>


        <div className="flex justify-between sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm">
          <Button variant="ghost" asChild>
            <Link href={`/site/sources/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
