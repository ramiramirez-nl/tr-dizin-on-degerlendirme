import type { ReportItem, ReportResponse } from './form.types';

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
