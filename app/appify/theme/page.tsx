
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group';
import { Label } from '#/components/ui/label';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Sun, Moon, Loader2, Save, Plus, Trash2, Contrast } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { saveAsset } from '@/services/editor/asset';
import type { AssetTheme } from '@/services/asset/type';
import { Skeleton } from '#/components/ui/skeleton';
import { useProfile } from '@/inapp/context/ProfileContext';

const colorLabels = ['Primary', 'Accent', 'Tertiary'];

export default function ThemePage() {
  const { asset, setAsset, loading } = useProfile();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'black'>('light');
  const [colors, setColors] = useState<string[]>(['#64C5CF']);
  const [radius, setRadius] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [spacing, setSpacing] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [typography, setTypography] = useState<'modern' | 'classic' | 'technical'>('modern');
  const [elevation, setElevation] = useState<'flat' | 'subtle' | 'raised' | 'floating'>('subtle');

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && asset?.theme) {
      setThemeMode(asset.theme.mode || 'light');
      if (asset.theme.colors && asset.theme.colors.length > 0) {
        setColors(asset.theme.colors);
      }
      if (asset.theme.radius) {
        setRadius(asset.theme.radius);
      }
      if (asset.theme.spacing) {
        setSpacing(asset.theme.spacing);
      }
      if (asset.theme.typography) {
        setTypography(asset.theme.typography);
      }
      if (asset.theme.elevation) {
        setElevation(asset.theme.elevation);
      }
    } else if (!loading) {
      // Set default if no theme is loaded
      const storedTheme = document.documentElement.classList.contains('dark') ? 'dark' : (document.documentElement.classList.contains('black') ? 'black' : 'light');
      setThemeMode(storedTheme);
    }
  }, [loading, asset]);

  const handleThemeModeChange = (newTheme: 'light' | 'dark' | 'black') => {
    setThemeMode(newTheme);
    document.documentElement.classList.remove('light', 'dark', 'black');
    document.documentElement.classList.add(newTheme);
  }

  const handleSaveTheme = async () => {
    setIsSaving(true);
    const newTheme: AssetTheme = {
      ...asset?.theme,
      mode: themeMode,
      colors,
      radius,
      spacing,
      typography,
      elevation,
    };
    const result = await saveAsset({ theme: newTheme });

    if (result.success) {
      if (asset) {
        setAsset({ ...asset, theme: newTheme });
      }
      toast({ title: 'Theme Saved', description: 'Your new theme settings have been applied.' });
      // Force a reload to apply the new CSS variables from the server
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  }

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const addColor = () => {
    if (colors.length < 3) {
      setColors([...colors, '#2A9D8F']);
    }
  };

  const removeColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Theme & Appearance</h1>
        <p className="text-muted-foreground">Customize the look and feel of your asset and dashboard.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Choose the colors for your asset. The first is primary, the second is accent, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              {colors.map((color, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`color-${index}`}>{colorLabels[index]} Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`color-${index}`}
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                      />
                      <Input type="color" value={color} onChange={(e) => handleColorChange(index, e.target.value)} className="w-12 p-1" />
                    </div>
                  </div>
                  {colors.length > 1 && (
                    <Button
                      variant="solid" convey="danger"
                      size="sm"
                      onClick={() => removeColor(index)}
                      className="w-fit"
                    >
                      <Trash2 className="mr-2" /> Remove
                    </Button>
                  )}
                </div>
              ))}
              {colors.length < 3 && (
                <Button variant="outlined" onClick={addColor}>
                  <Plus className="mr-2" /> Add Color
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spacing</CardTitle>
          <CardDescription>Choose how much space to use between elements and sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={spacing} onValueChange={(value) => setSpacing(value as typeof spacing)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Label htmlFor="spacing-compact" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="w-12 h-8 bg-muted p-1 mx-auto mb-2">
                  <div className="h-full bg-primary" />
                </div>
                Compact
                <RadioGroupItem value="compact" id="spacing-compact" className="sr-only" />
              </Label>
              <Label htmlFor="spacing-comfortable" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="w-12 h-8 bg-muted p-2 mx-auto mb-2">
                  <div className="h-full bg-primary" />
                </div>
                Comfortable
                <RadioGroupItem value="comfortable" id="spacing-comfortable" className="sr-only" />
              </Label>
              <Label htmlFor="spacing-spacious" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="w-12 h-8 bg-muted p-3 mx-auto mb-2">
                  <div className="h-full bg-primary" />
                </div>
                Spacious
                <RadioGroupItem value="spacious" id="spacing-spacious" className="sr-only" />
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>Adjust the roundness of components like buttons and cards.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <RadioGroup value={radius} onValueChange={(value) => setRadius(value as any)}>
              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="radius-none" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                  <div className="w-12 h-8 bg-muted rounded-none mx-auto mb-2"></div>
                  None
                  <RadioGroupItem value="none" id="radius-none" className="sr-only" />
                </Label>
                <Label htmlFor="radius-low" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                  <div className="w-12 h-8 bg-muted rounded-sm mx-auto mb-2"></div>
                  Low
                  <RadioGroupItem value="low" id="radius-low" className="sr-only" />
                </Label>
                <Label htmlFor="radius-medium" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                  <div className="w-12 h-8 bg-muted rounded-md mx-auto mb-2"></div>
                  Medium
                  <RadioGroupItem value="medium" id="radius-medium" className="sr-only" />
                </Label>
                <Label htmlFor="radius-high" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                  <div className="w-12 h-8 bg-muted rounded-full mx-auto mb-2"></div>
                  High
                  <RadioGroupItem value="high" id="radius-high" className="sr-only" />
                </Label>
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance Mode</CardTitle>
          <CardDescription>Choose the look and feel of your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={themeMode} onValueChange={(v) => handleThemeModeChange(v as any)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Label htmlFor="light-theme" className="flex-1 p-4 border rounded-md cursor-pointer hover:border-primary has-[[data-state=checked]]:border-primary">
                <div className="flex items-center gap-4">
                  <Sun className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Light Mode</p>
                  </div>
                </div>
                <RadioGroupItem value="light" id="light-theme" className="sr-only" />
              </Label>
              <Label htmlFor="dark-theme" className="flex-1 p-4 border rounded-md cursor-pointer hover:border-primary has-[[data-state=checked]]:border-primary">
                <div className="flex items-center gap-4">
                  <Moon className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Dark Mode</p>
                  </div>
                </div>
                <RadioGroupItem value="dark" id="dark-theme" className="sr-only" />
              </Label>
              <Label htmlFor="black-theme" className="flex-1 p-4 border rounded-md cursor-pointer hover:border-primary has-[[data-state=checked]]:border-primary">
                <div className="flex items-center gap-4">
                  <Contrast className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Black Mode</p>
                  </div>
                </div>
                <RadioGroupItem value="black" id="black-theme" className="sr-only" />
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Choose the font style used throughout your asset.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={typography} onValueChange={(value) => setTypography(value as typeof typography)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Label htmlFor="typography-modern" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary">
                <p className="text-lg font-semibold">Modern</p>
                <p className="text-sm text-muted-foreground">Clean and friendly</p>
                <RadioGroupItem value="modern" id="typography-modern" className="sr-only" />
              </Label>
              <Label htmlFor="typography-classic" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary font-serif">
                <p className="text-lg font-semibold">Classic</p>
                <p className="text-sm text-muted-foreground">Editorial and timeless</p>
                <RadioGroupItem value="classic" id="typography-classic" className="sr-only" />
              </Label>
              <Label htmlFor="typography-technical" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary font-mono">
                <p className="text-lg font-semibold">Technical</p>
                <p className="text-sm text-muted-foreground">Precise and structured</p>
                <RadioGroupItem value="technical" id="typography-technical" className="sr-only" />
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="w-fit max-w-full">
        <CardHeader>
          <CardTitle>Elevation &amp; Shadow</CardTitle>
          <CardDescription>Control how much depth and shadow your components use.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={elevation} onValueChange={(value) => setElevation(value as typeof elevation)}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Label htmlFor="elevation-flat" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="h-10 w-16 bg-card border mx-auto mb-2" />
                Flat
                <RadioGroupItem value="flat" id="elevation-flat" className="sr-only" />
              </Label>
              <Label htmlFor="elevation-subtle" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="h-10 w-16 bg-card border shadow-sm mx-auto mb-2" />
                Subtle
                <RadioGroupItem value="subtle" id="elevation-subtle" className="sr-only" />
              </Label>
              <Label htmlFor="elevation-raised" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="h-10 w-16 bg-card border shadow-md mx-auto mb-2" />
                Raised
                <RadioGroupItem value="raised" id="elevation-raised" className="sr-only" />
              </Label>
              <Label htmlFor="elevation-floating" className="p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary hover:border-primary text-center">
                <div className="h-10 w-16 bg-card border shadow-xl mx-auto mb-2" />
                Floating
                <RadioGroupItem value="floating" id="elevation-floating" className="sr-only" />
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="solid" onClick={handleSaveTheme} disabled={isSaving || loading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Theme
        </Button>
      </div>
    </div>
  );
}
