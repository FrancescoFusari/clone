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

// Function to estimate token count (rough approximation)
function estimateTokenCount(text: string): number {
  // GPT models typically use ~4 characters per token
  return Math.ceil(text.length / 4);
}

async function callOpenAI(entries: Entry[], retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const retryDelay = 2000;

  try {
    console.log(`Attempting OpenAI API call (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Format entries in a structured way for the model
    const formattedEntries = entries.map((entry, index) => `
Entry #${index + 1}:
Title: ${entry.title}
Date: ${entry.created_at}
Content: ${entry.content}
${entry.research_data ? `Research Data: ${JSON.stringify(entry.research_data, null, 2)}` : ''}
---`).join('\n\n');

    // Estimate token count for the request
    const systemPrompt = `You are an AI analyst specializing in finding patterns and insights across multiple journal entries.
    Analyze the provided entries as a cohesive dataset and return a JSON object with exactly this structure:
    {
      "commonThemes": [{"theme": "string", "count": number}],
      "connections": ["string"],
      "insights": ["string"],
      "questions": ["string"]
    }
    Guidelines:
    - commonThemes: Identify recurring themes and their frequency across entries
    - connections: Find meaningful relationships between different entries
    - insights: Extract key observations about patterns or trends
    - questions: Generate thought-provoking questions based on the content
    Keep responses focused and concise.
    IMPORTANT: Your response must be valid JSON.`;

    const estimatedSystemTokens = estimateTokenCount(systemPrompt);
    const estimatedEntriesTokens = estimateTokenCount(formattedEntries);
    const totalEstimatedTokens = estimatedSystemTokens + estimatedEntriesTokens;

    console.log('Estimated token counts:', {
      systemPrompt: estimatedSystemTokens,
      entries: estimatedEntriesTokens,
      total: totalEstimatedTokens
    });

    // If token count is too high, analyze a subset of entries
    const MAX_TOKENS = 8000; // Conservative limit for gpt-4o-mini
    if (totalEstimatedTokens > MAX_TOKENS) {
      console.warn(`Token count (${totalEstimatedTokens}) exceeds limit (${MAX_TOKENS}). Consider implementing pagination or reducing entry content.`);
    }

    console.log('Sending request to OpenAI API...');
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze these entries as a complete dataset:\n\n${formattedEntries}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error response:', errorData);
      
      if (response.status === 429) {
        console.error('Rate limit exceeded. Token usage details:', {
          estimatedTokens: totalEstimatedTokens,
          errorDetails: errorData
        });
        
        if (retryCount < maxRetries) {
          const backoffDelay = retryDelay * Math.pow(2, retryCount);
          console.log(`Rate limited, waiting ${backoffDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return callOpenAI(entries, retryCount + 1);
        }
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
    // Validate the response format
    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      if (!parsedContent.commonThemes || !parsedContent.connections || 
          !parsedContent.insights || !parsedContent.questions) {
        throw new Error('Response missing required fields');
      }
      return parsedContent;
    } catch (error) {
      console.error('Invalid response format from OpenAI:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    if (retryCount < maxRetries) {
      const backoffDelay = retryDelay * Math.pow(2, retryCount);
      console.log(`Error occurred, retrying in ${backoffDelay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
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
    console.log(`Analyzing ${entries.length} entries in a single batch`);

    if (!entries?.length) {
      console.log('No entries provided for analysis');
      throw new Error('No entries provided for analysis');
    }

    const analysis = await callOpenAI(entries);
    console.log('Successfully parsed analysis:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-entries function:', error);
    
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