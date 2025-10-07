export interface Stage1Request {
  headline: string;
  content: string;
}

export interface Stage1Response {
  isViralWorthy: boolean;
  reason: string;
  confidence: number;
  category?: string;
  sentiment?: string;
}

export interface AnalysisResult {
  stage1: Stage1Response;
  timestamp: string;
  originalContent: Stage1Request;
}
