
'use client'

import { useEffect } from 'react';
import { logger } from '@/logica/logger';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const logError = async () => {
        console.error("Caught an error:", error);
        try {
            await logger.error({
                message: error.message,
                stack: error.stack,
                source: 'global-error-boundary',
            });
            await logger.type('info').log({
                message: 'Global error boundary reported an application error.',
                source: 'global-error-boundary',
                digest: error.digest,
                name: error.name,
            });
        } catch (loggingError) {
            console.error("Failed to log error using Logica logger:", loggingError);
        }
    };
    
    logError();
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
                <Button variant="primary" onClick={() => reset()}>Try again</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
