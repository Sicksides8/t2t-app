import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '../../theme';

type Props = {
  onGoogle: () => void;
  onApple?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/** Botones sociales Penpot 36/37 — variante glass dark (no outline blanco). */
export function AuthSocialButtons({ onGoogle, onApple, disabled, loading }: Props) {
  return (
    <View style={styles.wrap}>
      <SocialButton
        icon="globe-outline"
        label="Continuar con Google"
        onPress={onGoogle}
        disabled={disabled || loading}
        loading={loading}
      />
      {onApple ? (
        <SocialButton
          icon="logo-apple"
          label="Continuar con Apple"
          onPress={onApple}
          disabled={disabled || loading}
        />
      ) : null}
    </View>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
  disabled,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, (pressed || disabled) && styles.btnPressed]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <>
          <Ionicons name={icon} size={18} color={Colors.textPrimary} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF12',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    paddingHorizontal: 20,
  },
  btnPressed: {
    opacity: 0.78,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
