import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DIAGNOSTIC_SKILLS } from '../../data/diagnostic';
import { bucketSkill } from '../../utils/diagnosticBuckets';
import { axisLine, buildRadarPoints, gridRingPoints, labelPosition } from '../../utils/radarChart';
import { Colors } from '../../theme';

const SIZE = 280;
const MAX_R = 95;
const CX = SIZE / 2;
const CY = SIZE / 2;

type Props = {
  scores: Record<string, number>;
};

type Point = { x: number; y: number };

function parsePointsString(points: string): Point[] {
  return points.split(' ').map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}

function RadarLine({
  x1,
  y1,
  x2,
  y2,
  color,
  thickness = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: midX - length / 2,
        top: midY - thickness / 2,
        width: length,
        height: thickness,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function PolygonEdges({ points, color, thickness }: { points: Point[]; color: string; thickness?: number }) {
  return (
    <>
      {points.map((p, i) => {
        const next = points[(i + 1) % points.length];
        return (
          <RadarLine
            key={i}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            color={color}
            thickness={thickness}
          />
        );
      })}
    </>
  );
}

export function DiagnosticRadarChart({ scores }: Props) {
  const dataPoints = useMemo(() => buildRadarPoints(scores, SIZE, MAX_R), [scores]);

  const gridRings = useMemo(
    () => [1, 2, 3].map((level) => parsePointsString(gridRingPoints(SIZE, MAX_R, level))),
    [],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.chart} pointerEvents="none">
        {gridRings.map((ring, level) => (
          <PolygonEdges key={level} points={ring} color="#FFFFFF26" thickness={1} />
        ))}
        {DIAGNOSTIC_SKILLS.map((_, i) => {
          const line = axisLine(SIZE, MAX_R, i);
          return (
            <RadarLine
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              color="#FFFFFF26"
              thickness={0.5}
            />
          );
        })}
        {dataPoints.map((p, i) => (
          <RadarLine
            key={`fill-${i}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            color="#B73CEF59"
            thickness={1}
          />
        ))}
        <PolygonEdges points={dataPoints} color={Colors.accentPrimary} thickness={1.5} />
        {dataPoints.map((p, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.vertexDot,
              { left: p.x - 3, top: p.y - 3, backgroundColor: Colors.accentPrimary },
            ]}
          />
        ))}
      </View>
      {DIAGNOSTIC_SKILLS.map((skillId, i) => {
        const pos = labelPosition(SIZE, MAX_R, i);
        const bucket = bucketSkill(scores[skillId] ?? 0);
        const color =
          bucket === 'strength'
            ? Colors.accentHighlight
            : bucket === 'train'
              ? Colors.warning
              : Colors.textSecondary;
        const short = dataPoints[i]?.label ?? skillId;
        return (
          <Text
            key={skillId}
            style={[
              styles.label,
              {
                left: pos.x - 36,
                top: pos.y - 8,
                color,
              },
            ]}
            numberOfLines={1}
          >
            {short.length > 12 ? `${short.slice(0, 10)}…` : short}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  chart: {
    ...StyleSheet.absoluteFillObject,
  },
  vertexDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    position: 'absolute',
    width: 72,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
