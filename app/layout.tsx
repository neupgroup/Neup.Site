
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Suspense } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { getAsset } from '@/services/editor/asset';
import { cn } from '@/core/utils';
import type { Asset } from '@/services/asset/type';


export const metadata: Metadata = {
  description: 'Visually build your website.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { asset } = await getAsset();
  const radius = asset?.theme?.radius;
  const radiusClass = radius ? `radius-${radius}` : 'radius-medium';
  const themeMode = asset?.theme?.mode || 'light';
  const generatedTheme = asset?.theme?.generated;
  const renderThemeStyles = !!(generatedTheme && generatedTheme.light && generatedTheme.dark && generatedTheme.black);

  const themeStyleString = renderThemeStyles ? `
    :root {
        --background: ${generatedTheme.light.background};
        --foreground: ${generatedTheme.light.foreground};
        --card: ${generatedTheme.light.card};
        --card-foreground: ${generatedTheme.light.cardForeground};
        --popover: ${generatedTheme.light.popover};
        --popover-foreground: ${generatedTheme.light.popoverForeground};
        --primary: ${generatedTheme.light.primary};
        --primary-foreground: ${generatedTheme.light.primaryForeground};
        --secondary: ${generatedTheme.light.secondary};
        --secondary-foreground: ${generatedTheme.light.secondaryForeground};
        --muted: ${generatedTheme.light.muted};
        --muted-foreground: ${generatedTheme.light.mutedForeground};
        --accent: ${generatedTheme.light.accent};
        --accent-foreground: ${generatedTheme.light.accentForeground};
        --destructive: ${generatedTheme.light.destructive};
        --destructive-foreground: ${generatedTheme.light.destructiveForeground};
        --border: ${generatedTheme.light.border};
        --input: ${generatedTheme.light.input};
        --ring: ${generatedTheme.light.ring};
        --sidebar-accent: ${generatedTheme.light.sidebarAccent};
        --sidebar-accent-foreground: ${generatedTheme.light.sidebarAccentForeground};
    }
    .dark {
        --background: ${generatedTheme.dark.background};
        --foreground: ${generatedTheme.dark.foreground};
        --card: ${generatedTheme.dark.card};
        --card-foreground: ${generatedTheme.dark.cardForeground};
        --popover: ${generatedTheme.dark.popover};
        --popover-foreground: ${generatedTheme.dark.popoverForeground};
        --primary: ${generatedTheme.dark.primary};
        --primary-foreground: ${generatedTheme.dark.primaryForeground};
        --secondary: ${generatedTheme.dark.secondary};
        --secondary-foreground: ${generatedTheme.dark.secondaryForeground};
        --muted: ${generatedTheme.dark.muted};
        --muted-foreground: ${generatedTheme.dark.mutedForeground};
        --accent: ${generatedTheme.dark.accent};
        --accent-foreground: ${generatedTheme.dark.accentForeground};
        --destructive: ${generatedTheme.dark.destructive};
        --destructive-foreground: ${generatedTheme.dark.destructiveForeground};
        --border: ${generatedTheme.dark.border};
        --input: ${generatedTheme.dark.input};
        --ring: ${generatedTheme.dark.ring};
        --sidebar-accent: ${generatedTheme.dark.sidebarAccent};
        --sidebar-accent-foreground: ${generatedTheme.dark.sidebarAccentForeground};
    }
    .black {
        --background: ${generatedTheme.black.background};
        --foreground: ${generatedTheme.black.foreground};
        --card: ${generatedTheme.black.card};
        --card-foreground: ${generatedTheme.black.cardForeground};
        --popover: ${generatedTheme.black.popover};
        --popover-foreground: ${generatedTheme.black.popoverForeground};
        --primary: ${generatedTheme.black.primary};
        --primary-foreground: ${generatedTheme.black.primaryForeground};
        --secondary: ${generatedTheme.black.secondary};
        --secondary-foreground: ${generatedTheme.black.secondaryForeground};
        --muted: ${generatedTheme.black.muted};
        --muted-foreground: ${generatedTheme.black.mutedForeground};
        --accent: ${generatedTheme.black.accent};
        --accent-foreground: ${generatedTheme.black.accentForeground};
        --destructive: ${generatedTheme.black.destructive};
        --destructive-foreground: ${generatedTheme.black.destructiveForeground};
        --border: ${generatedTheme.black.border};
        --input: ${generatedTheme.black.input};
        --ring: ${generatedTheme.black.ring};
        --sidebar-accent: ${generatedTheme.black.sidebarAccent};
        --sidebar-accent-foreground: ${generatedTheme.black.sidebarAccentForeground};
    }
  ` : '';

  return (
    <html lang="en" suppressHydrationWarning className={cn(radiusClass, themeMode)}>
      <head>
        {renderThemeStyles && (
          <style dangerouslySetInnerHTML={{ __html: themeStyleString }} />
        )}
      </head>
      <body className={cn("font-body antialiased")}>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
