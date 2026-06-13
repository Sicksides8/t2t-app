import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme';

type Props = {
  value: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  gradientFromColor?: string;
  gradientToColor?: string;
  trackColor?: string;
  label?: string;
};

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  showPercentage = true,
  gradientFromColor = Colors.accentPrimary,
  gradientToColor = Colors.accentHighlight,
  trackColor = '#FFFFFF1F',
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = `pr-grad-${size}`;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={gradientFromColor} />
            <Stop offset="100%" stopColor={gradientToColor} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {showPercentage ? (
          <Text style={[styles.value, { fontSize: size * 0.22 }]}>
            {Math.round(clamped)}%
          </Text>
        ) : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
});
