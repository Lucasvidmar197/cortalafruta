import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const glbFile = formData.get('glb') as File | null;
    const usdzFile = formData.get('usdz') as File | null;
    const imageFiles = formData.getAll('images') as File[];

    if (!glbFile && !usdzFile && imageFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const resultPaths: { glb?: string; usdz?: string; images?: string[] } = { images: [] };

    if (glbFile && glbFile.size > 0) {
      const buffer = Buffer.from(await glbFile.arrayBuffer());
      const fileName = `${Date.now()}-${glbFile.name.replace(/\\s+/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      resultPaths.glb = `/uploads/${fileName}`;
    }

    if (usdzFile && usdzFile.size > 0) {
      const buffer = Buffer.from(await usdzFile.arrayBuffer());
      const fileName = `${Date.now()}-${usdzFile.name.replace(/\\s+/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      resultPaths.usdz = `/uploads/${fileName}`;
    }

    for (const img of imageFiles) {
      if (img.size > 0) {
        const buffer = Buffer.from(await img.arrayBuffer());
        const fileName = `${Date.now()}-${img.name.replace(/\\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        resultPaths.images!.push(`/uploads/${fileName}`);
      }
    }

    return NextResponse.json(resultPaths, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
