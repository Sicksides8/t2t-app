import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Colors, Spacing, Typography } from '../theme';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Sin conexión — algunos datos pueden estar desactualizados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  text: {
    ...Typography.caption,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
});
