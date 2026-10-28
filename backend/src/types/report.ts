export type CheckStatus = 'pass' | 'fail' | 'warning';
export type OverallStatus = 'pass' | 'fail' | 'warning';

export interface ReportItem {
  section: string;
  field: string;
  status: CheckStatus;
  message: string;
  suggestion: string;
  url?: string;
  /** Link to the relevant TR Dizin criteria page for this check. */
  criteriaUrl?: string;
  /** Confidence of the AI content check, when one ran. */
  confidence?: 'high' | 'medium' | 'low';
  /** Evidence quote from the AI content check, when one ran. */
  evidence?: string;
}

export interface ReportResponse {
  overallStatus: OverallStatus;
  passCount: number;
  failCount: number;
  warningCount: number;
  /** All results, including passes (for full report display) */
  items: ReportItem[];
  /** Backwards-compat: non-pass items only */
  issues: ReportItem[];
}
