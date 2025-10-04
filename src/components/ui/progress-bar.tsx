'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // This effect should run only once on mount to set up the configuration
    NProgress.configure({ showSpinner: false });

    // This is the cleanup function that will be called when the component unmounts.
    return () => {
      // Although NProgress.done() is called on route changes,
      // it's good practice to ensure it's cleaned up on unmount as well.
      NProgress.done();
    };
  }, []);

  // We are not rendering anything from this component. It's just for handling the side effects.
  // A component can't return a `useEffect` directly. It must return a valid React node, `null` in this case.
  return null;
}
