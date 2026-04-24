'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getJobPostings, type JobPosting } from '@/server/hiring';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { AlertCircle, Plus, Briefcase, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { usePageTitle } from '@/hooks/use-page-title';

export default function HiringDashboardPage() {
  usePageTitle('Hiring');

  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostings = async () => {
      setLoading(true);
      const result = await getJobPostings();
      if (result.success && result.postings) {
        setPostings(result.postings);
      } else {
        setError(result.error || 'Failed to fetch job postings');
      }
      setLoading(false);
    };

    fetchPostings();
  }, []);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Hiring</h1>
        <Button asChild>
          <Link href="/manage/hiring/create">
            <Plus className="mr-2 h-4 w-4" /> Create Job Posting
          </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Job Postings</CardTitle>
          <CardDescription>A list of all job postings for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : postings.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Job Postings Yet</h3>
              <p>Click "Create Job Posting" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((posting) => (
                  <TableRow key={posting.id}>
                    <TableCell className="font-medium">{posting.title}</TableCell>
                    <TableCell>{posting.location || 'N/A'}</TableCell>
                    <TableCell>{posting.type || 'N/A'}</TableCell>
                    <TableCell><Badge variant={posting.status === 'Open' ? 'default' : 'secondary'}>{posting.status}</Badge></TableCell>
                    <TableCell>{posting.createdAt ? format(new Date(posting.createdAt), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/manage/hiring/${posting.id}`}>
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
      </Card>
    </div>
  );
}
