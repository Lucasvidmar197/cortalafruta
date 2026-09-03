export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  expirationDate?: string; // "YYYY-MM-DD"
  totalUsageLimit?: number;
  currentUses: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "coupon-default-1",
    code: "BIENVENIDA10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 8000,
    totalUsageLimit: 100,
    currentUses: 0,
    isActive: true,
    description: "10% de bienvenida para primeros pedidos",
    createdAt: new Date().toISOString()
  }
];

// GET: Obtener todos los cupones configurados
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', 'coupons-config')
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.description) {
      return NextResponse.json(DEFAULT_COUPONS);
    }

    try {
      const parsed: Coupon[] = JSON.parse(data.description);
      return NextResponse.json(Array.isArray(parsed) ? parsed : DEFAULT_COUPONS);
    } catch {
      return NextResponse.json(DEFAULT_COUPONS);
    }
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(DEFAULT_COUPONS);
  }
}

// Concurrency queue to serialize read-modify-write operations on the server
let couponUpdateQueue: Promise<any> = Promise.resolve();

// POST: Guardar lista de cupones desde el panel admin (protegido con sesión de Supabase Auth)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere token de sesión de administrador.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Token de administrador inválido o expirado.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const coupons: Coupon[] = body.coupons || [];

    const payload = {
      id: "coupons-config",
      name: "Configuración de Cupones",
      description: JSON.stringify(coupons),
      price: 0,
      scale: 1,
      glburl: null,
      usdzurl: null,
      category: "Configuracion",
      image_urls: []
    };

    const { error } = await supabase
      .from('menu_items')
      .upsert(payload);

    if (error) throw error;

    return NextResponse.json({ success: true, count: coupons.length });
  } catch (error: any) {
    console.error('Error saving coupons:', error);
    return NextResponse.json({ error: error.message || 'Error saving coupons' }, { status: 500 });
  }
}

// Internal handler for serialized coupon usage increment
async function executeIncrement(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  // 1. Obtener estado fresco desde la base de datos
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', 'coupons-config')
    .maybeSingle();

  if (error) throw error;

  let coupons: Coupon[] = DEFAULT_COUPONS;
  if (data && data.description) {
    try {
      coupons = JSON.parse(data.description);
    } catch {
      coupons = DEFAULT_COUPONS;
    }
  }

  const couponIndex = coupons.findIndex(c => c.code.trim().toUpperCase() === normalizedCode);
  if (couponIndex === -1) {
    return NextResponse.json({ error: 'El cupón no existe.' }, { status: 404 });
  }

  const coupon = coupons[couponIndex];

  // 2. Validación atómica en servidor: ¿Está inactivo?
  if (!coupon.isActive) {
    return NextResponse.json({ error: 'El cupón está inactivo.', inactive: true }, { status: 400 });
  }

  // 3. Validación atómica en servidor: ¿Venció?
  if (coupon.expirationDate) {
    const expDate = new Date(coupon.expirationDate + 'T23:59:59');
    if (new Date() > expDate) {
      return NextResponse.json({ error: 'El cupón ya venció.', expired: true }, { status: 400 });
    }
  }

  // 4. Validación atómica en servidor: ¿Alcanzó el límite de usos?
  if (coupon.totalUsageLimit && (coupon.currentUses || 0) >= coupon.totalUsageLimit) {
    return NextResponse.json({ 
      error: 'Este cupón ya alcanzó su límite de usos disponibles (agotado).', 
      exhausted: true 
    }, { status: 400 });
  }

  // 5. Incrementar contador
  coupons[couponIndex].currentUses = (coupons[couponIndex].currentUses || 0) + 1;

  // 6. Guardar en base de datos
  const payload = {
    id: "coupons-config",
    name: "Configuración de Cupones",
    description: JSON.stringify(coupons),
    price: 0,
    scale: 1,
    glburl: null,
    usdzurl: null,
    category: "Configuracion",
    image_urls: []
  };

  const { error: upsertError } = await supabase.from('menu_items').upsert(payload);
  if (upsertError) throw upsertError;

  return NextResponse.json({ 
    success: true, 
    code: normalizedCode, 
    currentUses: coupons[couponIndex].currentUses,
    totalUsageLimit: coupon.totalUsageLimit
  });
}

// PATCH: Incrementar el contador de usos (currentUses) con encolamiento atómico serializado
export async function PATCH(request: Request): Promise<Response> {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Serializar operaciones concurrentes a través de la cola de promesas
    return new Promise<Response>((resolve) => {
      couponUpdateQueue = couponUpdateQueue
        .catch(() => {}) // Mantener la cola viva si una petición previa falló
        .then(async () => {
          try {
            const result = await executeIncrement(code);
            resolve(result);
          } catch (err: any) {
            console.error('Error in executeIncrement:', err);
            resolve(NextResponse.json({ error: err.message || 'Error updating usage' }, { status: 500 }));
          }
        });
    });
  } catch (error: any) {
    console.error('Error incrementing coupon usage:', error);
    return NextResponse.json({ error: error.message || 'Error updating usage' }, { status: 500 });
  }
}
