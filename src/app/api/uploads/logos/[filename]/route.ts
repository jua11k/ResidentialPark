import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Evitar directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const filepath = path.join(process.cwd(), 'public', 'uploads', 'logos', filename);

    if (!fs.existsSync(filepath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filepath);
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.gif') contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error("Error serving uploaded logo:", e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
