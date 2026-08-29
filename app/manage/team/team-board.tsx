'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, Pencil } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader } from '#/components/ui/card';
import { cn } from '#/core/utils';
import { useToast } from '#/core/hooks/useToast';
import type { Member } from '@/services/member/type';
import type { Team } from '@/services/team/type';
import { saveTeamBoardOrder } from '@/services/teams';

/*
::neup.documentation::manage-team-board

::public

Client-side board for `/manage/team`.

It keeps drag-and-drop interaction state in the UI and delegates all persisted
team/member ordering changes to the team service.

::public end
::end
*/

const UNASSIGNED_GROUP_ID = 'unassigned';

type BoardGroup = {
  id: string;
  teamId: string | null;
  name: string;
  description?: string;
  members: Member[];
};

type DragState =
  | { type: 'group'; groupId: string }
  | { type: 'member'; memberId: string; fromGroupId: string };

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createBoardGroups(teams: Team[], members: Member[]): BoardGroup[] {
  const sortedTeams = [...teams].sort((first, second) => {
    const firstOrder = first.order ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder || first.name.localeCompare(second.name);
  });
  const sortedMembers = [...members].sort((first, second) => {
    const firstOrder = first.order ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder || first.name.localeCompare(second.name);
  });
  const groups: BoardGroup[] = sortedTeams.map((team) => ({
    id: team.id,
    teamId: team.id,
    name: team.name,
    description: team.description,
    members: [],
  }));
  const unassignedGroup: BoardGroup = {
    id: UNASSIGNED_GROUP_ID,
    teamId: null,
    name: 'Unassigned Members',
    description: 'Members without a group live here until they are moved.',
    members: [],
  };
  const groupMap = new Map(groups.map((group) => [group.id, group]));

  for (const member of sortedMembers) {
    const teamId = member.teamId && groupMap.has(member.teamId) ? member.teamId : undefined;
    const group = teamId ? groupMap.get(teamId) : unassignedGroup;
    group?.members.push(member);
  }

  return unassignedGroup.members.length ? [...groups, unassignedGroup] : groups;
}

function moveGroup(groups: BoardGroup[], sourceGroupId: string, targetGroupId: string) {
  const sourceIndex = groups.findIndex((group) => group.id === sourceGroupId);
  const targetIndex = groups.findIndex((group) => group.id === targetGroupId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return groups;
  }

  const nextGroups = [...groups];
  const [movedGroup] = nextGroups.splice(sourceIndex, 1);
  nextGroups.splice(targetIndex, 0, movedGroup);
  return nextGroups;
}

function moveMember(groups: BoardGroup[], memberId: string, fromGroupId: string, toGroupId: string, targetMemberId?: string) {
  const sourceGroup = groups.find((group) => group.id === fromGroupId);
  const targetGroup = groups.find((group) => group.id === toGroupId);
  const member = sourceGroup?.members.find((item) => item.id === memberId);
  if (!sourceGroup || !targetGroup || !member) {
    return groups;
  }

  return groups.map((group) => {
    if (group.id !== sourceGroup.id && group.id !== targetGroup.id) {
      return group;
    }

    if (sourceGroup.id === targetGroup.id) {
      const members = group.members.filter((item) => item.id !== memberId);
      const targetIndex = targetMemberId ? members.findIndex((item) => item.id === targetMemberId) : members.length;
      members.splice(targetIndex >= 0 ? targetIndex : members.length, 0, member);
      return { ...group, members };
    }

    if (group.id === sourceGroup.id) {
      return { ...group, members: group.members.filter((item) => item.id !== memberId) };
    }

    const members = [...group.members];
    const targetIndex = targetMemberId ? members.findIndex((item) => item.id === targetMemberId) : members.length;
    members.splice(targetIndex >= 0 ? targetIndex : members.length, 0, member);
    return { ...group, members };
  });
}

interface TeamBoardProps {
  teams: Team[];
  members: Member[];
}

export function TeamBoard({ teams, members }: TeamBoardProps) {
  const initialGroups = useMemo(() => createBoardGroups(teams, members), [teams, members]);
  const [groups, setGroups] = useState(initialGroups);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropGroupId, setDropGroupId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const persistGroups = (nextGroups: BoardGroup[], previousGroups: BoardGroup[]) => {
    startTransition(async () => {
      const result = await saveTeamBoardOrder({
        teamIds: nextGroups.flatMap((group) => (group.teamId ? [group.teamId] : [])),
        groups: nextGroups.map((group) => ({
          teamId: group.teamId,
          memberIds: group.members.map((member) => member.id),
        })),
      });

      if (!result.success) {
        setGroups(previousGroups);
        toast({ variant: 'destructive', title: 'Error', description: result.error ?? 'Failed to save team order.' });
        return;
      }

      toast({ title: 'Team order saved' });
    });
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!dragState) {
      return;
    }

    const nextGroups = dragState.type === 'group'
      ? moveGroup(groups, dragState.groupId, targetGroupId)
      : moveMember(groups, dragState.memberId, dragState.fromGroupId, targetGroupId);
    setGroups(nextGroups);
    persistGroups(nextGroups, groups);
    setDragState(null);
    setDropGroupId(null);
  };

  const handleMemberDrop = (targetGroupId: string, targetMemberId: string) => {
    if (!dragState || dragState.type !== 'member') {
      return;
    }

    const nextGroups = moveMember(groups, dragState.memberId, dragState.fromGroupId, targetGroupId, targetMemberId);
    setGroups(nextGroups);
    persistGroups(nextGroups, groups);
    setDragState(null);
    setDropGroupId(null);
  };

  if (!teams.length) {
    return (
      <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
        <p>No teams created yet.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-xl font-semibold">Organize Your Team</h2>
          <p className="text-sm text-muted-foreground">
            Drag members to reorder them or move them between groups. Drag groups to reorder them.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <section
            key={group.id}
            draggable={Boolean(group.teamId)}
            onDragStart={(event) => {
              if (!group.teamId) {
                event.preventDefault();
                return;
              }

              setDragState({ type: 'group', groupId: group.id });
              event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropGroupId(group.id);
            }}
            onDragLeave={() => setDropGroupId(null)}
            onDrop={() => handleGroupDrop(group.id)}
            className={cn(
              'rounded-lg border bg-muted/20 p-4 transition-colors',
              dropGroupId === group.id ? 'border-primary bg-primary/5' : 'border-border',
              isPending ? 'opacity-70' : '',
            )}
          >
            <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-start gap-3">
              <GripVertical className="mt-1 h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-headline text-lg font-semibold">{group.name}</h3>
                {group.description ? <p className="text-sm text-muted-foreground">{group.description}</p> : null}
              </div>
              {group.teamId ? (
                <Button asChild type="plain" size="icon">
                  <Link href={`/manage/team/${group.teamId}/edit`} aria-label={`Edit ${group.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="space-y-3">
              {group.members.map((member) => (
                <article
                  key={member.id}
                  draggable
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setDragState({ type: 'member', memberId: member.id, fromGroupId: group.id });
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    handleMemberDrop(group.id, member.id);
                  }}
                  className="grid cursor-grab grid-cols-[auto_auto_1fr] items-center gap-3 rounded-lg border bg-background px-3 py-3 shadow-sm active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Avatar className="h-10 w-10">
                    {member.imageUrl ? <AvatarImage src={member.imageUrl} alt={member.name} /> : null}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{member.name}</div>
                    <div className="truncate text-sm text-muted-foreground">{member.role}</div>
                  </div>
                </article>
              ))}
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.stopPropagation();
                  handleGroupDrop(group.id);
                }}
                className="rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm text-muted-foreground"
              >
                Drop member here to add to {group.name}
              </div>
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
