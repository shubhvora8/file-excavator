import { useState } from "react";
import { NewsDetectionHeader } from "@/components/NewsDetectionHeader";
import { NewsInputForm } from "@/components/NewsInputForm";
import { Stage1Results } from "@/components/Stage1Results";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Stage1Response } from "@/types/stage1";
import { NewsAnalysis } from "@/types/news";
import { analyzeNewsStage1 } from "@/services/stage1Service";
import { analyzeNewsArticle } from "@/services/newsAnalysisService";
import { toast } from "sonner";

const NewsVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stage1Result, setStage1Result] = useState<Stage1Response | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<NewsAnalysis | null>(null);

  const handleAnalyze = async (headline: string, content: string) => {
    setIsLoading(true);
    setStage1Result(null);
    setFullAnalysis(null);

    try {
      // Stage 1 Analysis
      const result = await analyzeNewsStage1({ headline, content });
      setStage1Result(result);

      // Full Analysis
      const analysis = await analyzeNewsArticle({
        id: crypto.randomUUID(),
        headline,
        content,
        createdAt: new Date().toISOString(),
      });
      setFullAnalysis(analysis);

      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze news. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NewsDetectionHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Verify News Authenticity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Leverage AI to analyze news content and determine its viral potential.
              Get instant insights on authenticity, sentiment, and engagement metrics.
            </p>
          </div>

          {/* Input Form */}
          <NewsInputForm onSubmit={handleAnalyze} isLoading={isLoading} />

          {/* Results */}
          {stage1Result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Stage1Results result={stage1Result} />
              {fullAnalysis && <AnalysisResults analysis={fullAnalysis} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewsVerification;
