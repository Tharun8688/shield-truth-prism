import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleProjectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!;
const googleCredentials = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { fileUrl, fileName, userId } = await req.json();

    console.log('Analyzing text:', fileName);

    // Download and read the text file
    const textResponse = await fetch(fileUrl);
    const textContent = await textResponse.text();

    // Get Google Cloud access token
    const credentials = JSON.parse(googleCredentials);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(credentials),
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Analyze with Natural Language API
    const nlResponse = await fetch(
      `https://language.googleapis.com/v1/documents:analyzeSentiment`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          document: {
            type: 'PLAIN_TEXT',
            content: textContent
          }
        }),
      }
    );

    const sentimentResults = await nlResponse.json();

    // Also analyze entities
    const entitiesResponse = await fetch(
      `https://language.googleapis.com/v1/documents:analyzeEntities`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },  
        body: JSON.stringify({
          document: {
            type: 'PLAIN_TEXT',
            content: textContent
          }
        }),
      }
    );

    const entitiesResults = await entitiesResponse.json();

    // Simple AI-generated text detection based on patterns
    let confidenceScore = 0.75;
    let isDeepfake = false;
    let aiGeneratedProbability = 0.2;

    // Check for common AI-generated text patterns
    const aiPatterns = [
      /as an ai/i,
      /i don't have personal/i,
      /i cannot provide/i,
      /as a language model/i,
      /i'm not able to/i
    ];

    const hasAiPatterns = aiPatterns.some(pattern => pattern.test(textContent));
    if (hasAiPatterns) {
      aiGeneratedProbability += 0.6;
      isDeepfake = true;
    }

    // Check sentence structure consistency (very basic)
    const sentences = textContent.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
    
    // Very uniform sentence lengths might indicate AI generation
    const lengthVariance = sentences.reduce((acc, s) => acc + Math.pow(s.length - avgSentenceLength, 2), 0) / sentences.length;
    if (lengthVariance < 50) {
      aiGeneratedProbability += 0.2;
    }

    const results = {
      sentiment: sentimentResults,
      entities: entitiesResults,
      textStats: {
        wordCount: textContent.split(/\s+/).length,
        sentenceCount: sentences.length,
        avgSentenceLength: Math.round(avgSentenceLength),
        lengthVariance: Math.round(lengthVariance)
      }
    };

    // Store analysis result
    const { error: insertError } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: 'text',
        analysis_type: 'text',
        results: results,
        confidence_score: confidenceScore,
        is_deepfake: isDeepfake,
        ai_generated_probability: Math.min(aiGeneratedProbability, 1.0)
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      results: results,
      analysis: {
        confidenceScore,
        isDeepfake,
        aiGeneratedProbability: Math.min(aiGeneratedProbability, 1.0),
        summary: {
          sentiment: sentimentResults.documentSentiment?.score || 0,
          entities: entitiesResults.entities?.length || 0,
          wordCount: results.textStats.wordCount
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-text:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to create JWT for Google Cloud authentication
async function createJWT(credentials: any) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signatureInput = `${header}.${payload}`;
  
  // For demo purposes, return a simple token
  // In production, you'd use proper RSA signing
  return `${header}.${payload}.signature`;
}