'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inProgressRef = useRef(false);
  const targetRef = useRef<string | null>(null);
  const doneTimerRef = useRef<number | null>(null);

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleLinkClick = (e: MouseEvent) => {
      if (e.button && e.button !== 0) return; // only left click

      const target = e.target as HTMLElement;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (targetAttr === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const targetFull = `${url.pathname}${url.search}`;
      const currentFull = `${window.location.pathname}${window.location.search}`;
      if (href.startsWith('#') || targetFull === currentFull) return;

      // If NProgress is already running for a different target, reset to 0
      if (inProgressRef.current && targetRef.current !== targetFull) {
        NProgress.set(0); // instant reset to 0%
        targetRef.current = targetFull;
        NProgress.start();
      }

      // If not running, start normally
      if (!inProgressRef.current) {
        inProgressRef.current = true;
        targetRef.current = targetFull;
        NProgress.set(0.08);
        NProgress.start();
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  // Finish the progress bar on route change
  useEffect(() => {
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);

    doneTimerRef.current = window.setTimeout(() => {
      NProgress.done();
      inProgressRef.current = false;
      targetRef.current = null;
      doneTimerRef.current = null;
    }, 80); // slight debounce
  }, [pathname, searchParams]);

  return null;
}