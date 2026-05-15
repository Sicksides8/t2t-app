export type DiagnosticBucket = 'strength' | 'developing' | 'train';

export function bucketSkill(score: number): DiagnosticBucket {
  if (score >= 72) return 'strength';
  if (score >= 48) return 'developing';
  return 'train';
}

export function scoreToLevel(score: number): { level: number; max: number } {
  const level = Math.max(1, Math.min(5, Math.round(score / 20)));
  return { level, max: 5 };
}

export function categorizeDiagnosticScores(scores: Record<string, number>) {
  const strength: string[] = [];
  const developing: string[] = [];
  const train: string[] = [];

  for (const [id, score] of Object.entries(scores)) {
    const bucket = bucketSkill(score);
    if (bucket === 'strength') strength.push(id);
    else if (bucket === 'developing') developing.push(id);
    else train.push(id);
  }

  return { strength, developing, train };
}
