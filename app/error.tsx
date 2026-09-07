
'use client'

import { useEffect } from 'react';
import { Button } from '#/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '#/components/ui/card';
import { AlertTriangle } from 'lucide-react';


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Caught an error:', {
      message: error.message,
      name: error.name,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    Application Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    We're sorry, but something went wrong. Our team has been notified.
                </p>
            </CardContent>
            <CardFooter>
                <Button variant="solid" onClick={() => reset()}>Try again</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
