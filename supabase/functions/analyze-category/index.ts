
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, category } = await req.json();
    
    if (!user_id || !category) {
      throw new Error('User ID and category are required');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Analyzing entries for user ${user_id} in category ${category}`);

    // Get all entries for this category
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user_id)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (entriesError) {
      throw entriesError;
    }

    if (!entries || entries.length === 0) {
      console.log('No entries found for analysis');
      return new Response(
        JSON.stringify({ message: 'No entries found for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Create a prompt for GPT-4 to analyze the entries
    const prompt = `Analyze these ${entries.length} entries in the "${category}" category and provide insights. Return a JSON object with exactly these fields:
    {
      "summary": "A 2-3 sentence overview of the entries",
      "topThemes": [{"theme": "string", "count": number}],
      "keyInsights": ["string"],
      "suggestions": ["string"],
      "connections": ["string"]
    }`;

    // Call OpenAI API
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
            content: prompt
          },
          {
            role: 'user',
            content: JSON.stringify(entries.map(entry => ({
              title: entry.title,
              content: entry.content,
              tags: entry.tags,
              created_at: entry.created_at
            })))
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze entries with OpenAI');
    }

    const analysisResult = await response.json();
    console.log('Analysis completed:', analysisResult);

    // Update or insert the analysis in category_insights
    const { error: upsertError } = await supabase
      .from('category_insights')
      .upsert({
        user_id,
        category,
        insights: analysisResult.choices[0].message.content,
        status: 'completed',
        last_analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category'
      });

    if (upsertError) {
      console.error('Error saving insights:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Analysis completed successfully',
        insights: analysisResult.choices[0].message.content
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-category function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
