import type { TextStyle } from 'react-native';

const fontFamily = 'Poppins';

export const Typography = {
  hero: {
    fontFamily,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '700',
  } satisfies TextStyle,
  h1: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  } satisfies TextStyle,
  h2: {
    fontFamily,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
  } satisfies TextStyle,
  body: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  } satisfies TextStyle,
  caption: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } satisfies TextStyle,
  script: {
    fontFamily: 'Caveat',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  } satisfies TextStyle,
} as const;
