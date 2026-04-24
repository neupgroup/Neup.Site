
'use client'

import { useEffect } from 'react';
import { logErrorToDatabase } from '@/lib/logging';
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
            await logErrorToDatabase({
                message: error.message,
                stack: error.stack,
                source: 'global-error-boundary',
            });
            console.log("Error logged to Firestore via server action.");
        } catch (loggingError) {
            console.error("Failed to log error using server action:", loggingError);
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
                <Button onClick={() => reset()}>Try again</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
