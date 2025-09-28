import type { CanvasElementData } from '@/lib/schemas';
import { button } from './button';
import { container } from './container';
import { div } from './div';
import { form } from './form';
import { heading } from './heading';
import { html } from './html';
import { image } from './image';
import { input } from './input';
import { label } from './label';
import { list } from './list';
import { listItem } from './list-item';
import { section } from './section';
import { text } from './text';
import { textarea } from './textarea';
import { video } from './video';

export const elementDefinitions: { [key in CanvasElementData['type']]: Omit<CanvasElementData, 'id'> } = {
    button,
    container,
    div,
    form,
    heading,
    html,
    image,
    input,
    label,
    list,
    'list-item': listItem,
    section,
    text,
    textarea,
    video,
};
