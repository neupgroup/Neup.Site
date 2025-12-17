
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FileUploader } from '@/components/ui/file-uploader';
import { useProfile } from '@/context/ProfileContext';
import { saveSite, type Site } from '@/actions/editor/site';
import { useToast } from '@/hooks/use-toast';

export default function LogoUploadPage() {
  const { site, setSite } = useProfile();
  const { toast } = useToast();

  const handleUploadSuccess = async (logoUrl: string) => {
    const result = await saveSite({ logoUrl });
    if (result.success) {
      if (site) {
        setSite({ ...site, logoUrl });
      }
      toast({ title: "Logo Updated", description: "Your new site logo has been saved." });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };
  
  const iconUploads = [
    { label: 'Favicon (favicon.ico)', path: '/favicon.ico', acceptedTypes: 'image/x-icon' },
    { label: 'Apple Touch Icon (apple-touch-icon.png)', path: '/apple-touch-icon.png', acceptedTypes: 'image/png' },
    { label: 'Favicon 16x16 (favicon-16x16.png)', path: '/favicon-16x16.png', acceptedTypes: 'image/png' },
    { label: 'Favicon 32x32 (favicon-32x32.png)', path: '/favicon-32x32.png', acceptedTypes: 'image/png' },
    { label: 'Android Chrome 192x192', path: '/android-chrome-192x192.png', acceptedTypes: 'image/png' },
    { label: 'Android Chrome 512x512', path: '/android-chrome-512x512.png', acceptedTypes: 'image/png' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Logos & Icons</h1>
            <p className="text-muted-foreground">Upload your site's branding assets.</p>
        </div>
        <Button variant="ghost" asChild>
            <Link href="/profile">
                <ArrowLeft className="mr-2" /> Back to Profile
            </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Site Logo</CardTitle>
          <CardDescription>
            Upload your main site logo. This will be displayed in the header.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <FileUploader 
                uploadPath="/logo.png"
                acceptedFileTypes="image/*"
                onUploadSuccess={handleUploadSuccess}
                currentImageUrl={site?.logoUrl}
            />
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Site Icons</CardTitle>
          <CardDescription>
            Upload the necessary favicons. Each uploader accepts a single file. Dropping a new file will overwrite the existing one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {iconUploads.map(upload => (
                <div key={upload.path} className="p-4 border rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">{upload.label}</h3>
                    <FileUploader 
                        uploadPath={upload.path}
                        acceptedFileTypes={upload.acceptedTypes}
                    />
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
