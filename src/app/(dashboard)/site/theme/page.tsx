
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ThemePage() {
  const [theme, setTheme] = useState('light');
  const { toast } = useToast();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    toast({
        title: 'Theme Changed',
        description: `Switched to ${newTheme} mode.`
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Theme & Appearance</h1>
        <p className="text-muted-foreground">Customize the look and feel of your site and dashboard.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose the look and feel of your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange}>
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
