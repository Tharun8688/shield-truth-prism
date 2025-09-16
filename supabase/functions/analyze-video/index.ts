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

    console.log('Analyzing video:', fileName);

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

    // Start video analysis with Video Intelligence API
    const analysisResponse = await fetch(
      `https://videointelligence.googleapis.com/v1/videos:annotate`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          inputUri: fileUrl,
          features: [
            'LABEL_DETECTION',
            'FACE_DETECTION',
            'PERSON_DETECTION',
            'EXPLICIT_CONTENT_DETECTION',
            'OBJECT_TRACKING'
          ],
          videoContext: {
            faceDetectionConfig: {
              model: 'builtin/latest'
            }
          }
        }),
      }
    );

    const operationResult = await analysisResponse.json();
    
    // For demo purposes, simulate analysis results
    // In production, you'd poll the operation until complete
    const mockResults = {
      labels: [
        { description: 'Person', confidence: 0.95 },
        { description: 'Face', confidence: 0.88 },
        { description: 'Speaking', confidence: 0.75 }
      ],
      faces: [
        { 
          trackId: 1,
          confidence: 0.92,
          attributes: ['frontal_face', 'clear_visibility']
        }
      ],
      explicitContent: {
        likelihood: 'VERY_UNLIKELY'
      }
    };

    // Analyze for deepfake indicators
    let confidenceScore = 0.85;
    let isDeepfake = false;
    let aiGeneratedProbability = 0.15;

    // Check face consistency and quality
    if (mockResults.faces.length > 0) {
      const faceConfidence = mockResults.faces[0].confidence;
      
      if (faceConfidence < 0.8) {
        aiGeneratedProbability += 0.3;
        isDeepfake = true;
      }

      // Check for inconsistent lighting or artifacts
      if (faceConfidence < 0.7) {
        aiGeneratedProbability += 0.2;
      }
    }

    // Store analysis result
    const { error: insertError } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: 'video',
        analysis_type: 'video',
        results: mockResults,
        confidence_score: confidenceScore,
        is_deepfake: isDeepfake,
        ai_generated_probability: Math.min(aiGeneratedProbability, 1.0)
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      results: mockResults,
      analysis: {
        confidenceScore,
        isDeepfake,
        aiGeneratedProbability: Math.min(aiGeneratedProbability, 1.0),
        summary: {
          faces: mockResults.faces.length,
          labels: mockResults.labels.length,
          explicitContent: mockResults.explicitContent.likelihood
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-video:', error);
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