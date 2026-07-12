'use client';

import { useRef, useState, useTransition } from 'react';
import { GripVertical } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/core/utils';
import { useToast } from '@/core/hooks/use-toast';
import type { Member } from '@/schemas/member';
import { saveMemberOrder } from '@/services/members';

/*
::neup.documentation::manage-member-cards

::public

Client-side draggable card list for `/manage/member`.

It persists member order in the database and keeps order hidden from the page
presentation.

::public end
::end
*/

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function moveMember(members: Member[], draggedMemberId: string, targetMemberId: string) {
  const sourceIndex = members.findIndex((member) => member.id === draggedMemberId);
  const targetIndex = members.findIndex((member) => member.id === targetMemberId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return members;
  }

  const nextMembers = [...members];
  const [draggedMember] = nextMembers.splice(sourceIndex, 1);
  nextMembers.splice(targetIndex, 0, draggedMember);
  return nextMembers;
}

function getMovedMemberIds(previousMembers: Member[], nextMembers: Member[]) {
  const previousIndexMap = new Map(previousMembers.map((member, index) => [member.id, index]));
  return new Set(
    nextMembers
      .filter((member, index) => previousIndexMap.get(member.id) !== index)
      .map((member) => member.id),
  );
}

interface MemberCardsProps {
  initialMembers: Member[];
}

export function MemberCards({ initialMembers }: MemberCardsProps) {
  const [members, setMembers] = useState(initialMembers);
  const [previewMembers, setPreviewMembers] = useState<Member[] | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [settlingMemberIds, setSettlingMemberIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderedMembers = previewMembers ?? members;

  const persistOrder = (nextMembers: Member[], previousMembers: Member[]) => {
    startTransition(() => {
      void (async () => {
        const result = await saveMemberOrder(nextMembers.map((member) => member.id));

        if (!result.success) {
          setMembers(previousMembers);
          toast({ variant: 'destructive', title: 'Error', description: result.error ?? 'Failed to save member order.' });
          return;
        }

        toast({ title: 'Member order saved' });
      })();
    });
  };

  const clearSettleTimeout = () => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  };

  return (
    <div className="grid gap-4">
      {renderedMembers.map((member) => {
        const previewIndex = renderedMembers.findIndex((item) => item.id === member.id);
        const committedIndex = members.findIndex((item) => item.id === member.id);
        const isDragged = draggedMemberId === member.id;
        const isPreviewShifted = draggedMemberId !== null && committedIndex !== previewIndex && !isDragged;
        const isSettling = settlingMemberIds.has(member.id);

        return (
        <article
          key={member.id}
          draggable
          onDragStart={(event) => {
            clearSettleTimeout();
            setDraggedMemberId(member.id);
            setPreviewMembers(members);
            setSettlingMemberIds(new Set());
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!draggedMemberId || draggedMemberId === member.id) {
              return;
            }

            setDropTargetId(member.id);
            setPreviewMembers(moveMember(members, draggedMemberId, member.id));
          }}
          onDragLeave={() => setDropTargetId((current) => (current === member.id ? null : current))}
          onDrop={(event) => {
            event.preventDefault();

            if (!draggedMemberId) {
              return;
            }

            const previousMembers = members;
            const nextMembers = previewMembers ?? moveMember(members, draggedMemberId, member.id);
            const movedMemberIds = getMovedMemberIds(previousMembers, nextMembers);

            setMembers(nextMembers);
            setPreviewMembers(null);
            setDraggedMemberId(null);
            setDropTargetId(null);
            setSettlingMemberIds(movedMemberIds);
            clearSettleTimeout();
            settleTimeoutRef.current = setTimeout(() => {
              setSettlingMemberIds(new Set());
              settleTimeoutRef.current = null;
            }, 220);
            persistOrder(nextMembers, previousMembers);
          }}
          onDragEnd={() => {
            setDraggedMemberId(null);
            setDropTargetId(null);
            setPreviewMembers(null);
          }}
          className={cn(
            'grid cursor-grab gap-4 rounded-lg border bg-background px-5 py-4 transition-[transform,opacity,border-color,background-color] duration-200 active:cursor-grabbing md:grid-cols-[auto_1fr_auto] md:items-center',
            dropTargetId === member.id ? 'border-primary bg-primary/5' : '',
            isDragged ? 'opacity-40' : '',
            isPreviewShifted || isSettling ? 'opacity-45' : '',
            isPending ? 'opacity-70' : '',
          )}
        >
          <Avatar className="h-12 w-12">
            {member.imageUrl ? <AvatarImage src={member.imageUrl} alt={member.name} /> : null}
            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium">{member.name}</div>
            <div className="text-sm text-muted-foreground">{member.role}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
          <GripVertical className="justify-self-end h-4 w-4 text-muted-foreground" />
        </article>
        );
      })}
    </div>
  );
}
