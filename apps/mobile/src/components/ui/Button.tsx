import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (state.pressed || disabled) && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[Colors.accentPrimary, Colors.accentSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
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
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
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
  },
  pressed: {
    opacity: 0.72,
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
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
