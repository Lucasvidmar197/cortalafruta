"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  glbUrl: string;
  usdzUrl: string;
  scale?: number;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

function MenuContent() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Destacados");
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
      if (mesa) setTableNumber(mesa);
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
        console.error("Error cargando el menú:", err);
        setLoading(false);
      });
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(""), 4000);
  };

  const callWaiter = async () => {
    if (!tableNumber) return;
    setIsCallingWaiter(true);
    const { error } = await supabase.from('service_requests').insert({
      table_number: parseInt(tableNumber),
      request_type: 'mozo'
    });
    setIsCallingWaiter(false);
    if (!error) showNotification("🔔 El mozo está en camino");
  };

  const askForBill = async () => {
    if (!tableNumber) return;
    setIsAskingBill(true);
    const { error } = await supabase.from('service_requests').insert({
      table_number: parseInt(tableNumber),
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
      return [...prev, { item, quantity: 1 }];
    });
    showNotification(`Se añadió ${item.name}`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter(c => c.item.id !== itemId));
  };

  const submitOrder = async () => {
    if (!tableNumber || cart.length === 0) return;
    setIsOrdering(true);
    
    const total = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
    const itemsJson = cart.map(c => ({ id: c.item.id, name: c.item.name, quantity: c.quantity, price: c.item.price }));

    const { error } = await supabase.from('orders').insert({
      table_number: parseInt(tableNumber),
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-28 font-serif">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-sans tracking-wide shadow-2xl transition-all">
          {notificationMsg}
        </div>
      )}

      {/* Header Premium (Fine Dining) */}
      <header className="pt-16 pb-12 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-light tracking-[0.3em] uppercase mb-4 text-zinc-900">
          L'Atelier
        </h1>
        <div className="w-12 h-[1px] bg-zinc-300 mb-4"></div>
        <p className="text-zinc-500 font-sans text-xs tracking-[0.2em] uppercase mb-2">
          Experiencia Culinaria
        </p>
        {tableNumber ? (
          <p className="mt-4 text-zinc-900 font-sans text-xs border border-zinc-200 bg-white px-4 py-1 rounded-full shadow-sm">
            Mesa {tableNumber}
          </p>
        ) : (
          <p className="mt-4 text-zinc-500 font-sans text-xs italic">
            Modo Catálogo
          </p>
        )}
      </header>

      {/* Categorías */}
      <nav className="mb-10 md:mb-16 px-6 overflow-x-auto no-scrollbar">
        <div className="flex justify-start md:justify-center gap-8 md:gap-10 min-w-max">
          {["Destacados", "Entradas", "Principales", "Postres"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 text-xs font-sans tracking-widest uppercase transition-all ${
                activeCategory === cat
                  ? "text-zinc-900 border-b border-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 max-w-4xl mx-auto">
        <div className="space-y-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : menu.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 mt-1">El restaurante aún no ha subido platos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              {menu.map((item) => (
                <div key={item.id} className="bg-white group flex flex-col shadow-sm">
                  
                  {/* Visor 3D / Imagen */}
                  <div className="h-80 bg-zinc-100/50 relative w-full flex items-center justify-center overflow-hidden">
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
                    ) : (
                      <div className="text-zinc-400 font-light tracking-widest text-xs uppercase">Sin imagen</div>
                    )}
                    
                    {/* Botón Flotante AR */}
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
                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-zinc-900 border border-zinc-200 px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2"
                      >
                        AR
                      </button>
                    )}
                  </div>
                  
                  {/* Info del Plato */}
                  <div className="pt-6 pb-6 px-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-baseline mb-3">
                      <h2 className="text-xl font-light text-zinc-900 tracking-wide">{item.name}</h2>
                      <span className="text-sm font-medium text-zinc-900">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-sans font-light leading-relaxed mb-6 flex-grow">{item.description}</p>
                    
                    {tableNumber && (
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-full py-3 border border-zinc-900 text-zinc-900 font-sans text-xs tracking-widest uppercase hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        Añadir a la orden
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Floating Actions for Table */}
      {tableNumber && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 p-3 md:px-4 md:py-4 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex gap-2">
            <button 
              onClick={callWaiter}
              disabled={isCallingWaiter}
              className="px-3 py-3 md:px-4 bg-zinc-100 text-zinc-900 font-sans text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-1.5 active:bg-zinc-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              🛎️ <span className="hidden sm:inline">Mozo</span>
            </button>
            <button 
              onClick={askForBill}
              disabled={isAskingBill}
              className="px-3 py-3 md:px-4 bg-zinc-100 text-zinc-900 font-sans text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-1.5 active:bg-zinc-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              🧾 <span className="hidden sm:inline">Cuenta</span>
            </button>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative px-4 md:px-6 py-3 bg-zinc-900 text-white font-sans text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-2 active:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Pedido
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
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
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-light text-xl tracking-wide">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-2xl font-light">&times;</button>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-zinc-500 font-sans font-light text-sm text-center mt-10">Tu carrito está vacío.</p>
              ) : (
                <div className="space-y-6">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="font-sans text-sm text-zinc-900">{c.quantity}x {c.item.name}</p>
                        <p className="font-sans text-xs text-zinc-400 mt-1">${c.item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-sans text-sm font-medium">${(c.item.price * c.quantity).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(c.item.id)} className="text-red-500 text-xs uppercase font-sans tracking-wider hover:underline">Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-sans text-sm text-zinc-500 uppercase tracking-widest">Total</span>
                  <span className="font-sans text-xl font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={submitOrder}
                  disabled={isOrdering}
                  className="w-full py-4 bg-zinc-900 text-white font-sans text-sm tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:opacity-70 flex justify-center items-center h-[52px]"
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
