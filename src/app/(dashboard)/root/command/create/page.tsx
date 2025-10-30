
'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Globe, Code, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { createServerCommand } from '@/actions/commands';
import { ServerCommand, serverCommandSchema, CommandParameter } from '@/schemas/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

const placeholderXml = `<javascript.preProcessor>
// This script runs on our server, not the target server.
// It can access user-provided 'params' and 'universal' variables.
// Return a command string to execute it directly.
// OR return an object of new parameters to use in the bash block below.

// Example:
// const newParams = {
//   packageName: params.someUserInput.toLowerCase()
// };
// return newParams;

return {};
</javascript.preProcessor>

<server.ubuntuBashProcessor>
# This script runs on the target server.
# Use {{placeholder}} for parameters.

echo "Hello, {{name}}!"
</server.ubuntuBashProcessor>
`;

export default function CreateCommandPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<Omit<ServerCommand, 'id' | 'createdAt'>>({
    resolver: zodResolver(serverCommandSchema.omit({ id: true, createdAt: true })),
    defaultValues: {
      name: '',
      description: '',
      commandTemplate: placeholderXml,
      parameters: [],
      type: 'view',
      danger: 'low',
      allocatesPort: false,
      portToReserve: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'parameters'
  });

  const commandTemplateValue = useWatch({
    control: form.control,
    name: 'commandTemplate',
  });

  const detectedParams = useMemo(() => {
    const userParamRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const universalParamRegex = /\{\{universal\.([a-zA-Z0-9_]+)\}\}/g;
    
    const userParams = new Set<string>();
    const universalParams = new Set<string>();
    
    let match;
    while ((match = userParamRegex.exec(commandTemplateValue)) !== null) {
      if (match[1] !== 'universal') {
        userParams.add(match[1]);
      }
    }
    
    while ((match = universalParamRegex.exec(commandTemplateValue)) !== null) {
      universalParams.add(`universal.${match[1]}`);
    }

    return { user: Array.from(userParams), universal: Array.from(universalParams) };
  }, [commandTemplateValue]);
  
  useEffect(() => {
    const existingParamKeys = new Set(fields.map(f => f.key));
    const detectedParamKeys = new Set(detectedParams.user);

    // Add new params
    detectedParamKeys.forEach(key => {
        if (!existingParamKeys.has(key)) {
            append({ key, label: '', type: 'string', defaultValue: '', confidential: false });
        }
    });

    // Remove old params
    fields.forEach((field, index) => {
        if (!detectedParamKeys.has(field.key)) {
            remove(index);
        }
    });

  }, [detectedParams.user, fields, append, remove]);


  const allocatesPortValue = form.watch('allocatesPort');

  const onSubmit = async (data: Omit<ServerCommand, 'id' | 'createdAt'>) => {
    const result = await createServerCommand(data);
    if (result.success) {
      toast({ title: 'Command Created' });
      router.push('/root/command');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/root/command">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commands
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Command Template</CardTitle>
              <CardDescription>
                Define a new reusable command for your servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Command Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Install Package" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="A short description of what this command does." /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="creation">Creation</SelectItem><SelectItem value="destruction">Destruction</SelectItem><SelectItem value="updation">Updation</SelectItem><SelectItem value="view">View</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="danger" render={({ field }) => ( <FormItem><FormLabel>Danger Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="mid">Mid</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
              </div>
              <div className="rounded-lg border p-4 space-y-4">
                <FormField control={form.control} name="allocatesPort" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between"><div className="space-y-0.5"><FormLabel>Allocates a Port</FormLabel><FormDescription>Signal that this command will use and reserve a port on the server.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                {allocatesPortValue && ( <div className="space-y-2 border-t pt-4"><FormField control={form.control} name="portToReserve" render={({ field }) => ( <FormItem><FormLabel>Port to Reserve</FormLabel><FormControl><Input {...field} placeholder="e.g., 8080 or {{universal.available_port}}" /></FormControl><FormDescription>Enter a specific port or use the placeholder for an available one. Use <code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.reserved_port}}'}</code> in the template.</FormDescription><FormMessage /></FormItem> )} /></div> )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5"/> Command Template</CardTitle>
                <CardDescription>
                  The command structure. Parameters are detected automatically from <code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{placeholder}}`}</code> syntax.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <FormField control={form.control} name="commandTemplate" render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Textarea {...field} className="font-mono" rows={18} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
             </CardContent>
          </Card>
          
          <Card>
                <CardHeader>
                    <CardTitle>Detected Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">User-Defined Parameters</h3>
                        {fields.length > 0 ? (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg space-y-4">
                                        <Badge variant="secondary" className="font-mono">{`{{${field.key}}}`}</Badge>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <FormField control={form.control} name={`parameters.${index}.label`} render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} placeholder="e.g. 'Package Name'" /></FormControl><FormMessage /></FormItem>)} />
                                             <FormField control={form.control} name={`parameters.${index}.type`} render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="string">String</SelectItem><SelectItem value="number">Number</SelectItem><SelectItem value="textarea">Textarea</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                        </div>
                                         <FormField control={form.control} name={`parameters.${index}.defaultValue`} render={({ field }) => (<FormItem><FormLabel>Default Value (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name={`parameters.${index}.confidential`} render={({ field }) => ( <FormItem className="flex flex-row items-center gap-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="flex items-center gap-1"><KeyRound className="h-4 w-4"/> Confidential</FormLabel></FormItem> )} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No user-defined parameters detected.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Universal Parameters</h3>
                        {detectedParams.universal.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {detectedParams.universal.map(key => <Badge key={key} variant="outline" className="font-mono">{`{{${key}}}`}</Badge>)}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">No universal parameters detected.</p>
                        )}
                    </div>
                </CardContent>
          </Card>

            <Alert>
                <Globe className="h-4 w-4" />
                <AlertTitle>Universal Variables</AlertTitle>
                <AlertDescription>
                    These variables are available in your `javascript.preProcessor` via the `universal` object and in the `server.ubuntuBashProcessor` block.
                    <ul className="list-disc pl-5 mt-2 text-xs">
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.name}}'}</code> - Server name</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.public_ip}}'}</code> - Public IP</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.username}}'}</code> - Default username</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.base_path}}'}</code> - Default base path</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.account_id}}'}</code> - User Account ID</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.available_port}}'}</code> - First available port</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-blue-500">{'{{universal.reserved_port}}'}</code> - The port reserved for this execution.</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.used_ports}}'}</code> - CSV of used ports</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-red-500">{'{{universal.linked_account_github}}'}</code> - GitHub Token (Confidential)</li>
                    </ul>
                </AlertDescription>
            </Alert>
          
          <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? ( <Loader2 className="animate-spin mr-2" /> ) : ( <Save className="mr-2" /> )}
                Create Command
              </Button>
            </CardFooter>
        </form>
      </Form>
    </div>
  );
}
