import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (state.pressed || disabled) && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? Colors.textPrimary : variant === 'outline' ? Colors.bgPrimary : Colors.accentPrimary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.secondaryText,
            variant === 'outline' && styles.outlineText,
            variant === 'ghost' && styles.ghostText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 18,
    minHeight: 60,
    borderRadius: Radius.pill,
  },
  primary: {
    backgroundColor: Colors.accentPrimary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.transparent,
  },
  outline: {
    backgroundColor: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  ghost: {
    backgroundColor: Colors.transparent,
    minHeight: 44,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    color: Colors.accentPrimary,
  },
  outlineText: {
    color: Colors.bgPrimary,
  },
  ghostText: {
    color: Colors.textSecondary,
  },
});
