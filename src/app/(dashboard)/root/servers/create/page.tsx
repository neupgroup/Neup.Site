
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
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createServer } from '@/actions/servers';
import Link from 'next/link';

export default function CreateServerPage() {
  const [name, setName] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [privateIp, setPrivateIp] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateServer = async () => {
    if (!name || !publicIp || !privateKey) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name, Public IP, and Private Key are required.' });
      return;
    }
    setIsSaving(true);
    
    const result = await createServer({ 
        name,
        publicIp,
        privateIp,
        privateKey
    });

    if (result.success) {
      toast({ title: 'Server Connected!', description: `Successfully connected to ${name}.` });
      router.push('/root/servers');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
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
          <CardTitle>Connect New Server</CardTitle>
          <CardDescription>Enter the details for the server you want to connect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input id="server-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Production Server" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="public-ip">Public IP</Label>
                    <Input id="public-ip" value={publicIp} onChange={e => setPublicIp(e.target.value)} placeholder="e.g., 203.0.113.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="private-ip">Private IP (Optional)</Label>
                    <Input id="private-ip" value={privateIp} onChange={e => setPrivateIp(e.target.value)} placeholder="e.g., 10.0.0.1" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="private-key">Private Key</Label>
                <Textarea id="private-key" value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="Begins with -----BEGIN RSA PRIVATE KEY-----" rows={8} />
            </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateServer} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Connecting...' : 'Connect Server'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
