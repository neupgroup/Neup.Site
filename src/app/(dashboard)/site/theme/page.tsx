
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSite, saveSite, type Site } from '@/actions/editor/site';
import { Skeleton } from '@/components/ui/skeleton';

export default function ThemePage() {
  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#64C5CF');
  const [accentColor, setAccentColor] = useState('#2A9D8F');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTheme = async () => {
        setLoading(true);
        const { site } = await getSite();
        if (site?.theme) {
            setPrimaryColor(site.theme.primary || '#64C5CF');
            setAccentColor(site.theme.accent || '#2A9D8F');
        }
        setLoading(false);
    };
    fetchTheme();
  }, []);

  const handleThemeModeChange = (newTheme: string) => {
    setThemeMode(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    toast({
        title: 'Theme Changed',
        description: `Switched to ${newTheme} mode.`
    })
  }

  const handleSaveTheme = async () => {
      setIsSaving(true);
      const result = await saveSite({
          theme: {
              primary: primaryColor,
              accent: accentColor,
          }
      });

      if (result.success) {
          toast({ title: 'Theme Saved', description: 'Your new colors have been applied.' });
          // Force a reload to apply the new CSS variables from the server
          window.location.reload();
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsSaving(false);
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Theme & Appearance</h1>
        <p className="text-muted-foreground">Customize the look and feel of your site and dashboard.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Choose the primary and accent colors for your site.</CardDescription>
        </CardHeader>
        <CardContent>
             {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary-color">Primary Color</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="primary-color" 
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                />
                                <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 p-1" />
                            </div>
                            <p className="text-xs text-muted-foreground">Used for main interactive elements like buttons.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accent-color">Accent Color</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="accent-color" 
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                />
                                <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 p-1" />
                            </div>
                             <p className="text-xs text-muted-foreground">Used for highlights and calls to action.</p>
                        </div>
                    </div>
                     <Button onClick={handleSaveTheme} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Colors
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance Mode</CardTitle>
          <CardDescription>Choose the look and feel of your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={themeMode} onValueChange={handleThemeModeChange}>
            <div className="flex items-center space-x-4">
              <Label htmlFor="light-theme" className="flex-1 p-4 border rounded-md cursor-pointer hover:border-primary has-[input:checked]:border-primary">
                <div className="flex items-center gap-4">
                    <Sun className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">Light Mode</p>
                        <p className="text-sm text-muted-foreground">For a bright and clean interface.</p>
                    </div>
                </div>
                <RadioGroupItem value="light" id="light-theme" className="sr-only" />
              </Label>
              <Label htmlFor="dark-theme" className="flex-1 p-4 border rounded-md cursor-pointer hover:border-primary has-[input:checked]:border-primary">
                <div className="flex items-center gap-4">
                    <Moon className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">For a focused, low-light experience.</p>
                    </div>
                </div>
                 <RadioGroupItem value="dark" id="dark-theme" className="sr-only" />
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
