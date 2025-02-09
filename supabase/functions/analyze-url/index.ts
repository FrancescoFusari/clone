
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
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const { url } = await req.json();
    console.log('Analyzing URL:', url);

    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url);
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }
    } catch (e) {
      console.error('Invalid URL:', e);
      throw new Error('Invalid URL provided');
    }

    // Fetch URL content with timeout and proper error handling
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      response = await fetch(validUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('HTTP error status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }

    // Get text content based on content type
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    let textContent;

    try {
      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        textContent = JSON.stringify(jsonData, null, 2);
      } else {
        const htmlContent = await response.text();
        
        // Extract text content from HTML
        textContent = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
          .replace(/<[^>]+>/g, ' ') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .slice(0, 8000); // Limit content length
      }

      if (!textContent) {
        throw new Error('No text content found in the URL');
      }

      console.log('Extracted text content length:', textContent.length);
      console.log('Content sample:', textContent.substring(0, 200) + '...');
    } catch (error) {
      console.error('Error processing content:', error);
      throw new Error(`Failed to process content: ${error.message}`);
    }

    // Process with OpenAI
    try {
      console.log('Sending request to OpenAI...');
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
              content: `Analyze the provided webpage content and return a JSON object with the following structure:
{
  "category": "personal" | "work" | "social" | "interests_and_hobbies" | "school",
  "subcategory": "string describing specific topic",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "1-2 sentence summary",
  "title": "concise title under 50 chars"
}
Return ONLY the JSON object, no additional text or formatting.`
            },
            {
              role: 'user',
              content: textContent
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.text();
        console.error('OpenAI API error:', aiResponse.status, errorData);
        throw new Error(`OpenAI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('OpenAI response received');

      if (!aiData.choices?.[0]?.message?.content) {
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
        throw new Error('Invalid data structure in analysis results');
      }

      // Add the original URL to the response
      processedData.url = url;

      console.log('Final processed data:', processedData);

      return new Response(
        JSON.stringify(processedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error in OpenAI processing:', error);
      throw new Error(`OpenAI processing failed: ${error.message}`);
    }
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
