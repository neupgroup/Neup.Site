'use server';

import { headers } from 'next/headers';

/*
::neup.documentation::project-context-service

Resolves the active project for the current request.

::end
*/

const SELECTED_PROJECT_QUERY_PARAM = 'selectedProject';
const SELECTED_PROJECT_HEADER = 'x-selected-project';

function normalizeProjectId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readProjectIdFromUrl(rawUrl: string | null | undefined): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    return normalizeProjectId(new URL(value, 'http://localhost').searchParams.get(SELECTED_PROJECT_QUERY_PARAM));
  } catch {
    return null;
  }
}

export async function getActiveProjectId(options?: { required?: boolean }): Promise<string | null> {
  const headerStore = await headers();

  const selectedProject =
    normalizeProjectId(headerStore.get(SELECTED_PROJECT_HEADER)) ??
    readProjectIdFromUrl(headerStore.get('referer')) ??
    readProjectIdFromUrl(headerStore.get('x-url')) ??
    readProjectIdFromUrl(headerStore.get('next-url'));

  if (selectedProject) {
    return selectedProject;
  }

  if (options?.required) {
    throw new Error('Active project not found.');
  }

  return null;
}
