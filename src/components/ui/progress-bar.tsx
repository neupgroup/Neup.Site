'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial NProgress setup
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
  }, []);

  // Handle stopping NProgress when navigation completes
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Handle starting NProgress on link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;

      // Ignore new tab clicks (ctrl/cmd/middle/right)
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 // left click only
      ) {
        return;
      }

      // Client-side route: start progress
      NProgress.start();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
