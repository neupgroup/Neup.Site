
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Sun, Moon, Save, Twitter, Github, Linkedin, Mail, Phone } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export default function ProfilePage() {
  const { profileName, setProfileName } = useProfile();
  const [theme, setTheme] = useState('light');
  const [description, setDescription] = useState('Your Site Description');
  const [logoUrl, setLogoUrl] = useState('');

  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = (section: string) => {
    // In a real app, you'd call a server action here to save the data.
    toast({
      title: `${section} Saved`,
      description: `Your ${section.toLowerCase()} information has been updated.`,
    });
  };

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
        <h1 className="text-3xl font-bold font-headline">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your site's appearance and basic information.</p>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>This information may be used across your site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input id="logo-url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSave('Profile')}>
            <Save className="mr-2" /> Save Profile
          </Button>
        </CardFooter>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Social Profiles</CardTitle>
          <CardDescription>Links to your social media accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <div className="flex items-center gap-2">
                <Twitter className="text-muted-foreground" />
                <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username" />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
             <div className="flex items-center gap-2">
                <Github className="text-muted-foreground" />
                <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <div className="flex items-center gap-2">
                <Linkedin className="text-muted-foreground" />
                <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSave('Social Profiles')}>
            <Save className="mr-2" /> Save Social Profiles
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How people can get in touch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground" />
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSave('Contact Information')}>
            <Save className="mr-2" /> Save Contact Info
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
