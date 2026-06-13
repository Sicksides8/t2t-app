import { MOCK_VIDEO_URL } from '../../lib/courseConstants';
import type { Lesson, LessonDraft } from '../../types';

let counter = 0;
function nextClientId(): string {
  counter += 1;
  return `draft_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function newLessonDraft(order: number): LessonDraft {
  return {
    clientId: nextClientId(),
    title: '',
    videoUrl: '',
    durationSec: 420,
    order,
    isFree: order === 1,
  };
}

export function lessonFromDraft(draft: LessonDraft, index: number): LessonDraft {
  return { ...draft, order: index + 1, isFree: draft.isFree };
}

export function draftsFromLessons(lessons: Lesson[]): LessonDraft[] {
  return lessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((lesson) => ({
      clientId: lesson.id,
      id: lesson.id,
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      pdfUrl: lesson.pdfUrl,
      links: Array.isArray(lesson.links) ? lesson.links.map((l) => ({ ...l })) : undefined,
      subtitles: Array.isArray(lesson.subtitles)
        ? lesson.subtitles.map((s) => ({ ...s }))
        : undefined,
      durationSec: lesson.durationSec,
      order: lesson.order,
      isFree: lesson.isFree,
    }));
}

export function moveDraft(drafts: LessonDraft[], clientId: string, direction: -1 | 1): LessonDraft[] {
  const index = drafts.findIndex((d) => d.clientId === clientId);
  if (index < 0) return drafts;
  const target = index + direction;
  if (target < 0 || target >= drafts.length) return drafts;
  const next = [...drafts];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map(lessonFromDraft);
}

export function reorderDrafts(drafts: LessonDraft[], fromId: string, toId: string): LessonDraft[] {
  const from = drafts.findIndex((d) => d.clientId === fromId);
  const to = drafts.findIndex((d) => d.clientId === toId);
  if (from < 0 || to < 0 || from === to) return drafts;
  const next = drafts.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map(lessonFromDraft);
}

export function duplicateDraft(drafts: LessonDraft[], clientId: string): LessonDraft[] {
  const index = drafts.findIndex((d) => d.clientId === clientId);
  if (index < 0) return drafts;
  const original = drafts[index];
  const copy: LessonDraft = {
    ...original,
    clientId: nextClientId(),
    id: undefined,
    title: original.title ? `${original.title} (copia)` : '',
    links: Array.isArray(original.links) ? original.links.map((l) => ({ ...l })) : undefined,
    subtitles: Array.isArray(original.subtitles)
      ? original.subtitles.map((s) => ({ ...s }))
      : undefined,
  };
  const next = [...drafts.slice(0, index + 1), copy, ...drafts.slice(index + 1)];
  return next.map(lessonFromDraft);
}

export function draftsFromTitles(titles: string[], startOrder: number): LessonDraft[] {
  const cleaned = titles.map((t) => t.trim()).filter(Boolean);
  return cleaned.map((title, i) => ({
    clientId: nextClientId(),
    title,
    videoUrl: MOCK_VIDEO_URL,
    durationSec: 420,
    order: startOrder + i,
    isFree: startOrder + i === 1,
  }));
}

const DURATION_RE = /^(\d{1,3}):([0-5]?\d)$/;

/** Acepta `mm:ss`, `m:ss`, `ss` o número crudo de segundos. Devuelve null si no parsea. */
export function parseDurationInput(input: string): number | null {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;
  const colonMatch = trimmed.match(DURATION_RE);
  if (colonMatch) {
    const minutes = Number(colonMatch[1]);
    const seconds = Number(colonMatch[2]);
    return minutes * 60 + seconds;
  }
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return null;
}

export function formatDurationMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
