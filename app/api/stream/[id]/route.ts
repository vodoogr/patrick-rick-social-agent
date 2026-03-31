import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return new NextResponse("GOOGLE_DRIVE_API_KEY Missing in ENV", { status: 500 });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 403) {
        return new NextResponse("Permission Denied: File might not be public or Drive API restricted.", { status: 403 });
      }
      return new NextResponse(`Drive API Error: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has('Content-Type')) {
      headers.set('Content-Type', response.headers.get('Content-Type')!);
    } else {
      headers.set('Content-Type', 'audio/mpeg'); // Fallback
    }

    if (response.headers.has('Content-Length')) {
      headers.set('Content-Length', response.headers.get('Content-Length')!);
    }
    
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error("Audio streaming error:", error);
    return new NextResponse("Internal Server Error During Native Stream", { status: 500 });
  }
}
