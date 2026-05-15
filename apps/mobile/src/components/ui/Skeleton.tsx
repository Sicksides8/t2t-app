import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

type Props = {
  height?: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
};

export function Skeleton({ height = 16, width = '100%', style }: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { height, width: width as number, opacity },
        style,
      ]}
    />
  );
}

export function CourseListSkeleton() {
  return (
    <View style={styles.list}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton height={50} width={50} style={styles.round} />
          <View style={styles.lines}>
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="50%" style={{ marginTop: Spacing.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.chip,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  round: {
    borderRadius: 25,
  },
  lines: {
    flex: 1,
  },
});
