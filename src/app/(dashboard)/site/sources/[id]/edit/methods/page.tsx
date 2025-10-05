
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider, useFormContext, Controller } from 'react-hook-form';
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
import { Save, ArrowLeft, Loader2, Plus, Trash2, Code, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSource, updateSource, type Source, type SourceMethod } from '@/actions/editor/sources';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormValues = {
    methods: SourceMethod[];
};

const MethodCard = ({ index, onRemove }: { index: number, onRemove: () => void }) => {
    const { control, getValues, setValue, register, formState: { errors } } = useFormContext<FormValues>();
    const [isEditing, setIsEditing] = useState(false);
    const [originalState, setOriginalState] = useState<SourceMethod | null>(null);

    const startEditing = () => {
        setOriginalState(getValues(`methods.${index}`));
        setIsEditing(true);
    };
    
    const cancelEditing = () => {
        if(originalState) {
            setValue(`methods.${index}`, originalState);
        }
        setIsEditing(false);
        setOriginalState(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="truncate">{getValues(`methods.${index}.methodName`) || `Method ${index + 1}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Method Name</Label>
                        <Input {...register(`methods.${index}.methodName`)} placeholder="e.g., getProducts" disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>HTTP Method</Label>
                        <Controller
                            control={control}
                            name={`methods.${index}.httpMethod`}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!isEditing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input {...register(`methods.${index}.path`)} placeholder="/products" disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                    <Label>Headers (JSON, Optional)</Label>
                    <Textarea {...register(`methods.${index}.headers` as any)} placeholder='{ "X-Custom-Header": "value" }' rows={3} className="font-mono" disabled={!isEditing} />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" variant="destructive" onClick={onRemove}>
                    <Trash2 className="mr-2" /> Remove
                </Button>
                {isEditing ? (
                    <div className="flex gap-2">
                         <Button type="button" variant="ghost" onClick={cancelEditing}>
                             <X className="mr-2" /> Cancel
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2" /> Save Method
                        </Button>
                    </div>
                ) : (
                    <Button type="button" variant="outline" onClick={startEditing}>
                        <Edit className="mr-2" /> Edit
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

const AddNewMethodCard = () => {
    const { control, setValue, getValues } = useFormContext<FormValues>();
    const { append } = useFieldArray({ control, name: 'methods' });
    const [newMethodName, setNewMethodName] = useState('');

    const handleAdd = () => {
        if (!newMethodName) return;
        append({
            methodName: newMethodName,
            httpMethod: 'GET',
            path: '',
            headers: '{}'
        });
        setNewMethodName('');
    };

    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle>Add New Method</CardTitle>
                <CardDescription>Define a new function for this data source.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <Label htmlFor="new-method-name">New Method Name</Label>
                    <Input
                        id="new-method-name"
                        value={newMethodName}
                        onChange={(e) => setNewMethodName(e.target.value)}
                        placeholder="e.g., getUserProfile"
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="button" onClick={handleAdd} disabled={!newMethodName}>
                    <Plus className="mr-2"/> Add Method
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function EditSourceMethodsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();

  const formMethods = useForm<FormValues>({
      defaultValues: {
          methods: [],
      }
  });
  
  const { fields, append, remove, control } = useFieldArray({
      control: formMethods.control,
      name: 'methods'
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        setSourceName(result.source.name);
        if (result.source.methods) {
            const formattedMethods = result.source.methods.map(m => ({
                ...m,
                headers: m.headers ? JSON.stringify(m.headers, null, 2) : '{}'
            }))
            formMethods.reset({ methods: formattedMethods as any });
        }
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id, formMethods]);

  const handleUpdateMethods = async (data: FormValues) => {
    let methodsToSave;
    try {
        methodsToSave = data.methods.map(m => ({
            ...m,
            headers: m.headers ? JSON.parse(m.headers as any) : undefined
        }));
    } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON in Headers', description: `Please check the headers for all methods.`});
        return;
    }

    const result = await updateSource(id, { methods: methodsToSave });

    if (result.success) {
      toast({ title: 'Methods Updated!', description: `Successfully updated methods for ${sourceName}.` });
      // We don't need to redirect, just show success. The form is now the source of truth.
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return (
        <div className="w-full max-w-4xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
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
  
  const { isSubmitting } = formMethods.formState;

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(handleUpdateMethods)} className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-muted-foreground">Editing methods for: <span className="font-semibold">{sourceName}</span></p>
            </div>
            <Button variant="ghost" asChild>
                <Link href={`/site/sources/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
                </Link>
            </Button>
        </div>
        
        {fields.map((field, index) => (
            <MethodCard key={field.id} index={index} onRemove={() => remove(index)} />
        ))}

        <AddNewMethodCard />

      </form>
    </FormProvider>
  );
}
