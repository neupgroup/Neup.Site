
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FileUploader } from '@/components/ui/file-uploader';
import { useProfile } from '@/inapp/context/profilecontext';
import { saveAsset } from '@/services/editor/asset';
import type { Asset, AssetIcons } from '@/schemas/asset';
import { useToast } from '@/core/hooks/use-toast';

export default function LogoUploadPage() {
  const { asset, setAsset } = useProfile();
  const { toast } = useToast();

  const handleUploadSuccess = async (iconType: keyof AssetIcons, url: string) => {
    const newIcons = { ...asset?.icons, [iconType]: url };
    const result = await saveAsset({ icons: newIcons });

    if (result.success) {
      if (asset) {
        setAsset({ ...asset, icons: newIcons });
      }
      toast({ title: "Icon Updated", description: "Your new asset icon has been saved." });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };
  
  const handleLogoUploadSuccess = async (logoUrl: string) => {
    const result = await saveAsset({ logoUrl });
    if (result.success) {
      if (asset) {
        setAsset({ ...asset, logoUrl });
      }
      toast({ title: "Logo Updated", description: "Your new asset logo has been saved." });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };

  const iconUploads: { label: string; path: string; acceptedTypes: string; iconKey: keyof AssetIcons }[] = [
    { label: 'Favicon (favicon.ico)', path: '/favicon.ico', acceptedTypes: 'image/x-icon', iconKey: 'favicon' },
    { label: 'Apple Touch Icon (apple-touch-icon.png)', path: '/apple-touch-icon.png', acceptedTypes: 'image/png', iconKey: 'appleTouch' },
    { label: 'Favicon 16x16 (favicon-16x16.png)', path: '/favicon-16x16.png', acceptedTypes: 'image/png', iconKey: 'favicon16' },
    { label: 'Favicon 32x32 (favicon-32x32.png)', path: '/favicon-32x32.png', acceptedTypes: 'image/png', iconKey: 'favicon32' },
    { label: 'Android Chrome 192x192', path: '/android-chrome-192x192.png', acceptedTypes: 'image/png', iconKey: 'android192' },
    { label: 'Android Chrome 512x512', path: '/android-chrome-512x512.png', acceptedTypes: 'image/png', iconKey: 'android512' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <Button variant="tertiary" asChild>
            <Link href="/settings/profile">
                <ArrowLeft className="mr-2" /> Back to Profile
            </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Asset Logo</CardTitle>
          <CardDescription>
            Upload your main asset logo. This will be displayed in the header.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <FileUploader 
                uploadPath="/logo.png"
                acceptedFileTypes="image/*"
                onUploadSuccess={handleLogoUploadSuccess}
                currentImageUrl={asset?.logoUrl}
            />
        </CardContent>
      </Card>
      
      {iconUploads.map(upload => (
        <Card key={upload.iconKey}>
          <CardHeader>
            <CardTitle>{upload.label}</CardTitle>
            <CardDescription>
              Upload a file for {upload.label}. It will overwrite any existing file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              uploadPath={upload.path}
              acceptedFileTypes={upload.acceptedTypes}
              onUploadSuccess={(url) => handleUploadSuccess(upload.iconKey, url)}
              currentImageUrl={asset?.icons?.[upload.iconKey]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
