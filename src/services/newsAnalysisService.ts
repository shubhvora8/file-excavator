import { NewsArticle, NewsAnalysis } from "@/types/news";
import { Stage1Request } from "@/types/stage1";
import { analyzeNewsStage1 } from "./stage1Service";

export const analyzeNewsArticle = async (
  article: Partial<NewsArticle>
): Promise<NewsAnalysis> => {
  const request: Stage1Request = {
    headline: article.headline || "",
    content: article.content || "",
  };

  const stage1Result = await analyzeNewsStage1(request);

  return {
    id: crypto.randomUUID(),
    articleId: article.id || crypto.randomUUID(),
    isViralWorthy: stage1Result.isViralWorthy,
    reason: stage1Result.reason,
    confidence: stage1Result.confidence,
    category: stage1Result.category || "Uncategorized",
    sentiment: stage1Result.sentiment || "Neutral",
    analyzedAt: new Date().toISOString(),
  };
};

export const calculateViralScore = (analysis: NewsAnalysis): number => {
  const baseScore = analysis.confidence * 100;
  const sentimentBoost = analysis.sentiment === "High Impact" ? 10 : 0;
  return Math.min(Math.round(baseScore + sentimentBoost), 100);
};
