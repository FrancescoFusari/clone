import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Analyzing URL:', url);

    // Fetch URL content
    const response = await fetch(url);
    const htmlContent = await response.text();

    // Extract text content from HTML (basic implementation)
    const textContent = htmlContent
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 8000); // Limit content length

    // Process with OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Analyze the following webpage content and return a JSON object with:
            {
              "category": one of ["personal", "work", "social", "interests_and_hobbies", "school"],
              "subcategory": a specific subcategory based on the content,
              "tags": an array of relevant keywords (max 5),
              "summary": a brief 1-2 sentence summary,
              "title": a concise, descriptive title (max 50 chars)
            }`
          },
          {
            role: 'user',
            content: textContent
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const processedData = JSON.parse(aiData.choices[0].message.content);

    // Add the original URL and content to the response
    processedData.content = `URL: ${url}\n\n${textContent}`;

    console.log('Processed URL data:', processedData);

    return new Response(
      JSON.stringify(processedData),
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