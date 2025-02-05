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
  
  const { data: entries } = await supabase
    .from('entries')
    .select('tags')
    .not('tags', 'is', null);

  if (!entries) return normalizedTags;

  const existingTags = entries
    .flatMap(entry => entry.tags || [])
    .map(tag => tag.toLowerCase().trim());

  return normalizedTags.map(newTag => {
    const similarTag = existingTags.find(existingTag => {
      return existingTag.includes(newTag) || 
             newTag.includes(existingTag) ||
             levenshteinDistance(existingTag, newTag) <= 2;
    });
    return similarTag || newTag;
  });
}

async function getSimilarSubcategory(supabase: any, category: string, subcategory: string): Promise<string> {
  const normalizedSubcategory = subcategory.toLowerCase().trim();
  
  const { data: entries } = await supabase
    .from('entries')
    .select('subcategory')
    .eq('category', category)
    .not('subcategory', 'is', null);

  if (!entries) return normalizedSubcategory;

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

  const sentences = text.split(/(?<=[.!?])\s+/);
  const paragraphs = [];
  let currentParagraph = [];
  
  for (const sentence of sentences) {
    currentParagraph.push(sentence);
    if (currentParagraph.length >= 3 || sentence.length > 150) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }
  
  return paragraphs.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    console.log('Processing entry:', content);

    if (!content) {
      throw new Error('Content is required');
    }

    const formattedContent = formatText(content);
    console.log('Formatted content:', formattedContent);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const categoryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an AI that analyzes journal entries. 
            Analyze the entry and return a JSON object with the following structure:
            {
              "category": one of ["personal", "work", "social", "interests_and_hobbies", "school"],
              "subcategory": a specific subcategory based on the content,
              "tags": an array of relevant keywords (max 5),
              "summary": a brief 1-2 sentence summary of the entry
            }`
          },
          {
            role: 'user',
            content: formattedContent
          }
        ],
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
      throw new Error('Invalid response from OpenAI API (category)');
    }

    const processedData = JSON.parse(categoryData.choices[0].message.content.trim());

    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Generate a concise, engaging title (max 50 characters) that captures the main theme or key event of this journal entry. Be specific and descriptive. Do not use generic phrases like "Journal Entry" or "My Thoughts". Write in title case.'
          },
          {
            role: 'user',
            content: formattedContent
          }
        ],
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
      throw new Error('Invalid response from OpenAI API (title)');
    }

    const generatedTitle = titleData.choices[0].message.content
      .replace(/["']/g, '')
      .replace(/\.{3,}$/, '')
      .trim();

    processedData.tags = await getSimilarTags(supabase, processedData.tags || []);
    
    if (processedData.subcategory) {
      processedData.subcategory = await getSimilarSubcategory(
        supabase, 
        processedData.category, 
        processedData.subcategory
      );
    }

    processedData.content = formattedContent;
    processedData.title = generatedTitle;

    console.log('Final processed data:', processedData);

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});