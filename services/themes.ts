import crypto from 'crypto';
import type { AssetTheme } from '@/services/asset/type';
import { generateThemeFromColor } from '#/core/helpers/color';

/*
::neup.documentation::theme-service

::public

Server-side theme defaults for newly created assets.

New assets receive a light theme, medium radius, and a generated color palette
based on a random primary color.

::public end
::end
*/

function createRandomHexColor(): string {
  return `#${crypto.randomInt(0, 0x1000000).toString(16).padStart(6, '0').toUpperCase()}`;
}

export function createDefaultAssetTheme(): AssetTheme {
  const colors = [createRandomHexColor()];

  return {
    mode: 'light',
    colors,
    radius: 'medium',
    spacing: 'comfortable',
    typography: 'modern',
    elevation: 'subtle',
    generated: generateThemeFromColor(colors),
  };
}
