import { NextResponse } from 'next/server';

/**
 * POST /api/generate/image
 * 
 * Server-side endpoint for Google Imagen image generation.
 * When GOOGLE_AI_API_KEY is configured, this will call the real Imagen API.
 * Otherwise it falls back to a high-quality placeholder for development.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = '1:1', style = 'cinematic', negativePrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      // ═══════════════════════════════════════════
      // PRODUCTION: Call Google Imagen 3 API
      // ═══════════════════════════════════════════
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio,
                negativePrompt: negativePrompt || '',
                personGeneration: 'ALLOW_ADULT',
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('Google Imagen API error:', errText);
          throw new Error(`Imagen API error: ${response.status}`);
        }

        const data = await response.json();
        const prediction = data.predictions?.[0];
        
        if (!prediction?.bytesBase64Encoded) {
          throw new Error('No image data in Imagen response');
        }

        // Convert base64 to data URL for preview
        const mimeType = prediction.mimeType || 'image/png';
        const imageUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;

        return NextResponse.json({
          imageUrl,
          mimeType,
          prompt,
          provider: 'google',
          model: 'imagen-3.0-generate-002',
          generatedAt: new Date().toISOString(),
        });
      } catch (apiErr: any) {
        console.error('Imagen API call failed, falling back to placeholder:', apiErr.message);
        // Fall through to placeholder
      }
    }

    // ═══════════════════════════════════════════
    // DEVELOPMENT FALLBACK: Generate placeholder
    // ═══════════════════════════════════════════
    const width = aspectRatio === '9:16' ? 540 : aspectRatio === '16:9' ? 960 : 720;
    const height = aspectRatio === '9:16' ? 960 : aspectRatio === '16:9' ? 540 : 720;
    
    // Use a deterministic seed from the prompt for consistent previews
    const seed = prompt.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % 10000;
    
    // Generate a dark, cinematic gradient SVG as placeholder
    const hue1 = seed % 360;
    const hue2 = (hue1 + 40) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1},40%,12%)"/>
          <stop offset="50%" style="stop-color:hsl(${hue2},50%,18%)"/>
          <stop offset="100%" style="stop-color:hsl(${hue1},30%,8%)"/>
        </linearGradient>
        <filter id="noise"><feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0.1"/><feBlend in="SourceGraphic" mode="overlay"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.15"/>
      <text x="50%" y="46%" text-anchor="middle" font-family="system-ui" font-size="12" fill="rgba(255,255,255,0.3)" font-weight="bold">GOOGLE IMAGEN</text>
      <text x="50%" y="54%" text-anchor="middle" font-family="system-ui" font-size="10" fill="rgba(255,255,255,0.15)">${style.toUpperCase()} • ${aspectRatio}</text>
    </svg>`;

    const base64 = Buffer.from(svg).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${base64}`;

    return NextResponse.json({
      imageUrl,
      mimeType: 'image/svg+xml',
      prompt,
      provider: 'google',
      model: 'imagen-3.0-generate-002-dev',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
