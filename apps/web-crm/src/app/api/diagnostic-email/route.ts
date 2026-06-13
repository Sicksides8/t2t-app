import { NextRequest, NextResponse } from 'next/server';
import { sendDiagnosticResultEmail } from '../../../lib/email/sendDiagnosticResultEmail';
import { SKILL_ORDER } from '../../../lib/email/diagnosticResultEmailTemplate';
import { handleRouteError } from '../../../lib/routeError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LEN = 254;
const MAX_HIGHLIGHT_SKILLS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Endpoint publico (pre-auth): el diagnostico se envia ANTES de que el
 * usuario cree cuenta, por eso no podemos pedir Bearer token.
 *
 * Anti-abuso minimo: rate-limit in-memory por email (60s). Es best-effort
 * y se reinicia con cada cold-start de la lambda; suficiente para frenar
 * loops accidentales del cliente, pero no es seguridad real. Para abuso
 * intencional hace falta captcha/Turnstile (out-of-scope).
 */
const recentSends = new Map<string, number>();

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= EMAIL_MAX_LEN && EMAIL_REGEX.test(value);
}

function isValidScores(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return false;
  for (const [key, val] of entries) {
    if (!SKILL_ORDER.includes(key as (typeof SKILL_ORDER)[number])) return false;
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 100) return false;
  }
  return true;
}

function isValidSkillIdArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.length > MAX_HIGHLIGHT_SKILLS) return false;
  return value.every((id) => SKILL_ORDER.includes(id as (typeof SKILL_ORDER)[number]));
}

function pruneExpiredEntries(now: number): void {
  for (const [key, ts] of recentSends) {
    if (now - ts > RATE_LIMIT_WINDOW_MS) recentSends.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'invalid_json' } },
        { status: 400 },
      );
    }

    const payload = body as {
      email?: unknown;
      scores?: unknown;
      topSkills?: unknown;
      weakSkills?: unknown;
    };

    if (!isValidEmail(payload.email)) {
      return NextResponse.json(
        { success: false, error: { message: 'invalid_email' } },
        { status: 400 },
      );
    }
    if (!isValidScores(payload.scores)) {
      return NextResponse.json(
        { success: false, error: { message: 'invalid_scores' } },
        { status: 400 },
      );
    }
    if (!isValidSkillIdArray(payload.topSkills)) {
      return NextResponse.json(
        { success: false, error: { message: 'invalid_top_skills' } },
        { status: 400 },
      );
    }
    if (!isValidSkillIdArray(payload.weakSkills)) {
      return NextResponse.json(
        { success: false, error: { message: 'invalid_weak_skills' } },
        { status: 400 },
      );
    }

    const emailLower = payload.email.trim().toLowerCase();
    const now = Date.now();
    pruneExpiredEntries(now);
    const lastSentAt = recentSends.get(emailLower);
    if (lastSentAt && now - lastSentAt < RATE_LIMIT_WINDOW_MS) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastSentAt)) / 1000);
      console.warn(`[diagnostic-email] rate_limited to=${emailLower} retryAfterSec=${retryAfter}`);
      return NextResponse.json(
        { success: false, error: { message: 'too_many_requests' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    recentSends.set(emailLower, now);

    const result = await sendDiagnosticResultEmail({
      to: emailLower,
      scores: payload.scores,
      topSkills: payload.topSkills,
      weakSkills: payload.weakSkills,
    });

    if (!result.ok) {
      recentSends.delete(emailLower);
      console.error(`[diagnostic-email] failed to=${emailLower} error=${result.error}`);
      return NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 502 },
      );
    }

    const topSkill = payload.topSkills[0] ?? 'unknown';
    console.log(`[diagnostic-email] sent to=${emailLower} resendId=${result.id} top=${topSkill}`);
    return NextResponse.json({ success: true, data: { id: result.id } });
  } catch (err) {
    return handleRouteError(err);
  }
}
