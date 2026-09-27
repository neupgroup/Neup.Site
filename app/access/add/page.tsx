'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { useToast } from '@neup/core/hooks/useToast';
import { addAccessRole, getAccessAddProjects, type AccessAddAccount, type AccessAddProject } from '@/services/access';

export default function AddAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim() ?? '';
  const { toast } = useToast();
  const [projects, setProjects] = useState<AccessAddProject[]>([]);
  const [accounts, setAccounts] = useState<AccessAddAccount[]>([]);
  const [assetId, setAssetId] = useState(projectId);
  const [accountId, setAccountId] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccessAddProjects(projectId || undefined).then((result) => {
      if (result.success) {
        setProjects(result.projects ?? []);
        setAccounts(result.accounts ?? []);
      }
      else toast({ variant: 'destructive', title: 'Error', description: result.error });
    });
  }, [projectId, toast]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const result = await addAccessRole({ accountId, assetId, role, expectedAssetId: projectId || undefined });
    setLoading(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Unable to add access', description: result.error });
      return;
    }
    toast({ title: 'Access added' });
    router.push(projectId ? `/access?project=${encodeURIComponent(projectId)}` : '/access');
  };

  return (
    <div className="w-full max-w-none">
      <Link href="/access" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Access
      </Link>
      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Add Access</CardTitle>
            <CardDescription>Grant an existing account access to one of the sites you manage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.neupId ?? account.id}{account.displayName ? ` (${account.displayName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              {projectId ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {projects[0] ? `${projects[0].name} (${projects[0].id})` : `Site (${projectId})`}
                </div>
              ) : (
                <Select value={assetId} onValueChange={setAssetId} required>
                  <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
                  <SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name} ({project.id})</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="solid" htmlType="submit" disabled={loading || !projects.length || !accounts.length || !assetId || !accountId}>
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Add Access
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
