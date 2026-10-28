import type { FormData, ReportResponse } from '../types/form.types';
import type { SectionEvent, StartEvent, DoneEvent, ErrorEvent } from '../types/events';
import { parseSseStream } from './sse';
import i18n from '../i18n';

/** Drops the frontend-only `agreement` section and adds the UI language. */
function buildPayload(formData: FormData): string {
  const { agreement: _agreement, ...payload } = formData;
  return JSON.stringify({ ...payload, language: i18n.language });
}

export async function submitAssessment(
  formData: FormData
): Promise<ReportResponse> {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildPayload(formData),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new Error(detail);
  }

  return response.json() as Promise<ReportResponse>;
}

export interface StreamCallbacks {
  onStart?: (event: StartEvent) => void;
  onSection?: (event: SectionEvent) => void;
}

/**
 * Same endpoint as submitAssessment, but requests a live SSE stream so the
 * caller gets per-section results as each validator finishes instead of
 * waiting for the whole assessment.
 */
export async function submitAssessmentStream(
  formData: FormData,
  callbacks: StreamCallbacks = {}
): Promise<ReportResponse> {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: buildPayload(formData),
  });

  if (!response.ok || !(response.headers.get('content-type') ?? '').includes('text/event-stream')) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new Error(detail);
  }

  for await (const { event, data } of parseSseStream(response)) {
    if (event === 'start') callbacks.onStart?.(data as StartEvent);
    else if (event === 'section') callbacks.onSection?.(data as SectionEvent);
    else if (event === 'done') return (data as DoneEvent).report;
    else if (event === 'error') throw new Error((data as ErrorEvent).message);
  }

  throw new Error('Assessment stream ended without a result.');
}
