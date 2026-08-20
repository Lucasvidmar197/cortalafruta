export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'menu.json');

async function ensureDataFile() {
  const dirPath = path.dirname(dataFilePath);
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
  
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, '[]', 'utf-8');
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Error reading menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataFile();
    const newItem = await request.json();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const menu = JSON.parse(data);
    
    newItem.id = Date.now().toString();
    menu.push(newItem);
    
    await fs.writeFile(dataFilePath, JSON.stringify(menu, null, 2), 'utf-8');
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error saving menu data' }, { status: 500 });
  }
}
