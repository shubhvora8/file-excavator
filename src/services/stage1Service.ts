import { Stage1Request, Stage1Response } from "@/types/stage1";
import { supabase } from "@/integrations/supabase/client";

export const analyzeNewsStage1 = async (
  request: Stage1Request
): Promise<Stage1Response> => {
  try {
    const { data, error } = await supabase.functions.invoke('stage1-filter', {
      body: { 
        headline: request.headline, 
        content: request.content 
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to analyze news");
    }

    if (!data) {
      throw new Error("No response from analysis service");
    }

    return {
      isViralWorthy: data.isViralWorthy || false,
      reason: data.reason || "Analysis completed",
      confidence: data.confidence || 0.5,
      category: data.category || "Other",
      sentiment: data.sentiment || "Neutral",
    };
  } catch (error) {
    console.error("Stage1 service error:", error);
    throw error;
  }
};
