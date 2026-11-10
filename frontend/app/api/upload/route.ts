import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const colorTag = (formData.get('colorTag') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedUrls: { url: string; colorTag: string; name: string }[] = [];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine extension
      let ext = path.extname(file.name).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        // Fallback from MIME type
        if (file.type.includes('png')) ext = '.png';
        else if (file.type.includes('webp')) ext = '.webp';
        else if (file.type.includes('avif')) ext = '.avif';
        else if (file.type.includes('gif')) ext = '.gif';
        else ext = '.jpg';
      }

      // Generate unique safe filename
      const cleanColor = colorTag ? colorTag.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '-' : '';
      const uniqueName = `${cleanColor}${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      uploadedUrls.push({
        url: publicUrl,
        colorTag,
        name: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      url: uploadedUrls[0]?.url,
      urls: uploadedUrls.map((u) => u.url),
    });
  } catch (err: any) {
    console.error('[API_UPLOAD_ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
