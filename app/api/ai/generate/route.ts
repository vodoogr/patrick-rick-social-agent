import { NextResponse } from 'next/server';

/**
 * POST /api/ai/generate
 * 
 * Server-side endpoint for Gemini 3.1 Pro content generation.
 * Generates campaign hooks, captions, and visual prompts for media generation.
 */
export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt, temperature = 0.7 } = await req.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY is missing from environment variables');
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    // Model choice: Optimized Lite version for low-cost high-volume content
    const model = 'gemini-3.1-flash-lite-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUSER REQUEST: ${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json'
            }
          }),
        });

        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Gemini 429 Rate Limit. Attempt ${attempt + 1}. Retrying in ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini API error (Status ${response.status}):`, errText);
          throw new Error(`Gemini API error: ${response.status} - ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          console.error('Gemini returned no candidates:', JSON.stringify(data));
          throw new Error('Gemini returned no content. Check for safety filters.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return NextResponse.json({ text });

      } catch (err: any) {
        console.error(`Attempt ${attempt + 1} failed:`, err.message);
        lastError = err;
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw lastError || new Error('Unknown error during generation');

  } catch (err: any) {
    console.error('Gemini generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
