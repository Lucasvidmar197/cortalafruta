"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  glbUrl: string;
  usdzUrl: string;
  imageUrls?: string[];
  scale?: number;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

function MenuContent() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("Destacados");
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  
  // Shopping Cart & Order States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Service Request States
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isAskingBill, setIsAskingBill] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get("mesa");
      if (mesa) {
        supabase.from('tables').select('name').eq('name', mesa).single().then(({ data }) => {
          if (data) {
            setTableNumber(mesa);
          } else {
            setNotificationMsg(`La mesa "${mesa}" no existe. Modo catálogo activado.`);
            setTimeout(() => setNotificationMsg(""), 5000);
          }
        });
      }
    }

    fetch("/api/menu?t=" + Date.now(), { 
      cache: "no-store",
      headers: {
        "Bypass-Tunnel-Reminder": "true"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(""), 3000);
  };

  const callWaiter = async () => {
    if (!tableNumber) return;
    setIsCallingWaiter(true);
    const { error } = await supabase.from('service_requests').insert({
      table_number: tableNumber,
      request_type: 'mozo'
    });
    setIsCallingWaiter(false);
    if (!error) showNotification("🔔 El mozo está en camino");
  };

  const askForBill = async () => {
    if (!tableNumber) return;
    setIsAskingBill(true);
    const { error } = await supabase.from('service_requests').insert({
      table_number: tableNumber,
      request_type: 'cuenta'
    });
    setIsAskingBill(false);
    if (!error) showNotification("🧾 La cuenta está en camino");
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1, notes: "" }];
    });
    showNotification(`Se añadió ${item.name}`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter(c => c.item.id !== itemId));
  };

  const updateCartNote = (itemId: string, notes: string) => {
    setCart((prev) => prev.map(c => c.item.id === itemId ? { ...c, notes } : c));
  };

  const submitOrder = async () => {
    if (!tableNumber || cart.length === 0) return;
    setIsOrdering(true);
    
    const total = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
    const itemsJson = cart.map(c => ({ id: c.item.id, name: c.item.name, quantity: c.quantity, price: c.item.price, notes: c.notes }));

    const { error } = await supabase.from('orders').insert({
      table_number: tableNumber,
      items: itemsJson,
      total: total
    });

    setIsOrdering(false);
    if (!error) {
      setCart([]);
      setIsCartOpen(false);
      showNotification("✅ ¡Tu pedido fue enviado a la cocina!");
    }
  };

  const cartTotal = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
  const cartItemsCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  return (
    <div className="min-h-screen bg-ivory text-charcoal pb-28">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-6 left-1/2 z-50 bg-ink text-white px-6 py-3 text-sm font-sans tracking-wide shadow-2xl animate-toast">
          {notificationMsg}
        </div>
      )}

      {/* Header — Fine Dining */}
      <header className="pt-14 pb-10 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-[0.25em] uppercase text-charcoal">
          L'Atelier
        </h1>
        <div className="flex items-center gap-3 mt-4 mb-3">
          <div className="w-8 h-px bg-stone"></div>
          <span className="text-stone text-xs">✦</span>
          <div className="w-8 h-px bg-stone"></div>
        </div>
        <p className="text-stone font-sans text-[11px] tracking-[0.25em] uppercase">
          Experiencia Culinaria
        </p>
        {tableNumber ? (
          <p className="mt-5 text-charcoal font-sans text-[11px] border border-gold/40 bg-parchment px-5 py-1.5 tracking-widest uppercase">
            {isNaN(Number(tableNumber)) ? tableNumber : `Mesa ${tableNumber}`}
          </p>
        ) : (
          <p className="mt-5 text-stone font-sans text-[11px] italic tracking-wider">
            Modo Catálogo
          </p>
        )}
      </header>

      {/* Categorías */}
      <nav className="mb-10 px-6 overflow-x-auto no-scrollbar">
        <div className="flex justify-start md:justify-center gap-6 md:gap-10 min-w-max">
          {Array.from(new Set(menu.map(item => item.category || "Destacados"))).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 text-[11px] font-sans tracking-[0.2em] uppercase transition-all ${
                activeCategory === cat
                  ? "text-charcoal border-b border-charcoal"
                  : "text-stone hover:text-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 md:px-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-charcoal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : menu.filter(item => (item.category || "Destacados") === activeCategory).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone text-sm italic">No hay platos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {menu.filter(item => (item.category || "Destacados") === activeCategory).map((item, idx) => (
              <div 
                key={item.id} 
                className={`bg-parchment group flex flex-col rounded-lg overflow-hidden animate-fade-in-up delay-${Math.min(idx + 1, 6)}`}
              >
                
                {/* Visor 3D / Imagen */}
                <div className="h-72 md:h-80 bg-ivory/60 relative w-full flex items-center justify-center overflow-hidden">
                  {item.glbUrl ? (
                    React.createElement('model-viewer', {
                      id: `viewer-${item.id}`,
                      src: typeof window !== 'undefined' ? new URL(encodeURI(item.glbUrl), window.location.origin).href : encodeURI(item.glbUrl),
                      'ios-src': item.usdzUrl ? (typeof window !== 'undefined' ? new URL(encodeURI(item.usdzUrl), window.location.origin).href : encodeURI(item.usdzUrl)) : undefined,
                      alt: `Modelo 3D de ${item.name}`,
                      ar: true,
                      'ar-modes': "scene-viewer webxr quick-look",
                      'ar-scale': "auto",
                      'camera-controls': true,
                      'auto-rotate': true,
                      'disable-zoom': true,
                      'disable-pan': true,
                      'min-camera-orbit': "auto 0deg auto",
                      'max-camera-orbit': "auto 85deg auto",
                      'shadow-intensity': "1.0",
                      'exposure': "0.6",
                      'tone-mapping': "aces",
                      'environment-image': "neutral",
                      'loading': "eager",
                      'reveal': "auto",
                      style: { width: "100%", height: "100%", backgroundColor: "transparent" },
                      class: "w-full h-full object-contain"
                    })
                  ) : item.imageUrls && item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-stone font-light tracking-widest text-xs uppercase">Sin imagen</div>
                  )}
                  
                  {/* Botón AR */}
                  {item.glbUrl && (
                    <button
                      onClick={() => {
                        const viewer = document.getElementById(`viewer-${item.id}`) as any;
                        if (viewer && viewer.canActivateAR) {
                          viewer.activateAR();
                        } else {
                          alert("La realidad aumentada no está disponible en este dispositivo.");
                        }
                      }}
                      className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-charcoal border border-stone/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] hover:bg-charcoal hover:text-white transition-all flex items-center gap-1.5 rounded"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3L2 8l10 5 10-5-10-5z"/>
                        <path d="M2 8v8l10 5V11"/>
                        <path d="M22 8v8l-10 5V11"/>
                      </svg>
                      Ver en AR
                    </button>
                  )}
                </div>
                
                {/* Info del Plato */}
                <div className="pt-5 pb-5 px-5 flex flex-col flex-grow">
                  <div className="flex items-baseline justify-between gap-2 mb-2 w-full">
                    <h2 className="font-serif text-lg md:text-xl font-normal text-charcoal leading-snug">{item.name}</h2>
                    <span className="flex-1 border-b border-dotted border-stone/40 mx-2 relative -top-1 min-w-[12px]"></span>
                    <span className="font-sans text-base md:text-lg font-medium text-charcoal shrink-0">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-stone text-[13px] font-sans font-light leading-relaxed mb-5 flex-grow">{item.description}</p>
                  
                  {tableNumber && (
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-full py-3 border border-charcoal/20 text-charcoal font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-charcoal hover:text-white active:animate-btn-pulse transition-colors"
                    >
                      Añadir a la orden
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Floating Actions */}
      {tableNumber && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-stone/20 p-3 md:px-4 md:py-4 z-40 flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={callWaiter}
              disabled={isCallingWaiter}
              className="px-3 py-3 md:px-4 bg-parchment text-charcoal font-sans text-[10px] md:text-[11px] tracking-[0.15em] uppercase flex items-center gap-1.5 active:bg-stone/20 transition-colors disabled:opacity-50 whitespace-nowrap rounded"
            >
              🛎️ <span className="hidden sm:inline">Mozo</span>
            </button>
            <button 
              onClick={askForBill}
              disabled={isAskingBill}
              className="px-3 py-3 md:px-4 bg-parchment text-charcoal font-sans text-[10px] md:text-[11px] tracking-[0.15em] uppercase flex items-center gap-1.5 active:bg-stone/20 transition-colors disabled:opacity-50 whitespace-nowrap rounded"
            >
              🧾 <span className="hidden sm:inline">Cuenta</span>
            </button>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative px-4 md:px-6 py-3 bg-charcoal text-white font-sans text-[10px] md:text-[11px] tracking-[0.15em] uppercase flex items-center gap-2 active:bg-ink transition-colors whitespace-nowrap rounded"
          >
            Pedido
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-sans font-medium">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-ivory h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-stone/20 flex justify-between items-center">
              <h2 className="font-serif text-xl font-normal tracking-wide">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone hover:text-charcoal text-2xl font-light">&times;</button>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-stone font-sans font-light text-sm text-center mt-10">Tu carrito está vacío.</p>
              ) : (
                <div className="space-y-5">
                  {cart.map((c, i) => (
                    <div key={i} className="flex flex-col gap-2 border-b border-stone/15 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-sans text-sm text-charcoal">{c.quantity}x {c.item.name}</p>
                          <p className="font-sans text-xs text-stone mt-1">${c.item.price.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-sans text-sm font-medium">${(c.item.price * c.quantity).toFixed(2)}</p>
                          <button onClick={() => removeFromCart(c.item.id)} className="text-stone text-[11px] uppercase font-sans tracking-wider hover:text-charcoal transition-colors">Quitar</button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={c.notes || ""} 
                        onChange={(e) => updateCartNote(c.item.id, e.target.value)}
                        placeholder="Aclaraciones (ej: sin sal, extra queso)" 
                        className="w-full text-xs font-sans p-2 border border-stone/20 bg-parchment outline-none focus:border-stone focus:bg-white transition-colors rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-parchment border-t border-stone/20">
                <div className="flex justify-between items-center mb-5">
                  <span className="font-sans text-[11px] text-stone uppercase tracking-[0.2em]">Total</span>
                  <span className="font-serif text-xl">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={submitOrder}
                  disabled={isOrdering}
                  className="w-full py-4 bg-charcoal text-white font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-ink transition-colors disabled:opacity-70 flex justify-center items-center h-[52px] rounded"
                >
                  {isOrdering ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Enviar a cocina"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center">Cargando...</div>}>
      <MenuContent />
    </Suspense>
  );
}
