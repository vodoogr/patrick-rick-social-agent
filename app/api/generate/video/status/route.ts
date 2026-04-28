import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const operationId = searchParams.get('operationId');

  if (!operationId) {
    return NextResponse.json({ error: 'operationId is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Veo Operation API error:', errText);
      throw new Error(`Veo Operation API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    if (data.done) {
      if (data.error) {
        return NextResponse.json({ status: 'failed', error: data.error.message });
      }

      const prediction = data.response?.predictions?.[0];
      if (prediction?.bytesBase64Encoded) {
        const mimeType = prediction.mimeType || 'video/mp4';
        const videoUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;

        return NextResponse.json({
          status: 'completed',
          videoUrl,
          mimeType,
        });
      }
      
      // Some versions of the API might return the video in a different field
      if (data.response?.video?.uri) {
         return NextResponse.json({
          status: 'completed',
          videoUrl: data.response.video.uri,
          mimeType: 'video/mp4',
        });
      }

      return NextResponse.json({ status: 'failed', error: 'No video data in completed operation' });
    }

    return NextResponse.json({ status: 'processing', progress: data.metadata?.progressPercentage || 0 });
  } catch (err: any) {
    console.error('Video status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
