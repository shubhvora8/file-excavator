import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsContent, sourceUrl } = await req.json();
    console.log('Verifying news with AI:', { contentLength: newsContent?.length, sourceUrl });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY not configured');
    }

    // Fetch recent news from NewsAPI for cross-referencing
    // Extract key terms for better search
    const keyTerms = newsContent.match(/Israel|Gaza|Hamas|Trump|ceasefire|Biden|Ukraine|Russia|China/gi);
    const searchTerms = keyTerms ? keyTerms[0] : newsContent.slice(0, 50);
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;
    
    console.log('NewsAPI search terms:', searchTerms);
    console.log('NewsAPI URL:', newsApiUrl.replace(NEWSAPI_KEY, 'REDACTED'));
    
    const newsApiResponse = await fetch(newsApiUrl);
    
    let newsApiArticles = [];
    if (newsApiResponse.ok) {
      const newsData = await newsApiResponse.json();
      newsApiArticles = newsData.articles || [];
      console.log(`Found ${newsApiArticles.length} related articles from NewsAPI`);
      if (newsApiArticles.length > 0) {
        console.log('First article:', {
          title: newsApiArticles[0].title,
          source: newsApiArticles[0].source.name,
          url: newsApiArticles[0].url
        });
      }
    } else {
      const errorData = await newsApiResponse.json();
      console.error('NewsAPI error:', newsApiResponse.status, errorData);
    }

    const systemPrompt = `You are an expert news verification AI. Analyze the provided news content and return a comprehensive verification report in the following JSON structure:

{
  "relatability": {
    "rssVerification": {
      "found": boolean,
      "matchingFeeds": [
        {
          "source": "string",
          "title": "string",
          "url": "string",
          "publishDate": "string",
          "similarity": number (0-100)
        }
      ],
      "score": number (0-100)
    },
    "location": {
      "score": number (0-100),
      "details": "string",
      "extractedLocations": ["string"],
    },
    "timestamp": {
      "score": number (0-100),
      "details": "string",
      "extractedDates": ["string"],
      "consistency": boolean
    },
    "event": {
      "score": number (0-100),
      "details": "string",
      "eventContext": "string",
      "plausibility": number (0-100)
    },
    "overallScore": number (0-100)
  },
  "legitimacy": {
    "bbcVerification": {
      "found": boolean,
      "similarity": number (0-100),
      "matchingArticles": [
        {
          "title": "string",
          "url": "string",
          "publishDate": "string",
          "similarity": number (0-100),
          "excerpt": "string"
        }
      ]
    },
    "cnnVerification": {
      "found": boolean,
      "similarity": number (0-100),
      "matchingArticles": [...]
    },
    "abcVerification": {
      "found": boolean,
      "similarity": number (0-100),
      "matchingArticles": [...]
    },
    "guardianVerification": {
      "found": boolean,
      "similarity": number (0-100),
      "matchingArticles": [...]
    },
    "crossReference": {
      "score": number (0-100),
      "details": "string"
    },
    "overallScore": number (0-100)
  },
  "trustworthiness": {
    "languageAnalysis": {
      "bias": number (0-100),
      "emotionalTone": "neutral" | "positive" | "negative" | "sensational",
      "credibilityScore": number (0-100)
    },
    "factualConsistency": {
      "score": number (0-100),
      "inconsistencies": ["string"]
    },
    "sourceCredibility": {
      "score": number (0-100),
      "reputation": "string"
    },
    "overallScore": number (0-100)
  },
  "overallScore": number (0-100),
  "overallVerdict": "VERIFIED" | "SUSPICIOUS" | "FAKE" | "NEEDS_REVIEW"
}

Guidelines:
- Relatability (35% weight): Verify if the news relates to real events, locations, and timelines
- Legitimacy (50% weight): Check if authoritative sources have reported similar content
- Trustworthiness (15% weight): Assess language bias, consistency, and source reputation
- Overall verdict based on combined score: 
  - 80-100: VERIFIED
  - 60-79: NEEDS_REVIEW
  - 40-59: SUSPICIOUS
  - 0-39: FAKE

Use the NewsAPI articles provided as reference for cross-checking legitimacy.`;

    const userPrompt = `Analyze this news content:

${newsContent}

${sourceUrl ? `Source URL: ${sourceUrl}` : ''}

NewsAPI Reference Articles:
${newsApiArticles.map((article: any, index: number) => `
${index + 1}. ${article.title}
   Source: ${article.source.name}
   Published: ${article.publishedAt}
   URL: ${article.url}
   Description: ${article.description || 'N/A'}
`).join('\n')}

Provide a comprehensive verification analysis following the JSON structure specified.`;

    console.log('Calling Lovable AI for verification...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const analysisText = aiData.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log('Analysis complete:', {
      overallScore: analysis.overallScore,
      verdict: analysis.overallVerdict
    });

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in verify-news function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to verify news content'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
