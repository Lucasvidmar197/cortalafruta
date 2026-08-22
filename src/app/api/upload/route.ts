import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';

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

    const uploadToSupabase = async (file: File | Blob, fileNameStr: string, contentType: string) => {
      const buffer = await file.arrayBuffer();
      const fileName = `${Date.now()}-${fileNameStr.replace(/\\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('menu-assets')
        .upload(fileName, buffer, {
          contentType: contentType,
          upsert: false
        });

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('menu-assets')
        .getPublicUrl(fileName);
        
      return publicUrlData.publicUrl;
    };

    if (glbFile && glbFile.size > 0) {
      if (glbFile.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (Max 50MB)' }, { status: 413 });
      if (!glbFile.name.toLowerCase().endsWith('.glb')) return NextResponse.json({ error: 'Invalid format. Only .glb allowed for 3D models.' }, { status: 400 });
      
      try {
        // Inyectar Unlit para desactivar el "sol virtual" en AR
        const io = new NodeIO().registerExtensions([KHRMaterialsUnlit]);
        const buffer = await glbFile.arrayBuffer();
        const doc = await io.readBinary(new Uint8Array(buffer));
        const unlitExtension = doc.createExtension(KHRMaterialsUnlit);
        const unlit = unlitExtension.createUnlit();
        
        for (const material of doc.getRoot().listMaterials()) {
          material.setExtension('KHR_materials_unlit', unlit);
          material.setMetallicFactor(0);
          material.setRoughnessFactor(1);
        }
        
        const modifiedBuffer = await io.writeBinary(doc);
        const modifiedBlob = new Blob([modifiedBuffer], { type: 'model/gltf-binary' });
        resultPaths.glb = await uploadToSupabase(modifiedBlob, glbFile.name, 'model/gltf-binary');
      } catch (err) {
        console.error("Error processing GLB, uploading original:", err);
        resultPaths.glb = await uploadToSupabase(glbFile, glbFile.name, glbFile.type || 'model/gltf-binary');
      }
    }

    if (usdzFile && usdzFile.size > 0) {
      resultPaths.usdz = await uploadToSupabase(usdzFile, usdzFile.name, usdzFile.type || 'model/vnd.usdz+zip');
    }

    for (const img of imageFiles) {
      if (img.size > 0) {
        const url = await uploadToSupabase(img, img.name, img.type || 'image/jpeg');
        resultPaths.images!.push(url);
      }
    }

    return NextResponse.json(resultPaths, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files to Supabase' }, { status: 500 });
  }
}
