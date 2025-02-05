import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchResponse {
  key_concepts: string[];
  related_topics: string[];
  insights: string;
  questions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const { content, title } = await req.json();
    console.log('Researching content:', { title, contentLength: content.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a research assistant that analyzes content and provides insights. 
            You MUST return a JSON object with EXACTLY this structure, with no additional fields:
            {
              "key_concepts": ["concept1", "concept2", "concept3"],
              "related_topics": ["topic1", "topic2", "topic3"],
              "insights": "2-3 sentences of unique insights about the content",
              "questions": ["interesting question 1", "interesting question 2"]
            }
            The response must be valid JSON and match this exact structure.`
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('OpenAI response received:', aiData);

    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', aiData);
      throw new Error('Invalid response from OpenAI');
    }

    let processedData: ResearchResponse;
    try {
      const content = aiData.choices[0].message.content.trim();
      console.log('Attempting to parse JSON:', content);
      processedData = JSON.parse(content);

      // Validate the response structure
      if (!processedData.key_concepts || !Array.isArray(processedData.key_concepts) ||
          !processedData.related_topics || !Array.isArray(processedData.related_topics) ||
          !processedData.insights || typeof processedData.insights !== 'string' ||
          !processedData.questions || !Array.isArray(processedData.questions)) {
        throw new Error('Response missing required fields or has invalid types');
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Failed to parse research results');
    }

    return new Response(
      JSON.stringify(processedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in research-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});