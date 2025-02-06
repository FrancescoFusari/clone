import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Entry {
  content: string;
  title: string;
  created_at: string;
  research_data?: {
    key_concepts?: string[];
    insights?: string;
    questions?: string[];
    related_topics?: string[];
  };
}

async function callOpenAI(entries: Entry[], retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  try {
    console.log(`Attempting OpenAI API call (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI analyst that finds patterns and insights in journal entries. 
            Analyze the provided entries and return a JSON object with exactly this structure:
            {
              "commonThemes": [{"theme": "string", "count": number}],
              "connections": ["string"],
              "insights": ["string"],
              "questions": ["string"]
            }`
          },
          {
            role: 'user',
            content: `Analyze these entries and find patterns, connections, and insights. Focus on recurring themes and meaningful connections between entries:
            ${JSON.stringify(entries)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error response:', errorData);
      
      // Handle rate limits specifically
      if (response.status === 429 && retryCount < maxRetries) {
        console.log(`Rate limited, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return callOpenAI(entries, retryCount + 1);
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    return data;
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(`Error occurred, retrying in ${retryDelay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      return callOpenAI(entries, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries } = await req.json();
    console.log(`Analyzing ${entries.length} entries`);

    if (!entries?.length) {
      console.log('No entries provided for analysis');
      throw new Error('No entries provided for analysis');
    }

    const data = await callOpenAI(entries);
    
    // Parse the content as JSON
    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
      console.log('Successfully parsed analysis');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response content:', data.choices[0].message.content);
      throw new Error('Failed to parse AI analysis response');
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-entries function:', error);
    
    // Provide more specific error messages
    const errorMessage = error.message.includes('OpenAI API error: 429')
      ? 'Service is temporarily busy. Please try again in a few moments.'
      : error.message;

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});