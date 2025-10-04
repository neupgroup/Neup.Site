
import type { CanvasElementData } from '@/schemas/canvas';

export interface Site {
  id: string;
  name: string;
  url: string;
  tier: 'free' | 'premium';
  logoUrl?: string;
  hideSitename?: boolean;
  description?: string;
  socialProfiles?: { platformName: string; url: string; }[];
  contactEmail?: { value: string; }[];
  contactPhone?: { value: string; }[];
  modules?: { [key: string]: any };
  theme?: {
    primary?: string;
    accent?: string;
  };
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
}
