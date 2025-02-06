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

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

async function processBatch(entries: Entry[], batchSize: number = 5): Promise<any> {
  console.log(`Processing batch of ${entries.length} entries with batch size ${batchSize}`);
  
  // Split entries into batches
  const batches = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    batches.push(entries.slice(i, i + batchSize));
  }
  
  console.log(`Split into ${batches.length} batches`);

  // Process each batch
  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      try {
        const result = await analyzeBatch(batch);
        return result;
      } catch (error) {
        console.error('Error processing batch:', error);
        throw error;
      }
    })
  );

  // Merge results from all batches
  return mergeBatchResults(batchResults);
}

async function analyzeBatch(entries: Entry[]): Promise<any> {
  const formattedEntries = entries.map((entry, index) => `
Entry #${index + 1}:
Title: ${entry.title}
Date: ${entry.created_at}
Content: ${entry.content}
${entry.research_data ? `Research Data: ${JSON.stringify(entry.research_data, null, 2)}` : ''}
---`).join('\n\n');

  const systemPrompt = `You are an AI analyst specializing in finding patterns and insights across multiple journal entries.
  Analyze the provided entries as a cohesive dataset and return a JSON object with exactly this structure:
  {
    "commonThemes": [{"theme": "string", "count": number}],
    "connections": ["string"],
    "insights": ["string"],
    "questions": ["string"]
  }
  Guidelines:
  - commonThemes: Only include themes that appear at least twice across entries. Sort by frequency (highest first).
  - connections: Find meaningful relationships between different entries
  - insights: Extract key observations about patterns or trends
  - questions: Generate thought-provoking questions based on the content
  Keep responses focused and concise.
  IMPORTANT: Return ONLY the JSON object, with no markdown formatting or additional text.`;

  const estimatedTokens = estimateTokenCount(systemPrompt) + estimateTokenCount(formattedEntries);
  console.log(`Estimated tokens for batch: ${estimatedTokens}`);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these entries as a complete dataset:\n\n${formattedEntries}` }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const jsonString = content.replace(/```json\n|\n```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in analyzeBatch:', error);
    throw error;
  }
}

function mergeBatchResults(results: any[]): any {
  const merged = {
    commonThemes: [],
    connections: [],
    insights: [],
    questions: []
  };

  // Merge themes and combine counts for duplicates
  const themeMap = new Map();
  results.forEach(result => {
    result.commonThemes.forEach((theme: { theme: string; count: number }) => {
      const existing = themeMap.get(theme.theme);
      if (existing) {
        existing.count += theme.count;
      } else {
        themeMap.set(theme.theme, { ...theme });
      }
    });
  });
  
  // Filter out themes with count < 2 and sort by count
  merged.commonThemes = Array.from(themeMap.values())
    .filter(theme => theme.count >= 2)
    .sort((a, b) => b.count - a.count);

  // Merge other arrays, removing duplicates
  results.forEach(result => {
    merged.connections = [...new Set([...merged.connections, ...result.connections])];
    merged.insights = [...new Set([...merged.insights, ...result.insights])];
    merged.questions = [...new Set([...merged.questions, ...result.questions])];
  });

  // Limit the number of items in each array to keep the response focused
  merged.connections = merged.connections.slice(0, 5);
  merged.insights = merged.insights.slice(0, 5);
  merged.questions = merged.questions.slice(0, 5);

  return merged;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries } = await req.json();
    console.log(`Processing ${entries?.length || 0} entries`);

    if (!entries?.length) {
      console.log('No entries provided for analysis');
      throw new Error('No entries provided for analysis');
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Process entries in batches
    const batchSize = 5;
    const analysis = await processBatch(entries, batchSize);
    console.log('Successfully generated analysis');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in analyze-entries function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});