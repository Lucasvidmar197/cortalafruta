"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  glbUrl: string;
  usdzUrl: string;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("Debug: Inicializando...");

  useEffect(() => {
    setErrorMsg("Debug: Ejecutando fetch...");
    fetch("/api/menu?t=" + Date.now(), { cache: "no-store" })
      .then((res) => {
        setErrorMsg(`Debug: Fetch completado con status ${res.status}`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setErrorMsg("");
        setMenu(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(`Debug Error: ` + err.toString());
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ Menú AR</h1>
          <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-4">
            Error cargando los platos: {errorMsg}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : menu.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No hay platos en el menú todavía.</p>
            <Link href="/admin" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full">
              Agregar el primer plato
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {menu.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <div className="h-64 bg-gray-200 relative w-full flex items-center justify-center overflow-hidden">
                  {item.glbUrl ? (
                    <model-viewer
                      src={item.glbUrl}
                      ios-src={item.usdzUrl || undefined}
                      alt={`Modelo 3D de ${item.name}`}
                      auto-rotate
                      camera-controls
                      ar
                      ar-scale="fixed"
                      style={{ width: "100%", height: "100%" }}
                      className="w-full h-full object-contain"
                    ></model-viewer>
                  ) : (
                    <div className="text-gray-400">Sin modelo 3D</div>
                  )}
                  {item.glbUrl && (
                    <div className="absolute bottom-2 right-2 pointer-events-none">
                      <span className="bg-white/80 backdrop-blur text-xs font-bold px-2 py-1 rounded-full shadow-sm text-gray-900">
                        Interactúa 👆
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                    <span className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-600 flex-grow text-sm">{item.description}</p>
                  
                  {item.glbUrl && (
                    <button
                      onClick={() => {
                        const viewer = document.querySelector(`model-viewer[src="${item.glbUrl}"]`) as any;
                        if (viewer && viewer.canActivateAR) {
                          viewer.activateAR();
                        } else {
                          alert("La realidad aumentada no está disponible en este dispositivo o navegador.");
                        }
                      }}
                      className="mt-6 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.116.432.25.813.365.751.23 1.842.391 3.025.391 1.183 0 2.274-.16 3.025-.391.381-.115.648-.249.813-.365a.619.619 0 0 0 .145-.15.148.148 0 0 0 .016-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                      </svg>
                      Ver en tu mesa (AR)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
