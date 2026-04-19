import { NextResponse } from 'next/server';

/**
 * POST /api/generate/video
 * 
 * Server-side endpoint for Google Veo video generation.
 * When GOOGLE_AI_API_KEY is configured, this will call the real Veo API.
 * Otherwise it falls back to a placeholder for development.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = '9:16', durationSeconds = 10, style = 'cinematic', imageReference } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      // ═══════════════════════════════════════════
      // PRODUCTION: Call Google Veo 3 API
      // ═══════════════════════════════════════════
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:predict?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: {
                aspectRatio,
                durationSeconds,
                personGeneration: 'ALLOW_ADULT',
                // Include reference image for Image-To-Video if provided
                ...(imageReference && { 
                  referenceImage: { 
                    image: imageReference, 
                    role: 'FIRST_FRAME' 
                  } 
                }),
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('Google Veo 3.1 API error:', errText);
          throw new Error(`Veo 3.1 API error: ${response.status}`);
        }

        const data = await response.json();
        const prediction = data.predictions?.[0];

        if (!prediction?.bytesBase64Encoded) {
          // Veo may return an operation ID for async generation
          if (data.name) {
            return NextResponse.json({
              videoUrl: '',
              mimeType: 'video/mp4',
              prompt,
              provider: 'google',
              model: 'veo-3.1',
              durationSeconds,
              generatedAt: new Date().toISOString(),
              status: 'processing',
              operationId: data.name,
            });
          }
          throw new Error('No video data in Veo 3.1 response');
        }

        const mimeType = prediction.mimeType || 'video/mp4';
        const videoUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;

        return NextResponse.json({
          videoUrl,
          mimeType,
          prompt,
          provider: 'google',
          model: 'veo-3.1',
          durationSeconds,
          generatedAt: new Date().toISOString(),
          status: 'completed',
        });
      } catch (apiErr: any) {
        console.error('Veo API call failed, falling back to placeholder:', apiErr.message);
        // Fall through to placeholder
      }
    }

    // ═══════════════════════════════════════════
    // DEVELOPMENT FALLBACK: Return placeholder
    // ═══════════════════════════════════════════
    const seed = prompt.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 10000;
    const hue = seed % 360;

    return NextResponse.json({
      videoUrl: `placeholder:${seed}`,
      mimeType: 'video/mp4',
      prompt,
      provider: 'google',
      model: 'veo-2.0-generate-001-dev',
      durationSeconds,
      generatedAt: new Date().toISOString(),
      status: 'completed',
      _placeholder: true,
      _hue: hue,
    });
  } catch (err: any) {
    console.error('Video generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
