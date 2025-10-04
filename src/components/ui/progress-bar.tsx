'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Configure NProgress once
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
  }, []);

  // Stop the progress bar when navigation finishes
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Start progress on valid internal clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external links, hash links, or same-page navigations
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        isSameURL(href, pathname, searchParams.toString())
      ) {
        return;
      }

      // Ignore modifier/middle clicks
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      NProgress.start();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname, searchParams]);

  return null;
}

// Helper to check if the href is the same as current URL (pathname + search)
function isSameURL(href: string, currentPathname: string, currentSearch: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    const currentFull = `${currentPathname}${currentSearch ? `?${currentSearch}` : ''}`;
    const targetFull = `${url.pathname}${url.search}`;
    return targetFull === currentFull;
  } catch {
    return false;
  }
}
