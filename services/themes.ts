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

export function createDefaultAssetTheme(): AssetTheme {
  // Keep the fallback stable across requests so an empty design does not
  // change the site's appearance on every refresh.
  const colors = ['#64C5CF'];

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
