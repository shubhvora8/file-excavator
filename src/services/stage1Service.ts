import { Stage1Request, Stage1Response } from "@/types/stage1";

export const analyzeNewsStage1 = async (
  request: Stage1Request
): Promise<Stage1Response> => {
  // Simulate API call - in real app, this would call Supabase Edge Function
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simple heuristic analysis (replace with actual AI/API call)
  const contentLength = request.content.length;
  const hasNumbers = /\d+/.test(request.headline) || /\d+/.test(request.content);
  const hasExclamation = /!/.test(request.headline);
  const emotionalWords = /(breaking|shocking|amazing|incredible|devastating)/i.test(
    request.headline + request.content
  );

  let score = 50;
  
  if (contentLength > 200) score += 10;
  if (hasNumbers) score += 15;
  if (hasExclamation) score += 10;
  if (emotionalWords) score += 20;

  const isViralWorthy = score > 70;
  const confidence = Math.min(score / 100, 0.95);

  const categories = ["Politics", "Technology", "Health", "Entertainment", "Sports"];
  const category = categories[Math.floor(Math.random() * categories.length)];

  const sentiment = emotionalWords ? "High Impact" : "Neutral";

  return {
    isViralWorthy,
    reason: isViralWorthy
      ? "This content shows strong indicators of viral potential based on emotional appeal and structure."
      : "This content may benefit from more engaging elements to increase viral potential.",
    confidence,
    category,
    sentiment,
  };
};
