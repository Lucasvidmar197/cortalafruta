"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  glbUrl: string;
  usdzUrl: string;
  scale?: number;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Destacados");

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20 font-serif">
      {/* Header Premium (Fine Dining) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-5 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-light tracking-widest text-zinc-900 uppercase">
              L'Atelier
            </h1>
          </div>
          <button className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className="absolute top-0 right-0 w-4 h-4 bg-zinc-900 text-white text-[9px] font-sans flex items-center justify-center rounded-full">
              0
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="px-5 pt-12 pb-8 text-center">
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs mb-3">Experiencia Culinaria</p>
          <h2 className="text-4xl font-light text-zinc-900 mb-4 tracking-wide">Menú Degustación</h2>
          <div className="w-12 h-[1px] bg-zinc-300 mx-auto"></div>
        </div>

        {/* Categorías (Visuales para la demo) */}
        <div className="flex overflow-x-auto px-5 pb-10 gap-6 no-scrollbar justify-center">
          {["Entrantes", "Principales", "Vinos", "Postres"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 text-sm tracking-widest uppercase transition-all border-b-2 ${
                activeCategory === cat
                  ? "border-zinc-900 text-zinc-900 font-medium"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de Platos */}
        <div className="px-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : menu.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-bold text-slate-900">Menú vacío</h3>
              <p className="text-slate-500 mt-1">El restaurante aún no ha subido platos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {menu.map((item) => (
                <div key={item.id} className="bg-white group flex flex-col">
                  
                  {/* Visor 3D / Imagen */}
                  <div className="h-80 bg-zinc-100/50 relative w-full flex items-center justify-center overflow-hidden">
                    {item.glbUrl ? (
                      React.createElement('model-viewer', {
                        id: `viewer-${item.id}`,
                        src: item.glbUrl,
                        'ios-src': item.usdzUrl || undefined,
                        alt: `Modelo 3D de ${item.name}`,
                        'auto-rotate': true,
                        'camera-controls': true,
                        'disable-zoom': true,
                        ar: true,
                        'ar-modes': "webxr scene-viewer quick-look",
                        'ar-scale': "fixed",
                        'shadow-intensity': "1.5",
                        'environment-image': "neutral",
                        scale: `${item.scale || 1} ${item.scale || 1} ${item.scale || 1}`,
                        style: { width: "100%", height: "100%" },
                        class: "w-full h-full object-contain cursor-grab active:cursor-grabbing"
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.116.432.25.813.365.751.23 1.842.391 3.025.391 1.183 0 2.274-.16 3.025-.391.381-.115.648-.249.813-.365a.619.619 0 0 0 .145-.15.148.148 0 0 0 .016-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                        </svg>
                        AR
                      </button>
                    )}
                  </div>
                  
                  {/* Info del Plato */}
                  <div className="pt-6 pb-2 flex flex-col flex-grow">
                    <div className="flex justify-between items-baseline mb-3">
                      <h2 className="text-xl font-light text-zinc-900 tracking-wide">{item.name}</h2>
                      <span className="text-sm font-medium text-zinc-900">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-sans font-light leading-relaxed mb-6 flex-grow">{item.description}</p>
                    
                    <button className="w-full py-3 border border-zinc-900 text-zinc-900 font-sans text-xs tracking-widest uppercase hover:bg-zinc-900 hover:text-white transition-colors">
                      Añadir a la orden
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
