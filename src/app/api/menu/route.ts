export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Mapear los nombres de columnas de postgres (minúsculas) a la interfaz del frontend
    const formattedData = data.map(item => ({
      ...item,
      glbUrl: item.glburl,
      usdzUrl: item.usdzurl,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error reading menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newItem = await request.json();
    
    const id = Date.now().toString();
    const { data, error } = await supabase.from('menu_items').insert({
      id: id,
      name: newItem.name,
      description: newItem.description || '',
      price: newItem.price || 0,
      scale: newItem.scale || 1,
      glburl: newItem.glbUrl,
      usdzurl: newItem.usdzUrl
    }).select().single();
    
    if (error) throw error;

    const formattedData = {
      ...data,
      glbUrl: data.glburl,
      usdzUrl: data.usdzurl,
    };
    
    return NextResponse.json(formattedData, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error saving menu data' }, { status: 500 });
  }
}
