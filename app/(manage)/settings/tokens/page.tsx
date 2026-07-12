
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { KeyRound, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { createToken, getTokens, revokeToken } from '@/services/tokens';
import { ApiToken } from '@/services/token/type';
import { format } from 'date-fns';
import { usePageTitle } from '@/core/hooks/use-page-title';

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): { token: string, prefix: string } {
  const prefix = 'npk_';
  const randomPart = Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return { token: `${prefix}${randomPart}`, prefix };
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tokenNameToCreate, setTokenNameToCreate] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const { toast } = useToast();
  usePageTitle('API Tokens');

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const result = await getTokens();
    if (result.success && result.tokens) {
      setTokens(result.tokens);
    } else {
      setError(result.error || 'Failed to load tokens.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async () => {
    if (!tokenNameToCreate.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    setIsCreating(true);

    const { token, prefix } = generateToken();
    const tokenHash = await sha256(token);
    
    const result = await createToken(tokenNameToCreate, tokenHash, prefix);

    if (result.success) {
      setGeneratedToken(token);
      setTokenNameToCreate('');
      fetchTokens();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsCreating(false);
  };

  const handleRevokeToken = async () => {
    if (!tokenToDelete) return;

    const result = await revokeToken(tokenToDelete.id);
    if (result.success) {
      toast({ title: 'Token Revoked', description: `The token "${tokenToDelete.name}" has been revoked.` });
      fetchTokens();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setTokenToDelete(null);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  const closeGeneratedTokenDialog = () => {
    setGeneratedToken(null);
    setCopiedToken(false);
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">API Tokens</h1>
        <p className="text-muted-foreground">Manage API tokens for accessing your site's resources programmatically.</p>
      </header>

      {generatedToken && (
        <Alert>
          <KeyRound className="h-4 w-4" />
          <AlertTitle>New Token Generated!</AlertTitle>
          <AlertDescription>
            <p>Please copy this token now. You won't be able to see it again.</p>
            <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md font-mono text-sm">
                <span className="flex-1 truncate">{generatedToken}</span>
                 <Button variant="plain" size="icon" onClick={() => copyToClipboard(generatedToken)}>
                    {copiedToken ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <Button variant="tertiary" size="sm" className="mt-2" onClick={closeGeneratedTokenDialog}>Close</Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
                <Label htmlFor="token-name">Token Name</Label>
                <Input 
                    id="token-name"
                    value={tokenNameToCreate}
                    onChange={(e) => setTokenNameToCreate(e.target.value)}
                    placeholder="e.g., My Awesome App"
                    disabled={isCreating}
                />
            </div>
            <Button variant="primary" onClick={handleCreateToken} disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin mr-2"/> : <Plus className="mr-2"/>}
                Generate Token
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Tokens</CardTitle>
          <CardDescription>
            These tokens have access to your account data. Keep them secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Token (Prefix)</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tokens.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No tokens found.</TableCell></TableRow>
                        ) : (
                            tokens.map(token => (
                                <TableRow key={token.id}>
                                    <TableCell className="font-medium">{token.name}</TableCell>
                                    <TableCell className="font-mono">{token.token}</TableCell>
                                    <TableCell>{token.createdAt ? format(new Date(token.createdAt), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="plain" size="icon" onClick={() => setTokenToDelete(token)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
             </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!tokenToDelete} onOpenChange={() => setTokenToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently revoke the token "{tokenToDelete?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeToken}>Revoke</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
