
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '#/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';
import { Switch } from '#/components/ui/switch';
import { useToast } from '#/core/hooks/useToast';
import { createEnvironmentVariable } from '@/services/environment';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '#/core/hooks/use-page-title';

const formSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  value: z.string().min(1, 'Value is required'),
  dataType: z.enum(['string', 'number', 'boolean']),
  isPrivate: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const formatVariableName = (name: string) => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/[\s-]/g, '_') // spaces and hyphens to underscores
    .toUpperCase();
};

export default function CreateEnvironmentVariablePage() {
  usePageTitle('Create Environment Variable');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: '',
      dataType: 'string',
      isPrivate: true,
    },
  });

  const onSubmit = async (data: FormValues) => {
    const formattedName = formatVariableName(data.name);
    const result = await createEnvironmentVariable({ ...data, name: formattedName });
    if (result.success) {
      toast({ title: "Variable Added", description: `Variable ${formattedName} has been saved.`});
      router.push('/site/environment');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button type="plain" asChild>
          <Link href="/site/environment">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Environments
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Add New Environment Variable</CardTitle>
              <CardDescription>The name will be automatically converted to UPPER_SNAKE_CASE.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="My Variable Name" /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem><FormLabel>Value</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="dataType" render={({ field }) => (
                    <FormItem><FormLabel>Data Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="isPrivate" render={({ field }) => (
                    <FormItem className="flex flex-col pt-2"><FormLabel>Private</FormLabel>
                        <div className="flex items-center gap-2 pt-2.5">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <span className="text-sm text-muted-foreground">Is this a sensitive value?</span>
                        </div>
                    <FormMessage /></FormItem>
                )}/>
            </div>
            </CardContent>
            <CardFooter>
                <Button type="solid" htmlType="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2" />}
                    Add Variable
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
