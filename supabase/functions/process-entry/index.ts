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
  
  console.log('Finding similar subcategory for:', { category, subcategory: normalizedSubcategory });
  
  // Get existing subcategories for this category
  const { data: entries, error } = await supabase
    .from('entries')
    .select('subcategory')
    .eq('category', category)
    .not('subcategory', 'is', null);

  if (error) {
    console.error('Error fetching existing subcategories:', error);
    return normalizedSubcategory;
  }

  if (!entries || entries.length === 0) {
    console.log('No existing subcategories found for category:', category);
    return normalizedSubcategory;
  }

  // Get unique subcategories
  const existingSubcategories = [...new Set(
    entries
      .map(entry => entry.subcategory?.toLowerCase().trim())
      .filter(Boolean)
  )];

  console.log('Existing subcategories:', existingSubcategories);

  // Find similar subcategory using Levenshtein distance
  const similarSubcategory = existingSubcategories.find(existing => 
    existing.includes(normalizedSubcategory) || 
    normalizedSubcategory.includes(existing) ||
    levenshteinDistance(existing, normalizedSubcategory) <= 2
  );

  if (similarSubcategory) {
    console.log('Found similar subcategory:', similarSubcategory);
    return similarSubcategory;
  }

  console.log('No similar subcategory found, using new one:', normalizedSubcategory);
  return normalizedSubcategory;
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

async function formatTextAndGenerateComments(content: string, type: "text" | "url" | "image" | "document"): Promise<{ formattedContent: string, comments: any[] }> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Limit content length for text-based entries
  const MAX_CHARS = 10000;
  let processedContent = content;
  
  if (type !== "image" && content.length > MAX_CHARS) {
    processedContent = content.substring(0, MAX_CHARS) + "\n\n[Content truncated due to length limitations...]";
    console.log('Content truncated:', { 
      originalLength: content.length, 
      truncatedLength: processedContent.length 
    });
  }

  const systemPrompt = type === "image" 
    ? `You are an AI that analyzes images. You will:
       1. Describe the image content in detail
       2. Generate 2-3 insightful comments about the image
       Return a JSON object with exactly these fields:
       {
         "formattedContent": "detailed description of the image",
         "comments": [
           {
             "id": "unique string",
             "text": "insightful comment about the image",
             "type": "observation" | "analysis" | "suggestion"
           }
         ]
       }`
    : `You are an AI that processes journal entries. You will:
       1. Format the text into well-structured paragraphs with proper spacing
       2. Generate 2-3 insightful comments about the content
       Return a JSON object with exactly these fields:
       {
         "formattedContent": "the formatted text with proper paragraphs and spacing",
         "comments": [
           {
             "id": "unique string",
             "text": "insightful comment about the content",
             "type": "observation" | "question" | "suggestion"
           }
         ]
       }`;

  console.log('Making OpenAI request with:', {
    type,
    contentLength: typeof content === 'string' ? content.length : 'image URL',
    content: type === "image" ? content : undefined,
    truncated: content.length > MAX_CHARS
  });

  try {
    const messages = type === "image" 
      ? [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: "text", text: "Please analyze this image:" },
              { 
                type: "image_url",
                image_url: {
                  url: content
                }
              }
            ]
          }
        ]
      : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: processedContent }
        ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: type === "image" ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    try {
      const result = JSON.parse(data.choices[0].message.content);
      
      // Enhanced validation of the response structure
      if (!result.formattedContent || result.formattedContent.trim() === '') {
        console.error('Empty or invalid formatted content:', result);
        // Use the original content as fallback if no valid formatted content
        result.formattedContent = processedContent;
      }

      if (!Array.isArray(result.comments) || result.comments.length === 0) {
        console.error('Missing or empty comments array:', result);
        // Add a default comment if none provided
        result.comments = [{
          id: 'default-1',
          text: 'This content has been processed and saved.',
          type: 'observation'
        }];
      } else {
        // Ensure each comment has required fields
        result.comments = result.comments.map((comment: any, index: number) => ({
          id: comment.id || `comment-${index}`,
          text: comment.text || 'No comment text provided',
          type: comment.type || 'observation'
        }));
      }

      return result;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response content:', data.choices[0].message.content);
      
      // Return a fallback response if parsing fails
      return {
        formattedContent: processedContent,
        comments: [{
          id: 'error-1',
          text: 'This content has been saved but could not be analyzed. Please try again later.',
          type: 'observation'
        }]
      };
    }
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    // Provide a fallback response for any OpenAI API errors
    return {
      formattedContent: processedContent,
      comments: [{
        id: 'error-1',
        text: 'This content has been saved but could not be analyzed due to a temporary error. Please try again later.',
        type: 'observation'
      }]
    };
  }
}

async function processDocument(url: string): Promise<string> {
  try {
    console.log('Processing document:', url);
    
    // Download the document
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const fileExtension = url.split('.').pop()?.toLowerCase();
    let text = '';
    
    switch (fileExtension) {
      case 'pdf':
        // Convert ArrayBuffer to Uint8Array for pdf-parse
        const uint8Array = new Uint8Array(buffer);
        const pdfData = await readPdf(uint8Array);
        text = pdfData.text;
        break;
        
      case 'txt':
        text = new TextDecoder().decode(buffer);
        break;
        
      case 'doc':
      case 'docx':
        throw new Error('Word documents are not supported yet. Please convert to PDF first.');
        
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }
    
    // Limit extracted text length
    const MAX_CHARS = 10000;
    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS) + "\n\n[Content truncated due to length limitations...]";
      console.log('Document text truncated:', { 
        originalLength: text.length, 
        truncatedLength: MAX_CHARS 
      });
    }
    
    console.log('Document processed successfully, extracted text length:', text.length);
    return text;
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, user_id, type = "text", folder = "default" } = await req.json();
    console.log(`Processing ${type} entry:`, 
      typeof content === 'string' ? content.substring(0, 100) + "..." : "File content");

    if (!content) {
      throw new Error('Content is required');
    }

    let processedContent = content;
    
    // First, extract text from document if it's a document type
    if (type === "document") {
      console.log('Processing document before AI analysis');
      
      // Call the process-document function
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ url: content })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Document processing failed: ${error.error || 'Unknown error'}`);
      }

      const { text } = await response.json();
      if (!text) {
        throw new Error('No text was extracted from the document');
      }

      processedContent = text;
      console.log('Successfully processed document:', processedContent.substring(0, 100) + "...");
    }

    // Then, get formatted content and comments using the extracted text
    const { formattedContent, comments } = await formatTextAndGenerateComments(
      processedContent, 
      type as "text" | "url" | "image" | "document"
    );
    console.log('Generated formatted content and comments');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get category analysis with a modified prompt for concise titles
    console.log('Requesting category analysis from OpenAI...');
    const categoryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using the faster model for category analysis
        messages: [
          {
            role: 'system',
            content: `You are an AI that analyzes ${type === "image" ? "image descriptions" : "journal entries"}. 
            You must respond with a valid JSON object containing exactly these fields:
            {
              "category": "personal" | "work" | "social" | "interests" | "school",
              "subcategory": "string describing specific topic within the category",
              "tags": ["array of 1-5 relevant keywords"],
              "summary": "1-2 sentence summary",
              "title": "A concise 3-5 word title that captures the main topic"
            }
            
            The title should be very short but descriptive, like a newspaper headline.
            For example:
            - "Team Project Planning" instead of "Discussion about the upcoming team project planning session"
            - "Morning Workout Goals" instead of "Setting new goals for my morning workout routine"
            - "Beach Sunset Photo" instead of "A beautiful photograph of the sunset at the beach yesterday evening"
            
            For subcategories, strictly use these predefined options for each category:
            
            personal:
            - "health_and_wellness" - for entries about physical health, exercise, nutrition
            - "mental_health" - for entries about emotional wellbeing, therapy, stress
            - "personal_growth" - for entries about self-improvement, goals, habits
            - "relationships" - for entries about family, romance, friendships
            - "spirituality" - for entries about faith, meditation, beliefs
            - "daily_life" - for entries about routines, experiences, observations

            work:
            - "projects" - for entries about specific work assignments or initiatives
            - "career_development" - for entries about skills, learning, advancement
            - "workplace_dynamics" - for entries about colleagues, culture, communication
            - "job_search" - for entries about finding work, applications, interviews
            - "business_ideas" - for entries about entrepreneurship, innovation
            - "work_life_balance" - for entries about managing professional/personal life

            social:
            - "friendships" - for entries about friends and social connections
            - "family" - for entries about family relationships and dynamics
            - "events" - for entries about social gatherings, parties, meetups
            - "community" - for entries about neighborhood, local involvement
            - "online_social" - for entries about social media, online communities
            - "networking" - for entries about professional connections

            interests:
            - "arts_and_creativity" - for entries about art, music, writing, crafts
            - "sports_and_fitness" - for entries about athletics, exercise
            - "technology" - for entries about gadgets, programming, digital interests
            - "entertainment" - for entries about movies, games, books, media
            - "travel" - for entries about trips, places, cultural experiences
            - "learning" - for entries about new skills, knowledge acquisition

            school:
            - "academics" - for entries about courses, studying, grades
            - "student_life" - for entries about campus activities, dorm life
            - "assignments" - for entries about homework, projects, papers
            - "exams" - for entries about tests, preparation, results
            - "group_work" - for entries about collaboration, study groups
            - "career_planning" - for entries about future profession plans

            Choose the most appropriate category and subcategory based on the content.
            If the content doesn't clearly fit into any subcategory, use the most general one for that category.`
          },
          {
            role: 'user',
            content: formattedContent
          }
        ],
        temperature: 0.3,
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

      // Normalize and find similar subcategory
      if (processedData.subcategory) {
        processedData.subcategory = await getSimilarSubcategory(
          supabase, 
          processedData.category, 
          processedData.subcategory
        );
      }

      // Normalize and find similar tags
      processedData.tags = await getSimilarTags(supabase, processedData.tags || []);
      
    } catch (error) {
      console.error('Error parsing category response:', error);
      throw new Error('Failed to parse OpenAI response');
    }

    // Add the formatted content and entry comments to the response
    processedData.content = content.length > 10000 ? content.substring(0, 10000) + "\n\n[Content truncated due to length limitations...]" : content;
    processedData.formatted_content = formattedContent;
    processedData.entry_comments = comments;
    processedData.was_content_truncated = content.length > 10000;
    
    // Use the explicitly generated title from GPT-4, or fall back to a truncated summary
    processedData.title = processedData.title || processedData.summary
      .split('.')[0]
      .replace(/["']/g, '')
      .replace(/\.{3,}$/, '')
      .trim();

    // If this is an image entry, add the image URL to attachments
    if (type === "image") {
      processedData.has_attachments = true;
      processedData.attachments = [{
        type: "image",
        url: content,
        caption: processedData.summary
      }];
    }

    console.log('Final processed data:', processedData);

    // Create the entry in the database
    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert([{
        user_id,
        content: processedData.content,
        formatted_content: processedData.formatted_content,
        entry_comments: processedData.entry_comments,
        title: processedData.title,
        category: processedData.category,
        subcategory: processedData.subcategory,
        tags: processedData.tags,
        summary: processedData.summary,
        has_attachments: processedData.has_attachments,
        attachments: processedData.attachments,
        folder: folder,
        was_content_truncated: processedData.was_content_truncated
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
