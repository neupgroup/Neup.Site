
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getApplicantsForJob, type Applicant } from '@/services/applicants';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { AlertCircle, Plus, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '#/components/ui/badge';
import { format } from 'date-fns';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  usePageTitle('Applicants');
  const { id } = use(params);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      const result = await getApplicantsForJob(id);
      if (result.success && result.applicants) {
        setApplicants(result.applicants);
      } else {
        setError(result.error || 'Failed to fetch applicants');
      }
      setLoading(false);
    };

    fetchApplicants();
  }, [id]);

  return (
    <div className="w-full">
        <div className="mb-4">
            <LinkButton variant="outlined" href={`/manage/hiring/${id}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Job Posting
            </LinkButton>
        </div>
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Applicants</h1>
            <p className="text-muted-foreground">Review candidates for this job posting.</p>
        </div>
        <LinkButton variant="solid" href={`/manage/hiring/${id}>
            <Plus className="mr-2 h-4 w-4" /> Add Applicant
          </LinkButton>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Candidate List</CardTitle>
          <CardDescription>A list of all applicants for this position.</CardDescription>
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
          ) : applicants.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Applicants Yet</h3>
                <p>Add an applicant or share your careers page to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.name}</TableCell>
                    <TableCell>{applicant.email}</TableCell>
                    <TableCell><Badge variant="secondary">{applicant.status}</Badge></TableCell>
                    <TableCell>{applicant.appliedAt ? format(new Date(applicant.appliedAt), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <LinkButton variant="plain" size="icon" href={`/manage/hiring/${id}>
                          <ArrowRight className="h-4 w-4" />
                        </LinkButton>
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
