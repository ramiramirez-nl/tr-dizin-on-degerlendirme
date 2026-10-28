import type { ReportItem, ReportResponse } from './report';

/**
 * SSE event payloads streamed from POST /api/assess when the client sends
 * Accept: text/event-stream. Event names match the interface names:
 * "start" | "section" | "done" | "error".
 */

export interface StartEvent {
  sections: string[];
}

export interface SectionEvent {
  section: string;
  index: number;
  items: ReportItem[];
}

export interface DoneEvent {
  report: ReportResponse;
}

export interface ErrorEvent {
  message: string;
}
