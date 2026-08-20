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
    fetch("/api/menu?t=" + Date.now(), { cache: "no-store" })
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
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
              B
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Burger<span className="text-orange-500">Bite</span>
            </h1>
          </div>
          <button className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              0
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="px-5 pt-8 pb-6">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Nuestro Menú</h2>
          <p className="text-slate-500">Visualiza tus platos favoritos en Realidad Aumentada antes de pedir.</p>
        </div>

        {/* Categorías (Visuales para la demo) */}
        <div className="flex overflow-x-auto px-5 pb-6 gap-3 no-scrollbar">
          {["Destacados", "Hamburguesas", "Bebidas", "Postres"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menu.map((item) => (
                <div key={item.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-100 overflow-hidden flex flex-col group">
                  
                  {/* Visor 3D / Imagen */}
                  <div className="h-72 bg-gradient-to-b from-slate-50 to-slate-100 relative w-full flex items-center justify-center overflow-hidden">
                    {item.glbUrl ? (
                      React.createElement('model-viewer', {
                        id: `viewer-${item.id}`,
                        src: item.glbUrl,
                        'ios-src': item.usdzUrl || undefined,
                        alt: `Modelo 3D de ${item.name}`,
                        'auto-rotate': true,
                        'camera-controls': true,
                        ar: true,
                        'ar-modes': "webxr scene-viewer quick-look",
                        'shadow-intensity': "1",
                        'environment-image': "neutral",
                        scale: `${item.scale || 1} ${item.scale || 1} ${item.scale || 1}`,
                        style: { width: "100%", height: "100%" },
                        class: "w-full h-full object-contain cursor-grab active:cursor-grabbing"
                      })
                    ) : (
                      <div className="text-slate-400 font-medium">Sin imagen</div>
                    )}
                    
                    {/* Badge de Precio */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                      <span className="font-bold text-slate-900">${item.price.toFixed(2)}</span>
                    </div>

                    {/* Botón Flotante AR */}
                    {item.glbUrl && (
                      <button
                        onClick={() => {
                          const viewer = document.getElementById(`viewer-${item.id}`) as any;
                          if (viewer && viewer.canActivateAR) {
                            viewer.activateAR();
                          } else {
                            alert("La realidad aumentada no está disponible en este dispositivo (se requiere Safari en iOS o Chrome en Android con ARCore).");
                          }
                        }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.116.432.25.813.365.751.23 1.842.391 3.025.391 1.183 0 2.274-.16 3.025-.391.381-.115.648-.249.813-.365a.619.619 0 0 0 .145-.15.148.148 0 0 0 .016-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                        </svg>
                        Ver en mi mesa
                      </button>
                    )}
                  </div>
                  
                  {/* Info del Plato */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{item.name}</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">{item.description}</p>
                    
                    <button className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-orange-500/20">
                      Agregar al Pedido
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
