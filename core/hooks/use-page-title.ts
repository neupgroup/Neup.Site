
'use client';

/*
::neup.documentation::core-use-page-title-hook
::title Page Title Hook

Sets the browser document title from generic title parts.

::public

Use `usePageTitle()` in client components that need to synchronize `document.title`.

::public end

::private

This hook intentionally accepts title parts from the caller instead of reading profile or asset context from core.

::private end

::end
*/

import { useEffect } from 'react';
import { formatAppTitle } from '@/core/metadata';

/**
 * Custom hook to set page title with optional caller-owned context.
 */
export function usePageTitle(pageTitle: string, contextTitle?: string) {
    useEffect(() => {
        document.title = formatAppTitle(pageTitle, contextTitle);
    }, [pageTitle, contextTitle]);
}
