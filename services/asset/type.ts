

import type { CanvasElementData } from '@/services/canvas/type';
import type { Path } from '@/services/paths';
import type { Redirect } from '@/services/redirect/type';
import type { EnvironmentVariable } from '@/services/environment/type';

export interface GeneratedTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
  black: Record<string, string>;
}

export interface AssetTheme {
  mode?: 'light' | 'dark' | 'black';
  colors: string[];
  radius?: 'none' | 'low' | 'medium' | 'high';
  generated?: GeneratedTheme;
}

export interface AssetIcons {
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
  ignoredPaths?: string[];
}

export interface Asset {
  id: string;
  name: string;
  url?: string;
  domainSettings?: {
    production?: DomainSetting;
    development?: DomainSetting;
  };
  domains?: {
    production?: DomainSetting;
    development?: DomainSetting;
  },
  tier: 'free' | 'premium';
  logoUrl?: string;
  icons?: AssetIcons;
  hideSitename?: boolean;
  hideLogo?: boolean;
  description?: string;
  socialProfiles?: { platformName: string; url: string; }[];
  contactEmail?: { value: string; }[];
  contactPhone?: { value: string; }[];
  modules?: { [key: string]: any };
  theme?: Partial<AssetTheme>;
  ownerAccountId?: string;
  status?: string;
  type?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Page {
  id: string;
  assetId: string;
  name: string;
  description?: string | null;
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
  assetId: string;
  structure: PathStructure[];
  status: 'deployed' | 'pendingDeployment';
  themeChanged: boolean;
  redirectsChanged: boolean;
  assetsChanged: boolean;
  appBaseChanged: boolean;
  environmentsChanged: boolean;
  updatedAt?: string | null;
}

export interface Deployment {
  id: string;
  assetId: string;
  structure: PathStructure[];
  status: 'deployed' | 'cancelled';
  theme: AssetTheme;
  redirects: Omit<Redirect, 'assetId'>[];
  siteProfile: { name: string, logoUrl?: string, hideSitename?: boolean, hideLogo?: boolean };
  environments: EnvironmentVariable[];
  attemptedOn: string | null;
}
