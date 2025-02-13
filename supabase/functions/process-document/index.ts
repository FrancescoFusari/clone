
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse as parsePdf } from 'npm:pdf-parse';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        try {
          const pdfData = await parsePdf(uint8Array);
          text = pdfData.text;
          console.log('PDF processed successfully, text length:', text.length);
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          throw new Error(`Failed to parse PDF: ${pdfError.message}`);
        }
        break;
        
      case 'txt':
        text = new TextDecoder().decode(buffer);
        console.log('TXT processed successfully, text length:', text.length);
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
    
    return text;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('Document URL is required');
    }

    console.log('Processing document at URL:', url);
    const extractedText = await processDocument(url);
    
    return new Response(
      JSON.stringify({ 
        text: extractedText,
        length: extractedText.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in document processing:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
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
