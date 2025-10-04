
import type { CanvasElementData } from './canvas';

export interface Template {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  previewUrl?: string;
  category?: string;
  type: 'section' | 'page' | string;
  usableOn: ('json' | 'html")[];
  elements: CanvasElementData[];
  reactComponent?: string;
  createdBy: 'user' | 'system';
  createdAt: string | null;
}
