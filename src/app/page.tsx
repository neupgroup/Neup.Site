'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    }

    const isLoggedIn = getCookie('isLoggedIn') === 'true';

    if (isLoggedIn) {
        router.replace('/site/editor');
    } else {
        router.replace('/landing');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <p>Redirecting...</p>
    </div>
  );
}
