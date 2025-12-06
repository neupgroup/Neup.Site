
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getServerCommands, type ServerCommand } from '@/actions/commands';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Command, ArrowRight, ChevronLeft, ChevronRight, Search, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function CommandsPage() {
  const [commands, setCommands] = useState<ServerCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = 10;
  const searchQuery = searchParams.get('search') || '';

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLoading(true);
      const result = await getServerCommands({ searchQuery, page: currentPage, pageSize });
      if (result.success && result.commands) {
        setCommands(result.commands);
        setTotalCount(result.totalCount || 0);
      } else {
        setError(result.error || 'Failed to fetch commands');
      }
      setLoading(false);
    });
  }, [searchQuery, currentPage, pageSize]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set('search', e.target.value);
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const getDangerVariant = (danger?: 'low' | 'mid' | 'high') => {
      switch(danger) {
          case 'high': return 'destructive';
          case 'mid': return 'secondary';
          default: return 'outline';
      }
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Command Templates</h1>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/root/command/guide">
                <BookOpen className="mr-2 h-4 w-4" /> View Guide
              </Link>
            </Button>
            <Button asChild>
              <Link href="/root/command/create">
                <Plus className="mr-2 h-4 w-4" /> Create Command
              </Link>
            </Button>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Commands</CardTitle>
          <CardDescription>A list of all reusable server commands.</CardDescription>
            <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search commands..."
                    className="pl-8"
                    onChange={handleSearch}
                    defaultValue={searchQuery}
                />
            </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(pageSize)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : commands.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <Command className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Commands Found</h3>
                <p>{searchQuery ? 'Try adjusting your search.' : 'Click "Create Command" to get started.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Danger Level</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commands.map((command) => (
                  <TableRow key={command.id}>
                    <TableCell className="font-medium">{command.name}</TableCell>
                    <TableCell className="capitalize">{command.type}</TableCell>
                    <TableCell>
                        <Badge variant={getDangerVariant(command.danger)} className="capitalize">{command.danger}</Badge>
                    </TableCell>
                    <TableCell>{command.parameters?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/root/command/${command.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
         {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isPending}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isPending}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
