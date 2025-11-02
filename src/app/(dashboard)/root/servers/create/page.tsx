

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type FormValues = Omit<Server, 'id' | 'createdOn' | 'expiresOn' | 'portsOpen' | 'usedPorts'>;

export default function CreateServerPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, formState: { isSubmitting }, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      publicIp: '',
      privateIp: '',
      privateKey: '',
      serverType: 'vps',
      platform: 'ubuntu',
      provider: '',
      isPrivate: false,
      username: 'root',
      basePath: '/home/{{username}}',
      appPath: '/var/www/{{universal.site_id}}'
    }
  });

  const handleCreateServer = async (data: FormValues) => {
    if (!data.name || !data.publicIp || !data.privateKey) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name, Public IP, and Private Key are required.' });
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
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="server-type">Server Type</Label>
                    <Select onValueChange={(value) => setValue('serverType', value as any)} defaultValue="vps">
                        <SelectTrigger id="server-type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vps">VPS</SelectItem>
                            <SelectItem value="dedicated">Dedicated</SelectItem>
                            <SelectItem value="cloud">Cloud</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="platform">Platform (OS)</Label>
                    <Select onValueChange={(value) => setValue('platform', value as any)} defaultValue="ubuntu">
                        <SelectTrigger id="platform">
                            <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ubuntu">Ubuntu</SelectItem>
                            <SelectItem value="windows">Windows</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input id="provider" {...register('provider')} placeholder="e.g., AWS, DigitalOcean" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Default Username</Label>
                    <Input id="username" {...register('username')} placeholder="e.g., root" />
                </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="basePath">Base Path</Label>
                    <Input id="basePath" {...register('basePath')} placeholder="e.g., /home/{{username}}" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="appPath">Application Path Template</Label>
                    <Input id="appPath" {...register('appPath')} placeholder="e.g., /var/www/{{universal.site_id}}" />
                </div>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="is-private" {...register('isPrivate')} />
                <Label htmlFor="is-private">This is a private server</Label>
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
