import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const glbFile = formData.get('glb') as File | null;
    const usdzFile = formData.get('usdz') as File | null;
    const imageFiles = formData.getAll('images') as File[];

    if (!glbFile && !usdzFile && imageFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const resultPaths: { glb?: string; usdz?: string; images?: string[] } = { images: [] };

    // Función auxiliar para subir a Supabase Storage
    const uploadToSupabase = async (file: File) => {
      const buffer = await file.arrayBuffer();
      const fileName = `${Date.now()}-${file.name.replace(/\\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('menu-assets')
        .upload(fileName, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('menu-assets')
        .getPublicUrl(fileName);
        
      return publicUrlData.publicUrl;
    };

    if (glbFile && glbFile.size > 0) {
      resultPaths.glb = await uploadToSupabase(glbFile);
    }

    if (usdzFile && usdzFile.size > 0) {
      resultPaths.usdz = await uploadToSupabase(usdzFile);
    }

    for (const img of imageFiles) {
      if (img.size > 0) {
        const url = await uploadToSupabase(img);
        resultPaths.images!.push(url);
      }
    }

    return NextResponse.json(resultPaths, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files to Supabase' }, { status: 500 });
  }
}
