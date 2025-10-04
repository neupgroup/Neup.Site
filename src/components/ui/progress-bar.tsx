'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    // Track clicks on all internal links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external links
      if (!href || href.startsWith('http')) return;

      // Ignore links meant to open in new tab
      if (targetAttr === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Ignore hash-only links (anchors on same page)
      const currentUrl = window.location.pathname + window.location.search;
      const newUrl = href.startsWith('#') ? currentUrl : href;

      if (newUrl === currentUrl) return;

      // Restart NProgress cleanly on each click
      NProgress.done(true); // clear any running one
      NProgress.start();
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // When the route actually changes, finish the progress bar
  useEffect(() => {
    NProgress.done();
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
