
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Github, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLinkedAccounts, deleteLinkedAccount } from '@/services/accounts';
import type { LinkedAccount } from '@/services/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { usePageTitle } from '@/hooks/use-page-title';

function LinkedAccountCard({ account, onDisconnect }: { account: LinkedAccount, onDisconnect: (id: string) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDisconnect(account.id);
  };
    
  return (
    <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <Github className="h-8 w-8" />
                    <div>
                        <CardTitle className="capitalize">{account.platform}</CardTitle>
                        <CardDescription>
                            Username: {account.authorization_info.provider_username}
                        </CardDescription>
                    </div>
                </div>
                 <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Disconnect
                </Button>
            </CardHeader>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Authorized on: {account.authorized_on ? format(new Date(account.authorized_on), 'PPP') : 'N/A'}
                </p>
            </CardFooter>
        </Card>
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will disconnect your {account.platform} account. You will need to re-authorize it to use related features.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Disconnect</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}


export default function AccountsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  usePageTitle('Account Management');

  const fetchAccounts = async () => {
      setLoading(true);
      const { accounts, error } = await getLinkedAccounts();
      if (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load linked accounts.' });
      } else {
          setLinkedAccounts(accounts || []);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
    
    if (searchParams.get('success')) {
      toast({
        title: 'Account Linked Successfully',
        description: 'Your GitHub account has been connected.',
      });
      // Clean up URL
      router.replace('/settings/accounts');
    }
    const error = searchParams.get('error');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'GitHub Authentication Failed',
        description: decodeURIComponent(error),
      });
       // Clean up URL
      router.replace('/settings/accounts');
    }
  }, [searchParams, toast, router]);
  
  const handleDisconnect = async (id: string) => {
      const result = await deleteLinkedAccount(id);
      if (result.success) {
          toast({ title: 'Account Disconnected', description: 'The account has been unlinked.' });
          fetchAccounts(); // Refresh the list
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
  };

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">Manage your third-party account integrations.</p>
      </header>

      <div className="space-y-4">
        {loading ? (
            <Skeleton className="h-24 w-full" />
        ) : linkedAccounts.length > 0 ? (
            linkedAccounts.map(account => (
                <LinkedAccountCard key={account.id} account={account} onDisconnect={handleDisconnect} />
            ))
        ) : (
             <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">No accounts linked yet.</p>
                     <Button asChild>
                        <Link href="/settings/accounts/github">
                            <Github className="mr-2 h-4 w-4" /> Link GitHub Account
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
