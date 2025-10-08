import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headline, content } = await req.json();
    
    console.log("Analyzing news:", { headline, content: content.substring(0, 100) });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert news analyst specializing in viral content prediction. 
Analyze the given news headline and content to determine its viral potential.

Evaluate based on:
1. Emotional impact and engagement potential
2. Newsworthiness and timeliness
3. Shareability and discussion-worthiness
4. Credibility indicators
5. Target audience appeal

Respond with a JSON object containing:
- isViralWorthy: boolean (true if high viral potential)
- reason: string (detailed explanation)
- confidence: number (0.0 to 1.0)
- category: string (Politics, Technology, Health, Entertainment, Sports, Business, Science, Other)
- sentiment: string (Positive, Negative, Neutral, Mixed, High Impact)

Be analytical but concise in your reasoning.`;

    const userPrompt = `Headline: ${headline}

Content: ${content}

Analyze this news article and determine its viral potential.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("AI Response:", aiResponse);
    
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback response if JSON parsing fails
      result = {
        isViralWorthy: false,
        reason: "Analysis completed but response format was unexpected. Please try again.",
        confidence: 0.5,
        category: "Other",
        sentiment: "Neutral"
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in stage1-filter function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
