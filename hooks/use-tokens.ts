import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, ColorTokens, ThemeName } from '@/constants/theme';

/**
 * Single source of truth for theme-aware colors in a component.
 * `const { c } = useTokens();` then use c.surface, c.text, c.primary, etc.
 */
export function useTokens(): { c: ColorTokens; scheme: ThemeName } {
  const scheme = (useColorScheme() ?? 'light') as ThemeName;
  return { c: Colors[scheme], scheme };
}
