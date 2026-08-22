'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/core/hooks/use-toast';
import { clearSession } from '@/inapp/helpers/session-manager';
import { deleteManagedProject } from '@/services/projects';

/*
::neup.documentation::manage-project-delete-button

::public

Confirmed destructive action for deleting a managed project from the project
detail management surface.

::public end
::end
*/

export function ProjectDeleteButton({
  projectId,
  projectName,
  isCurrentProject,
}: {
  projectId: string;
  projectName: string;
  isCurrentProject: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteManagedProject(projectId);

    if (!result.success) {
      setIsPending(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error ?? 'Failed to delete project.',
      });
      return;
    }

    setShowConfirm(false);
    toast({
      title: 'Project Deleted',
      description: `${projectName} has been permanently removed.`,
    });

    if (isCurrentProject) {
      clearSession();
      router.push('/switch?returnTo=/manage/projects');
      return;
    }

    setIsPending(false);
    router.refresh();
  };

  return (
    <>
      <Button type="button" variant="destructiveTertiary" size="sm" onClick={() => setShowConfirm(true)} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        Delete this project
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {projectName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
