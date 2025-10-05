
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createServer } from '@/actions/servers';
import Link from 'next/link';
import { Server } from '@/schemas/server';

type FormValues = Omit<Server, 'id' | 'createdOn' | 'expiresOn'>;

export default function CreateServerPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '',
      username: 'root', // Default to 'root'
    }
  });

  const handleCreateServer = async (data: FormValues) => {
    if (!data.name || !data.publicIp || !data.privateKey || !data.username) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name, Public IP, Private Key, and Username are required.' });
      return;
    }
    
    const result = await createServer(data);

    if (result.success) {
      toast({ title: 'Server Created!', description: `Successfully created ${data.name}.` });
      router.push('/root/servers');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleCreateServer)} className="w-full max-w-2xl space-y-6">
      <div className="mb-4">
        <Button variant="ghost" asChild>
            <Link href="/root/servers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Servers
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Server</CardTitle>
          <CardDescription>Enter the details for the new server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input id="server-name" {...register('name')} placeholder="e.g., My Production Server" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="public-ip">Public IP</Label>
                    <Input id="public-ip" {...register('publicIp')} placeholder="e.g., 203.0.113.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="private-ip">Private IP (Optional)</Label>
                    <Input id="private-ip" {...register('privateIp')} placeholder="e.g., 10.0.0.1" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username')} placeholder="e.g., admin" defaultValue="root" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="private-key">Private Key</Label>
                <Textarea id="private-key" {...register('privateKey')} placeholder="Begins with -----BEGIN RSA PRIVATE KEY-----" rows={8} />
            </div>
        </CardContent>
        <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Creating...' : 'Create Server'}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
