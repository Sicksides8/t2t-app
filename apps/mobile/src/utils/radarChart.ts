import { DIAGNOSTIC_SKILLS } from '../data/diagnostic';
import { skills } from '../data/academy';

export type RadarPoint = {
  skillId: string;
  label: string;
  score: number;
  x: number;
  y: number;
};

export function buildRadarPoints(
  scores: Record<string, number>,
  size: number,
  maxRadius: number,
): RadarPoint[] {
  const cx = size / 2;
  const cy = size / 2;
  const n = DIAGNOSTIC_SKILLS.length;
  const start = -Math.PI / 2;

  return DIAGNOSTIC_SKILLS.map((skillId, i) => {
    const angle = start + (2 * Math.PI * i) / n;
    const pct = Math.max(0, Math.min(100, scores[skillId] ?? 0)) / 100;
    const r = pct * maxRadius;
    const name = skills.find((s) => s.id === skillId)?.name ?? skillId;
    return {
      skillId,
      label: name,
      score: scores[skillId] ?? 0,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export function polygonPointsString(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function gridRingPoints(size: number, maxRadius: number, level: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const n = DIAGNOSTIC_SKILLS.length;
  const start = -Math.PI / 2;
  const r = (maxRadius * level) / 3;
  const pts = Array.from({ length: n }, (_, i) => {
    const angle = start + (2 * Math.PI * i) / n;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return polygonPointsString(pts);
}

export function axisLine(size: number, maxRadius: number, index: number): { x1: number; y1: number; x2: number; y2: number } {
  const cx = size / 2;
  const cy = size / 2;
  const n = DIAGNOSTIC_SKILLS.length;
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / n;
  return {
    x1: cx,
    y1: cy,
    x2: cx + maxRadius * Math.cos(angle),
    y2: cy + maxRadius * Math.sin(angle),
  };
}

export function labelPosition(size: number, maxRadius: number, index: number): { x: number; y: number } {
  const cx = size / 2;
  const cy = size / 2;
  const n = DIAGNOSTIC_SKILLS.length;
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / n;
  const r = maxRadius + 22;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
