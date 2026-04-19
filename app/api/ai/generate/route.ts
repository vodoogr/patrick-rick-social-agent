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
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      {
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
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('Gemini generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
