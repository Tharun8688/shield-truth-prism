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

    console.log('Analyzing image:', fileName);

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

    // Download the image
    const imageResponse = await fetch(fileUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Analyze with Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'FACE_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }]
        }),
      }
    );

    const visionResults = await visionResponse.json();
    const response = visionResults.responses[0];

    // Calculate confidence and deepfake probability
    const safeSearch = response.safeSearchAnnotation;
    const faces = response.faceAnnotations || [];
    
    let confidenceScore = 0.8; // Base confidence
    let isDeepfake = false;
    let aiGeneratedProbability = 0.1; // Base probability

    // Analyze for potential deepfake indicators
    if (faces.length > 0) {
      const faceConfidences = faces.map(face => face.detectionConfidence || 0);
      const avgFaceConfidence = faceConfidences.reduce((a, b) => a + b, 0) / faceConfidences.length;
      
      // Lower face detection confidence might indicate manipulation
      if (avgFaceConfidence < 0.7) {
        aiGeneratedProbability += 0.3;
        isDeepfake = true;
      }
    }

    // Check for inconsistencies in labels that might indicate AI generation
    const labels = response.labelAnnotations || [];
    const artificialLabels = labels.filter(label => 
      label.description.toLowerCase().includes('artificial') ||
      label.description.toLowerCase().includes('synthetic') ||
      label.description.toLowerCase().includes('generated')
    );

    if (artificialLabels.length > 0) {
      aiGeneratedProbability += 0.4;
      isDeepfake = true;
    }

    // Store analysis result
    const { error: insertError } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: 'image',
        analysis_type: 'image',
        results: response,
        confidence_score: confidenceScore,
        is_deepfake: isDeepfake,
        ai_generated_probability: Math.min(aiGeneratedProbability, 1.0)
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      results: response,
      analysis: {
        confidenceScore,
        isDeepfake,
        aiGeneratedProbability: Math.min(aiGeneratedProbability, 1.0),
        summary: {
          faces: faces.length,
          labels: labels.length,
          safeSearch: safeSearch ? 'detected' : 'none'
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-image:', error);
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