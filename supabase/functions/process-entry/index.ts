import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatText(text: string): string {
  // If text already contains paragraphs (double newlines), preserve them
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content } = await req.json()
    console.log('Processing entry:', content)

    // Format the content if needed
    const formattedContent = formatText(content);
    console.log('Formatted content:', formattedContent);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        ]
      })
    })

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const aiResult = await openAIResponse.json()
    console.log('AI processing result:', aiResult)
    
    const processedData = JSON.parse(aiResult.choices[0].message.content)
    // Add the formatted content to the response
    processedData.content = formattedContent;

    return new Response(
      JSON.stringify(processedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})