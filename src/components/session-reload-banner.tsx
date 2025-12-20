'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateLastFetch } from '@/lib/session-manager';

interface SessionReloadBannerProps {
    show: boolean;
    onReload?: () => void;
}

export function SessionReloadBanner({ show, onReload }: SessionReloadBannerProps) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
    }, [show]);

    if (!visible) return null;

    const handleReload = () => {
        // Update lastFetch in both cookies and sessionStorage
        updateLastFetch();

        if (onReload) {
            onReload();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-md overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                Session Updated
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Your session data has been updated. Please reload to see the latest changes.
                            </p>
                            <Button
                                onClick={handleReload}
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
