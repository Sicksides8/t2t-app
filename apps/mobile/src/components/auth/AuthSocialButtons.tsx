import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../ui';

type Props = {
  onGoogle: () => void;
  onApple?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/** Botones sociales Penpot 32/33 (Apple vía Firebase OAuth, sin expo-apple-authentication). */
export function AuthSocialButtons({ onGoogle, onApple, disabled, loading }: Props) {
  return (
    <View style={styles.wrap}>
      <Button title="Continuar con Google" variant="outline" disabled={disabled || loading} onPress={onGoogle} />
      {onApple ? (
        <Button title="Continuar con Apple" variant="outline" disabled={disabled || loading} onPress={onApple} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
});
