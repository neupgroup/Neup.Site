'use client';
import { useState, useEffect, use } from 'react';
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
import { Save, ArrowLeft, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServer, updateServer, type Server } from '@/actions/servers';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [publicIp, setPublicIp] = useState('');
  // These are write-only for override
  const [newPrivateIp, setNewPrivateIp] = useState('');
  const [newPrivateKey, setNewPrivateKey] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchServer = async () => {
      setLoading(true);
      const result = await getServer(id);
      if (result.success && result.server) {
        setName(result.server.name);
        setPublicIp(result.server.publicIp);
      } else {
        setError(result.error || 'Failed to fetch server details.');
      }
      setLoading(false);
    };

    fetchServer();
  }, [id]);

  const handleUpdateServer = async () => {
     if (!name || !publicIp) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Name and Public IP are required.' });
      return;
    }
    setIsSaving(true);
    const dataToUpdate: Partial<Omit<Server, 'id' | 'createdAt'>> = {
        name,
        publicIp,
    };
    if (newPrivateIp) {
        dataToUpdate.privateIp = newPrivateIp;
    }
    if (newPrivateKey) {
        dataToUpdate.privateKey = newPrivateKey;
    }

    const result = await updateServer(id, dataToUpdate);

    if (result.success) {
      toast({ title: 'Server Updated!', description: `Successfully updated ${name}.` });
      router.push(`/root/servers/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
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

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href={`/root/servers/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Server Details
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Server</CardTitle>
          <CardDescription>Update the details for this server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input id="server-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="public-ip">Public IP</Label>
                <Input id="public-ip" value={publicIp} onChange={e => setPublicIp(e.target.value)} />
            </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-amber-500/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
                <KeyRound className="h-5 w-5" />
                Override Private Credentials
            </CardTitle>
            <CardDescription>
                These fields are write-only. Fill them in only if you need to update the private IP or private key.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="private-ip">New Private IP (Optional)</Label>
                <Input id="private-ip" value={newPrivateIp} onChange={e => setNewPrivateIp(e.target.value)} placeholder="Leave blank to keep existing" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="private-key">New Private Key (Optional)</Label>
                <Textarea id="private-key" value={newPrivateKey} onChange={e => setNewPrivateKey(e.target.value)} placeholder="Leave blank to keep existing" rows={8} />
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 rounded-lg border shadow-sm mt-6">
        <Button onClick={handleUpdateServer} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

    </div>
  );
}
