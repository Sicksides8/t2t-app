import { MOCK_VIDEO_URL } from '../../lib/courseConstants';
import type { Lesson, LessonDraft } from '../../types';

export function newLessonDraft(order: number): LessonDraft {
  return {
    clientId: `draft_${Date.now()}_${order}`,
    title: '',
    videoUrl: MOCK_VIDEO_URL,
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
