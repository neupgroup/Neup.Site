
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Globe } from 'lucide-react';
import Link from 'next/link';
import { getServerCommand, updateServerCommand, deleteServerCommand } from '@/actions/commands';
import { ServerCommand, serverCommandSchema } from '@/schemas/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function EditCommandPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<ServerCommand>({
    resolver: zodResolver(serverCommandSchema),
    defaultValues: {
      name: '',
      description: '',
      commandTemplate: '',
      parameters: [],
      type: 'view',
      danger: 'low',
      preprocess: false,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const commandTemplateValue = form.watch('commandTemplate');
  const preprocessValue = form.watch('preprocess');

  useEffect(() => {
    const foundParams = commandTemplateValue?.match(/\{\{([^}]+)\}\}/g) || [];
    const paramKeys = foundParams
        .map(p => p.slice(2, -2).trim())
        .filter(p => !p.startsWith('universal.'));

    const existingKeys = new Set(fields.map(f => f.key));
    const newKeys = new Set<string>();

    for (const key of paramKeys) {
        if (!newKeys.has(key)) {
            newKeys.add(key);
            if (!existingKeys.has(key)) {
                 append({
                    key: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    type: 'string',
                    defaultValue: '',
                    confidential: false,
                });
            }
        }
    }

    const currentParams = form.getValues('parameters') || [];
    const filteredParams = currentParams.filter(p => newKeys.has(p.key));
    if (filteredParams.length !== currentParams.length) {
        replace(filteredParams);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandTemplateValue, append, fields, replace]);

  useEffect(() => {
    getServerCommand(params.id).then(({ command, error }) => {
      if (command) {
        form.reset(command);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error || 'Failed to fetch command data.',
        });
      }
    });
  }, [params.id, form, toast]);

  const onSubmit = async (data: ServerCommand) => {
    const result = await updateServerCommand(params.id, data);
    if (result.success) {
      toast({ title: 'Command Updated' });
      router.push(`/root/command/${params.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServerCommand(params.id);
    if (result.success) {
        toast({ title: 'Command Deleted'});
        router.push('/root/command');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  return (
    <>
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button variant="ghost" asChild>
            <Link href={`/root/command/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Command
            </Link>
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Command Template</CardTitle>
                <CardDescription>
                  Modify the command details and parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Command Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Install Package" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="A short description of what this command does." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="creation">Creation</SelectItem>
                            <SelectItem value="destruction">Destruction</SelectItem>
                            <SelectItem value="updation">Updation</SelectItem>
                            <SelectItem value="view">View</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="danger"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danger Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="mid">Mid</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="preprocess"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Pre-process as JavaScript</FormLabel>
                         <FormDescription>
                          The command template will be run as a script to generate the final bash command.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commandTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{preprocessValue ? 'JavaScript Pre-processor' : 'Command Template'}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={preprocessValue ? `// Must return a string, e.g.,\n// return 'echo ' + params.message;` : "e.g., sudo apt-get install -y {{packageName}}"} className="font-mono" rows={8} />
                      </FormControl>
                       <FormDescription>{preprocessValue ? "The script runs on the server and has access to a 'params' object with user inputs. Universal variables are substituted after." : "Use `{{placeholder}}` for dynamic user values and `{{universal.placeholder}}` for system values."}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertTitle>Universal Variables</AlertTitle>
                  <AlertDescription>
                    These variables are always available in your final command string (after any JS pre-processing).
                    <ul className="list-disc pl-5 mt-2 text-xs">
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.name}}'}</code> - Server name</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.public_ip}}'}</code> - Public IP</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.username}}'}</code> - Default username</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.base_path}}'}</code> - Default base path</li>
                       <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.account_id}}'}</code> - User Account ID</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.available_port}}'}</code> - First available port</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.available_ports}}'}</code> - CSV of available ports</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{'{{universal.used_ports}}'}</code> - CSV of used ports</li>
                      <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-red-500">{'{{universal.linked_account_github}}'}</code> - GitHub Token (Confidential)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              {fields.length > 0 && (
                <Card>
                  <CardHeader>
                      <CardTitle>Parameters</CardTitle>
                      <CardDescription>Define user-provided values for your command template or script. Parameters are auto-detected from `{{...}}` placeholders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {fields.map((field, index) => (
                          <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name={`parameters.${index}.key`} render={({ field }) => (
                                      <FormItem><FormLabel>Key</FormLabel><FormControl><Input {...field} readOnly className="font-mono bg-muted" /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`parameters.${index}.label`} render={({ field }) => (
                                      <FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} placeholder="e.g., Package Name" /></FormControl><FormMessage /></FormItem>
                                  )} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                  <FormField
                                      control={form.control}
                                      name={`parameters.${index}.type`}
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormLabel>Type</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                  <SelectItem value="string">String</SelectItem>
                                                  <SelectItem value="number">Number</SelectItem>
                                              </SelectContent>
                                          </Select>
                                          <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                                  <FormField
                                      control={form.control}
                                      name={`parameters.${index}.confidential`}
                                      render={({ field }) => (
                                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-6">
                                              <FormControl>
                                                  <Checkbox
                                                      checked={field.value}
                                                      onCheckedChange={field.onChange}
                                                  />
                                              </FormControl>
                                              <FormLabel>Confidential</FormLabel>
                                          </FormItem>
                                      )}
                                  />
                              </div>
                          </div>
                      ))}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardFooter className="flex justify-between items-center p-6">
                  <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="mr-2"/> Delete Command
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </Form>
      </div>
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete this command. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
