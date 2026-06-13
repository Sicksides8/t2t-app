import type { TextStyle } from 'react-native';

/**
 * Tokens tipográficos. Cada token apunta directamente a la variant exacta de
 * Poppins (sin depender de `fontWeight`) para evitar el fake-bold en Android
 * y asegurar que cada peso se renderice con el archivo correcto cargado en
 * `useAppFonts`.
 */
export const Typography = {
  hero: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    lineHeight: 43,
  } satisfies TextStyle,
  h1: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    lineHeight: 36,
  } satisfies TextStyle,
  h2: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    lineHeight: 30,
  } satisfies TextStyle,
  body: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  script: {
    fontFamily: 'Caveat',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  } satisfies TextStyle,
  handwritten: {
    fontFamily: 'DreamingOutloud',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
  } satisfies TextStyle,
} as const;
