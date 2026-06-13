import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import {
  DIAGNOSTIC_SKILLS,
  SKILL_LABELS_SHORT,
  type DiagnosticSkillId,
} from '../../data/diagnostic';
import { bucketSkill } from '../../utils/diagnosticBuckets';
import {
  axisLine,
  buildRadarPoints,
  gridRingPoints,
  labelPosition,
  type RadarPointInput,
} from '../../utils/radarChart';
import { Colors } from '../../theme';

const DEFAULT_SIZE = 280;
const DEFAULT_MAX_R = 95;

export type RadarLevel = 'strong' | 'developing' | 'toTrain';

export type RadarAxis = {
  key: string;
  label: string;
  value: number;
  level: RadarLevel;
};

type Props = {
  /** Lista explícita de ejes con su nivel. Si se provee, tiene precedencia. */
  axes?: RadarAxis[];
  /** Map legacy: `scores[skillId] => 0..100`. Usa DIAGNOSTIC_SKILLS como ejes. */
  scores?: Record<string, number>;
  /** Polígono comparativo "antes" (gris claro), opcional. */
  previousScores?: Record<string, number>;
  size?: number;
  maxRadius?: number;
};

function colorForLevel(level: RadarLevel): string {
  if (level === 'strong') return Colors.accentHighlight;
  if (level === 'toTrain') return Colors.warning;
  return Colors.accentPrimary;
}

function bucketToLevel(score: number): RadarLevel {
  const bucket = bucketSkill(score);
  if (bucket === 'strength') return 'strong';
  if (bucket === 'train') return 'toTrain';
  return 'developing';
}

function buildAxesFromScores(scores: Record<string, number>): RadarAxis[] {
  return DIAGNOSTIC_SKILLS.map((skillId) => {
    const value = scores[skillId] ?? 0;
    return {
      key: skillId,
      label: SKILL_LABELS_SHORT[skillId as DiagnosticSkillId] ?? skillId,
      value,
      level: bucketToLevel(value),
    };
  });
}

export function DiagnosticRadarChart({
  axes,
  scores,
  previousScores,
  size = DEFAULT_SIZE,
  maxRadius = DEFAULT_MAX_R,
}: Props) {
  const resolvedAxes: RadarAxis[] = useMemo(() => {
    if (axes && axes.length > 0) return axes;
    if (scores) return buildAxesFromScores(scores);
    return [];
  }, [axes, scores]);

  const dataPoints = useMemo(
    () =>
      buildRadarPoints(
        resolvedAxes.map<RadarPointInput>((axis) => ({
          key: axis.key,
          label: axis.label,
          value: axis.value,
        })),
        size,
        maxRadius,
      ),
    [resolvedAxes, size, maxRadius],
  );

  const previousPoints = useMemo(() => {
    if (!previousScores) return [] as Array<{ x: number; y: number }>;
    return buildRadarPoints(
      resolvedAxes.map<RadarPointInput>((axis) => ({
        key: axis.key,
        label: axis.label,
        value: previousScores[axis.key] ?? 0,
      })),
      size,
      maxRadius,
    );
  }, [previousScores, resolvedAxes, size, maxRadius]);

  const previousPolygonPoints = useMemo(
    () => previousPoints.map((p) => `${p.x},${p.y}`).join(' '),
    [previousPoints],
  );

  const axisCount = resolvedAxes.length;

  const gridRings = useMemo(
    () =>
      [1, 2, 3].map((level) =>
        gridRingPoints(axisCount, size, maxRadius, level),
      ),
    [axisCount, size, maxRadius],
  );

  const dataPolygonPoints = useMemo(
    () => dataPoints.map((p) => `${p.x},${p.y}`).join(' '),
    [dataPoints],
  );

  if (axisCount === 0) {
    return <View style={[styles.wrap, { width: size, height: size }]} />;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.chart}>
        {/* Grid concentric rings */}
        {gridRings.map((points, i) => (
          <Polygon
            key={`ring-${i}`}
            points={points}
            fill="none"
            stroke="#FFFFFF26"
            strokeWidth={1}
          />
        ))}
        {/* Axes (radii) */}
        {resolvedAxes.map((axis, i) => {
          const line = axisLine(axisCount, size, maxRadius, i);
          return (
            <Line
              key={`axis-${axis.key}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#FFFFFF26"
              strokeWidth={0.5}
            />
          );
        })}
        {/* Previous polygon (gris) si existe */}
        {previousPoints.length > 0 ? (
          <Polygon
            points={previousPolygonPoints}
            fill="#FFFFFF22"
            stroke="#FFFFFF66"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ) : null}
        {/* Filled data polygon */}
        <Polygon
          points={dataPolygonPoints}
          fill={previousPoints.length > 0 ? `${Colors.accentHighlight}4D` : '#B73CEF66'}
          stroke={previousPoints.length > 0 ? Colors.accentHighlight : Colors.accentPrimary}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Vertex dots colored by level */}
        {dataPoints.map((p, i) => (
          <Circle
            key={`dot-${resolvedAxes[i].key}`}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill={colorForLevel(resolvedAxes[i].level)}
          />
        ))}
      </Svg>
      {resolvedAxes.map((axis, i) => {
        const offset = axisCount > 8 ? 18 : 22;
        const pos = labelPosition(axisCount, size, maxRadius, i, offset);
        const color = colorForLevel(axis.level);
        const labelWidth = axisCount > 8 ? 60 : 72;
        const fontSize = axisCount > 8 ? 8 : 9;
        const maxChars = axisCount > 8 ? 10 : 12;
        const label =
          axis.label.length > maxChars ? `${axis.label.slice(0, maxChars - 1)}…` : axis.label;
        return (
          <Text
            key={axis.key}
            style={[
              styles.label,
              {
                left: pos.x - labelWidth / 2,
                top: pos.y - 8,
                width: labelWidth,
                color,
                fontSize,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  chart: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    position: 'absolute',
    fontWeight: '600',
    textAlign: 'center',
  },
});
