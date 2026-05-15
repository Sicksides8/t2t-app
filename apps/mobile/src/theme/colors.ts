export const Colors = {
  accentHighlight: '#4CC35B',
  accentPrimary: '#B73CEF',
  accentSecondary: '#4CC35B',
  accentTertiary: '#25BFA5',
  bgElevated: '#2A1052',
  bgPrimary: '#1D083A',
  bgSurface: '#3A1B6E',
  divider: '#FFFFFF14',
  error: '#FF5C7A',
  glass: '#FFFFFF0F',
  heroGradEnd: '#B73CEF',
  heroGradMid: '#3A1268',
  heroGradStart: '#1D083A',
  textPrimary: '#FFFFFF',
  textSecondary: '#FFFFFFB3',
  textTertiary: '#FFFFFF73',
  warning: '#FFB547',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
