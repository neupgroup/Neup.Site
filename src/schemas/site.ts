

import type { CanvasElementData } from '@/schemas/canvas';
import type { Path } from '@/actions/paths';
import type { Redirect } from '@/schemas/redirect';

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

export interface SiteIcons {
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouch?: string;
  android192?: string;
  android512?: string;
}

export interface ProxySetting {
    path: string;
    ip: string;
    port: string;
}

export interface DomainSetting {
  url?: string;
  forceHttps?: boolean;
  proxies?: ProxySetting[];
}

export interface Site {
  id: string;
  name: string;
  url: string;
  domains?: {
    production?: DomainSetting;
    development?: DomainSetting;
  },
  tier: 'free' | 'premium';
  logoUrl?: string;
  icons?: SiteIcons;
  hideSitename?: boolean;
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
  themeChanged: boolean;
  redirectsChanged: boolean;
  assetsChanged: boolean;
  updatedAt?: string | null;
}

export interface Deployment {
  id: string;
  siteId: string;
  structure: PathStructure[];
  status: 'deployed' | 'cancelled';
  theme: SiteTheme;
  redirects: Omit<Redirect, 'siteId'>[];
  siteProfile: { name: string, logoUrl?: string, hideSitename?: boolean };
  attemptedOn: string | null;
}
