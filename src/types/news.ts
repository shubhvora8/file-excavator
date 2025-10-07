export interface NewsArticle {
  id: string;
  headline: string;
  content: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface NewsAnalysis {
  id: string;
  articleId: string;
  isViralWorthy: boolean;
  reason: string;
  confidence: number;
  category: string;
  sentiment: string;
  analyzedAt: string;
}
