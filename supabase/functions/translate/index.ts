type TranslateRequest = {
  word?: string;
  source?: string;
  target?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const azureTranslatorEndpoint = (
  Deno.env.get('AZURE_TRANSLATOR_ENDPOINT') ||
  'https://api.cognitive.microsofttranslator.com'
).replace(/\/$/, '');
const azureTranslatorKey = Deno.env.get('AZURE_TRANSLATOR_KEY') || '';
const azureTranslatorRegion = Deno.env.get('AZURE_TRANSLATOR_REGION') || '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return Response.json({ ok: true }, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const { word, source = 'es', target = 'en' } = await req.json() as TranslateRequest;

    if (!word?.trim()) {
      return Response.json(
        { error: 'word is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!azureTranslatorKey || !azureTranslatorRegion) {
      console.warn('[translate] Azure Translator secrets are not configured');
      return Response.json({ translation: '' }, { headers: corsHeaders });
    }

    const params = new URLSearchParams({
      'api-version': '3.0',
      from: source,
      to: target,
    });

    const response = await fetch(`${azureTranslatorEndpoint}/translate?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': azureTranslatorKey,
        'Ocp-Apim-Subscription-Region': azureTranslatorRegion,
      },
      body: JSON.stringify([{ Text: word }]),
    });

    if (!response.ok) {
      console.warn('[translate] provider returned', response.status);
      return Response.json({ translation: '' }, { headers: corsHeaders });
    }

    const data = await response.json();
    const translation = data?.[0]?.translations?.[0]?.text ?? '';
    return Response.json({ translation }, { headers: corsHeaders });
  } catch (error) {
    console.warn('[translate] unavailable:', error instanceof Error ? error.message : error);
    return Response.json({ translation: '' }, { headers: corsHeaders });
  }
});
