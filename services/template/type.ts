
import type { CanvasElementData } from '@/services/canvas/type';

export interface Template {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  previewUrl?: string;
  category?: string;
  type: 'section' | 'page' | string;
  status: 'draft' | 'published';
  usableOn: ('json' | 'react')[];
  content: {
    json?: CanvasElementData[];
    react?: string;
  };
  createdBy: 'user' | 'system';
  createdAt: string | null;
}
