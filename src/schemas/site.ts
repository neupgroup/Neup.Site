
import type { CanvasElementData } from '@/schemas/canvas';
import type { Path } from '@/actions/paths';

export interface GeneratedTheme {
    light: Record<string, string>;
    dark: Record<string, string>;
    black: Record<string, string>;
}

export interface SiteTheme {
    mode?: 'light' | 'dark' | 'black';
    colors: string[];
    radius?: 'none' | 'low' | 'medium' | 'high';
    generated?: GeneratedTheme;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  domains?: { value: string }[];
  tier: 'free' | 'premium';
  logoUrl?: string;
  hideSitename?: boolean;
  hideLogo?: boolean;
  description?: string;
  socialProfiles?: { platformName: string; url: string; }[];
  contactEmail?: { value: string; }[];
  contactPhone?: { value: string; }[];
  modules?: { [key: string]: any };
  theme?: SiteTheme;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Page {
  id: string;
  siteId: string;
  name: string;
  elements: CanvasElementData[];
  reactComponent?: string;
  type: 'editor' | 'ai' | 'html' | 'template';
  createdAt?: string | null;
  updatedAt?: string | null;
  paths?: Path[];
}

export interface PathStructure {
  path: string;
  pageId: string;
  sections: string[];
  theme: any; // Allow for theme overrides
  changesMade: boolean;
}

export interface Structure {
    id: string;
    siteId: string;
    structure: PathStructure[];
    status: 'deployed' | 'pendingDeployment';
    updatedAt?: string | null;
}

export interface Deployment {
    id: string;
    siteId: string;
    structure: PathStructure[];
    status: 'deployed' | 'cancelled';
    theme: SiteTheme;
    attemptedOn: string | null;
}
