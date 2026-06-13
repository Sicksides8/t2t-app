/**
 * Utilidades del radar chart. Generalizadas para soportar N ejes — no hay
 * dependencia con un set fijo de habilidades.
 */

export type RadarPointInput = {
  /** Identificador único del eje (skill id o cualquier key estable). */
  key: string;
  /** Label corto para mostrar fuera del eje. */
  label: string;
  /** Score 0..100 del eje. */
  value: number;
};

export type RadarPoint = RadarPointInput & {
  /** Score normalizado 0..100. */
  score: number;
  x: number;
  y: number;
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function buildRadarPoints(
  axes: RadarPointInput[],
  size: number,
  maxRadius: number,
): RadarPoint[] {
  const cx = size / 2;
  const cy = size / 2;
  const n = axes.length;
  const start = -Math.PI / 2;

  return axes.map((axis, i) => {
    const angle = start + (2 * Math.PI * i) / n;
    const score = clamp01(axis.value);
    const r = (score / 100) * maxRadius;
    return {
      ...axis,
      score,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export function polygonPointsString(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function gridRingPoints(
  axisCount: number,
  size: number,
  maxRadius: number,
  level: number,
): string {
  const cx = size / 2;
  const cy = size / 2;
  const start = -Math.PI / 2;
  const r = (maxRadius * level) / 3;
  const pts = Array.from({ length: axisCount }, (_, i) => {
    const angle = start + (2 * Math.PI * i) / axisCount;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return polygonPointsString(pts);
}

export function axisLine(
  axisCount: number,
  size: number,
  maxRadius: number,
  index: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const cx = size / 2;
  const cy = size / 2;
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / axisCount;
  return {
    x1: cx,
    y1: cy,
    x2: cx + maxRadius * Math.cos(angle),
    y2: cy + maxRadius * Math.sin(angle),
  };
}

export function labelPosition(
  axisCount: number,
  size: number,
  maxRadius: number,
  index: number,
  offset: number = 22,
): { x: number; y: number } {
  const cx = size / 2;
  const cy = size / 2;
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / axisCount;
  const r = maxRadius + offset;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
