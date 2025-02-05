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
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 8000); // Limit content length

    console.log('Extracted text content:', textContent.substring(0, 200) + '...');

    // Process with OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a webpage content analyzer. Analyze the provided content and return a JSON object with the following structure EXACTLY:
{
  "category": "personal" | "work" | "social" | "interests_and_hobbies" | "school",
  "subcategory": "string describing specific topic",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "1-2 sentence summary",
  "title": "concise title under 50 chars"
}
Do not include any additional text or formatting in your response, only the JSON object.`
          },
          {
            role: 'user',
            content: textContent
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI API error:', aiResponse.status);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('OpenAI response:', aiData);

    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', aiData);
      throw new Error('Invalid response from OpenAI');
    }

    let processedData;
    try {
      const content = aiData.choices[0].message.content.trim();
      console.log('Attempting to parse JSON:', content);
      processedData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Failed to parse analysis results');
    }

    // Validate the processed data structure
    if (!processedData.category || !processedData.tags || !processedData.summary || !processedData.title) {
      console.error('Invalid data structure:', processedData);
      throw new Error('Invalid data structure in analysis results');
    }

    // Add the original URL and content to the response
    processedData.content = `URL: ${url}\n\n${textContent}`;

    console.log('Final processed data:', processedData);

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