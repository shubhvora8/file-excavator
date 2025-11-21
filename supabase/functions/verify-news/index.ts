const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyNewsRequest {
  newsContent: string;
  sourceUrl?: string;
}

interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsContent, sourceUrl }: VerifyNewsRequest = await req.json();
    console.log('Verifying news content:', {
      contentLength: newsContent?.length,
      hasUrl: !!sourceUrl
    });

    if (!newsContent) {
      return new Response(
        JSON.stringify({ error: 'News content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const AI_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');

    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }
    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY not configured');
    }

    // Test NewsAPI access first
    console.log('Testing NewsAPI access...');
    try {
      const testUrl = `https://newsapi.org/v2/everything?q=news&pageSize=1&apiKey=${NEWSAPI_KEY}`;
      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();
      console.log('NewsAPI test response:', {
        status: testResponse.status,
        apiStatus: testData.status,
        totalResults: testData.totalResults,
        message: testData.message,
        code: testData.code
      });
      
      if (testData.status === 'error') {
        console.error('NewsAPI Error:', testData.message, 'Code:', testData.code);
        throw new Error(`NewsAPI Error: ${testData.message}`);
      }
    } catch (error) {
      console.error('NewsAPI access test failed:', error);
    }

    // Extract potential headline and keywords with improved strategy
    const extractSearchTerms = (text: string): { headline: string, keywords: string, entities: string, broadQuery: string } => {
      // Get first sentence which is often the headline (limit to 100 chars for better API results)
      const firstLine = text.split('\n')[0].replace(/^['"]|['"]$/g, '').trim().substring(0, 100);

      // Extract proper nouns (capitalized words/phrases) - improved pattern
      const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
      const uniqueNouns = [...new Set(properNouns)].slice(0, 5).join(' ');

      // Extract important keywords with better filtering
      const words = text.toLowerCase().split(/\s+/);
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'that', 'this', 'it', 'their', 'said', 'would', 'could', 'should', 'will', 'can', 'may', 'might', 'must', 'shall'];
      const meaningfulWords = words.filter(word => word.length > 4 && !stopWords.includes(word));
      const keywords = meaningfulWords.slice(0, 5).join(' ');

      // Create a broad query from most important terms
      const topWords = meaningfulWords.slice(0, 3).join(' OR ');

      return { headline: firstLine, keywords, entities: uniqueNouns, broadQuery: topWords };
    };

    const searchTerms = extractSearchTerms(newsContent);
    console.log('Search terms:', searchTerms);

    // Optimized search - try only best queries to reduce API calls
    const tryBBCSearch = async (): Promise<NewsArticle[]> => {
      // Try only the 2 most effective queries to conserve API quota
      const queries = [
        searchTerms.entities && searchTerms.entities.length > 10 ? searchTerms.entities : null, // Proper nouns (most specific)
        searchTerms.keywords // Keywords (good fallback)
      ].filter(q => q && q.length > 3);

      for (const query of queries) {
        if (!query) continue;
        console.log('Trying BBC search with:', query);
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (bbc.com OR bbc.co.uk)&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWSAPI_KEY}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('BBC API response:', {
            status: response.status,
            totalResults: data.totalResults,
            articlesCount: data.articles?.length || 0,
            errorCode: data.code
          });

          // Handle rate limiting
          if (response.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }

          if (response.ok && data.status === 'ok' && data.articles && data.articles.length > 0) {
            console.log('BBC search successful, found:', data.articles.length);
            return data.articles;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') throw error;
          console.error('BBC search error:', error);
        }
      }

      return [];
    };

    const tryCNNSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.entities && searchTerms.entities.length > 10 ? searchTerms.entities : null,
        searchTerms.keywords
      ].filter(q => q && q.length > 3);

      for (const query of queries) {
        if (!query) continue;
        console.log('Trying CNN search with:', query);
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND cnn.com&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWSAPI_KEY}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('CNN API response:', {
            status: response.status,
            totalResults: data.totalResults,
            articlesCount: data.articles?.length || 0
          });

          if (response.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }

          if (response.ok && data.status === 'ok' && data.articles && data.articles.length > 0) {
            console.log('CNN search successful, found:', data.articles.length);
            return data.articles;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') throw error;
          console.error('CNN search error:', error);
        }
      }

      return [];
    };

    const tryABCSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.entities && searchTerms.entities.length > 10 ? searchTerms.entities : null,
        searchTerms.keywords
      ].filter(q => q && q.length > 3);

      for (const query of queries) {
        if (!query) continue;
        console.log('Trying ABC News search with:', query);
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND abcnews.go.com&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWSAPI_KEY}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('ABC API response:', {
            status: response.status,
            totalResults: data.totalResults,
            articlesCount: data.articles?.length || 0
          });

          if (response.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }

          if (response.ok && data.status === 'ok' && data.articles && data.articles.length > 0) {
            console.log('ABC News search successful, found:', data.articles.length);
            return data.articles;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') throw error;
          console.error('ABC News search error:', error);
        }
      }

      return [];
    };

    const tryGuardianSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.entities && searchTerms.entities.length > 10 ? searchTerms.entities : null,
        searchTerms.keywords
      ].filter(q => q && q.length > 3);

      for (const query of queries) {
        if (!query) continue;
        console.log('Trying Guardian search with:', query);
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (theguardian.com OR guardian.co.uk)&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWSAPI_KEY}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('Guardian API response:', {
            status: response.status,
            totalResults: data.totalResults,
            articlesCount: data.articles?.length || 0
          });

          if (response.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }

          if (response.ok && data.status === 'ok' && data.articles && data.articles.length > 0) {
            console.log('Guardian search successful, found:', data.articles.length);
            return data.articles;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') throw error;
          console.error('Guardian search error:', error);
        }
      }

      return [];
    };

    console.log('Fetching from BBC, CNN, ABC News, and Guardian...');
    
    let bbcArticles: NewsArticle[] = [];
    let cnnArticles: NewsArticle[] = [];
    let abcArticles: NewsArticle[] = [];
    let guardianArticles: NewsArticle[] = [];
    
    try {
      [bbcArticles, cnnArticles, abcArticles, guardianArticles] = await Promise.all([
        tryBBCSearch(),
        tryCNNSearch(),
        tryABCSearch(),
        tryGuardianSearch()
      ]);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        console.error('NewsAPI rate limit exceeded');
        return new Response(
          JSON.stringify({
            error: 'NewsAPI rate limit exceeded. Please wait 12-24 hours or upgrade your NewsAPI plan.',
            details: 'Free tier allows 100 requests per 24 hours. Consider upgrading at https://newsapi.org/pricing'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    }

    const articles: NewsArticle[] = [...bbcArticles, ...cnnArticles, ...abcArticles, ...guardianArticles];

    console.log('Total BBC articles found:', bbcArticles.length);
    console.log('Total CNN articles found:', cnnArticles.length);
    console.log('Total ABC News articles found:', abcArticles.length);
    console.log('Total Guardian articles found:', guardianArticles.length);

    // Create AI prompt with real articles
    const articlesContext = articles.length > 0 ? articles.map((article, idx) =>
      `Article ${idx + 1} [${article.source.name}]:
Title: ${article.title}
Description: ${article.description || 'N/A'}
Content: ${article.content || 'N/A'}
Published: ${article.publishedAt}
URL: ${article.url}
`).join('\n---\n') : 'No matching articles found in NewsAPI.';

    // Filter articles by domain since we're using domain-based searches
    const bbcArticlesContext = bbcArticles.filter(a => 
      a.url?.includes('bbc.com') || a.url?.includes('bbc.co.uk') || a.source.name?.toLowerCase().includes('bbc')
    );
    const cnnArticlesContext = cnnArticles.filter(a => 
      a.url?.includes('cnn.com') || a.source.name?.toLowerCase().includes('cnn')
    );
    const abcArticlesContext = abcArticles.filter(a => 
      a.url?.includes('abcnews.go.com') || a.source.name?.toLowerCase().includes('abc')
    );
    const guardianArticlesContext = guardianArticles.filter(a => 
      a.url?.includes('theguardian.com') || a.url?.includes('guardian.co.uk') || a.source.name?.toLowerCase().includes('guardian')
    );

    const prompt = `You are a news verification assistant. Compare the user's news content against real articles from BBC, CNN, ABC News, and The Guardian retrieved from NewsAPI.

User's News Content:
${newsContent}

${sourceUrl ? `User's Source URL: ${sourceUrl}\n` : ''}

Found Articles (${articles.length} total):
- BBC Articles Found: ${bbcArticlesContext.length}
- CNN Articles Found: ${cnnArticlesContext.length}
- ABC News Articles Found: ${abcArticlesContext.length}
- Guardian Articles Found: ${guardianArticlesContext.length}

${articlesContext}

**CRITICAL VERIFICATION RULES - FOLLOW EXACTLY:**

STEP 1: Check if articles were found
- If 0 articles found from a source → verified=FALSE, similarity=0
- If 1+ articles found → Continue to STEP 2

STEP 2: Check for topical match (DO NOT require exact wording)
Check if user's content and found articles share ANY of these:
✓ Same main subject/person (e.g., both mention "Zelensky" or "Trump" or "Tanzania")
✓ Same location (e.g., both about "Ukraine" or "Tanzania" or "Gaza")  
✓ Same type of event (e.g., both about "peace talks" or "protests" or "election")
✓ Same timeframe (e.g., both about recent events in 2025)

If YES to ANY of the above → **verified=TRUE with similarity 60-95** (higher if more overlap)
If NO to ALL → verified=FALSE

**EXAMPLES:**
✅ User: "Zelensky peace plan" + Found: "Ukraine negotiations with Russia" = VERIFIED TRUE (same topic, location, people)
✅ User: "Tanzania protests" + Found: "Tanzania election unrest" = VERIFIED TRUE (same country, event type)
✅ User: "Trump policy on Ukraine" + Found: "US Ukraine foreign policy shift" = VERIFIED TRUE (same topic, country)
❌ User: "Zelensky" + Found: "Brazil economy" = VERIFIED FALSE (completely different topics)

**KEY POINT:** News outlets report the SAME STORY with different headlines and wording. Focus on WHAT the story is about, NOT how it's written.

Respond in JSON format only:
{
  "bbcVerified": boolean (true if BBC articles match user content),
  "bbcSimilarity": number (0-100, based on content overlap),
  "bbcArticles": [{"title": string, "similarity": number, "url": string}],
  "cnnVerified": boolean (true if CNN articles match user content),
  "cnnSimilarity": number (0-100, based on content overlap),
  "cnnArticles": [{"title": string, "similarity": number, "url": string}],
  "abcVerified": boolean (true if ABC News articles match user content),
  "abcSimilarity": number (0-100, based on content overlap),
  "abcArticles": [{"title": string, "similarity": number, "url": string}],
  "guardianVerified": boolean (true if Guardian articles match user content),
  "guardianSimilarity": number (0-100, based on content overlap),
  "guardianArticles": [{"title": string, "similarity": number, "url": string}],
  "legitimacyScore": number (0-100, higher if content matches real articles),
  "topics": string[],
  "locations": string[],
  "dates": string[],
  "credibilityIndicators": string[],
  "redFlags": string[],
  "overallAssessment": string
}`;

    console.log('Calling AI for verification...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', {
      hasChoices: !!aiData.choices?.length
    });

    const content = aiData.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response (handle markdown code blocks if present)
    let verificationResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      verificationResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Verification complete:', {
      bbcVerified: verificationResult.bbcVerified,
      cnnVerified: verificationResult.cnnVerified,
      legitimacyScore: verificationResult.legitimacyScore
    });

    return new Response(
      JSON.stringify(verificationResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify news';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
