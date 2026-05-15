import type { ViewStyle } from 'react-native';

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  } satisfies ViewStyle,
  glow: {
    shadowColor: '#B73CEF',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  } satisfies ViewStyle,
} as const;
