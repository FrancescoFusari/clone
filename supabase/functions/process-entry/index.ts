import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getSimilarTags(supabase: any, tags: string[]): Promise<string[]> {
  const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
  
  // Get all existing tags
  const { data: entries } = await supabase
    .from('entries')
    .select('tags')
    .not('tags', 'is', null);

  if (!entries) return normalizedTags;

  // Flatten all existing tags into a single array and normalize them
  const existingTags = entries
    .flatMap(entry => entry.tags || [])
    .map(tag => tag.toLowerCase().trim());

  // For each new tag, find the most similar existing tag if similarity is high
  return normalizedTags.map(newTag => {
    const similarTag = existingTags.find(existingTag => {
      // Simple similarity check - if tags are very close
      return existingTag.includes(newTag) || 
             newTag.includes(existingTag) ||
             levenshteinDistance(existingTag, newTag) <= 2;
    });
    return similarTag || newTag;
  });
}

async function getSimilarSubcategory(supabase: any, category: string, subcategory: string): Promise<string> {
  const normalizedSubcategory = subcategory.toLowerCase().trim();
  
  // Get existing subcategories for this category
  const { data: entries } = await supabase
    .from('entries')
    .select('subcategory')
    .eq('category', category)
    .not('subcategory', 'is', null);

  if (!entries) return normalizedSubcategory;

  // Find similar subcategory
  const existingSubcategories = entries
    .map(entry => entry.subcategory?.toLowerCase().trim())
    .filter(Boolean);

  const similarSubcategory = existingSubcategories.find(existing => 
    existing.includes(normalizedSubcategory) || 
    normalizedSubcategory.includes(existing) ||
    levenshteinDistance(existing, normalizedSubcategory) <= 2
  );

  return similarSubcategory || normalizedSubcategory;
}

function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[str2.length][str1.length];
}

function formatText(text: string): string {
  if (text.includes('\n\n')) {
    return text;
  }

  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Group sentences into paragraphs (roughly 3-4 sentences per paragraph)
  const paragraphs = [];
  let currentParagraph = [];
  
  for (const sentence of sentences) {
    currentParagraph.push(sentence);
    if (currentParagraph.length >= 3 || sentence.length > 150) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
  }
  
  // Add any remaining sentences
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }
  
  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, user_id } = await req.json();
    console.log('Processing entry:', content.substring(0, 100) + '...');

    if (!content) {
      throw new Error('Content is required');
    }

    // Don't format the content, preserve its original formatting
    const formattedContent = content;
    console.log('Formatted content:', formattedContent.substring(0, 100) + '...');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, get the category, tags, and summary
    console.log('Requesting category analysis from OpenAI...');
    const categoryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an AI that analyzes journal entries. You must respond with a valid JSON object containing exactly these fields:
            {
              "category": "personal" | "work" | "social" | "interests_and_hobbies" | "school",
              "subcategory": "string describing specific topic",
              "tags": ["array of 1-5 relevant keywords"],
              "summary": "1-2 sentence summary"
            }`
          },
          {
            role: 'user',
            content: formattedContent
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!categoryResponse.ok) {
      const errorData = await categoryResponse.json();
      console.error('OpenAI API error (category):', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const categoryData = await categoryResponse.json();
    console.log('Category API response:', categoryData);

    if (!categoryData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', categoryData);
      throw new Error('Invalid response from OpenAI API (category)');
    }

    let processedData;
    try {
      const rawContent = categoryData.choices[0].message.content;
      console.log('Raw OpenAI response:', rawContent);
      processedData = JSON.parse(rawContent);
      
      // Validate the parsed data
      if (!processedData.category || !Array.isArray(processedData.tags)) {
        console.error('Invalid data structure in parsed response:', processedData);
        throw new Error('Invalid data structure in OpenAI response');
      }
    } catch (error) {
      console.error('Error parsing category response:', error);
      throw new Error('Failed to parse OpenAI response');
    }

    // Generate a title
    console.log('Requesting title generation from OpenAI...');
    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Generate a concise title (max 50 characters) for this journal entry. Respond with a JSON object in this format:
            {
              "title": "The generated title here"
            }`
          },
          {
            role: 'user',
            content: formattedContent
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
        response_format: { type: "json_object" }
      }),
    });

    if (!titleResponse.ok) {
      const errorData = await titleResponse.json();
      console.error('OpenAI API error (title):', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const titleData = await titleResponse.json();
    console.log('Title API response:', titleData);
    
    if (!titleData.choices?.[0]?.message?.content) {
      console.error('Invalid title response structure:', titleData);
      throw new Error('Invalid response from OpenAI API (title)');
    }

    let titleJson;
    try {
      titleJson = JSON.parse(titleData.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing title response:', error);
      throw new Error('Failed to parse title response');
    }

    const generatedTitle = titleJson.title
      .replace(/["']/g, '')
      .replace(/\.{3,}$/, '')
      .trim();

    // Normalize and find similar tags
    processedData.tags = await getSimilarTags(supabase, processedData.tags || []);
    
    // Normalize and find similar subcategory
    if (processedData.subcategory) {
      processedData.subcategory = await getSimilarSubcategory(
        supabase, 
        processedData.category, 
        processedData.subcategory
      );
    }

    // Add the formatted content and title to the response
    processedData.content = formattedContent;
    processedData.title = generatedTitle;

    console.log('Final processed data:', processedData);

    // Create the entry in the database
    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert([{
        user_id,
        content: processedData.content,
        title: processedData.title,
        category: processedData.category,
        subcategory: processedData.subcategory,
        tags: processedData.tags,
        summary: processedData.summary
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting entry:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify(entry),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});