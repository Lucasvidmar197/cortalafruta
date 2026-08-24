"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ARViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const searchParams = useSearchParams();
  const mesa = searchParams.get("mesa");

  const [dish, setDish] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [addedNotification, setAddedNotification] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDish = async () => {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setDish({
          ...data,
          glbUrl: data.glburl || data.glbUrl,
        });
      } catch (err) {
        console.error("Error loading dish for AR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDish();
  }, [id]);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
    };

    const loadLibraries = async () => {
      try {
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js");
        setScriptsLoaded(true);
      } catch (err) {
        console.error("Failed to load MindAR/A-Frame libraries:", err);
      }
    };

    loadLibraries();

    return () => {
      const video = document.querySelector("video");
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);


  useEffect(() => {
    if (!scriptsLoaded || !dish) return;

    const targetEl = document.querySelector("#dish-target");
    if (!targetEl) return;

    const onFound = () => setTargetFound(true);
    const onLost = () => setTargetFound(false);

    targetEl.addEventListener("targetFound", onFound);
    targetEl.addEventListener("targetLost", onLost);

    return () => {
      targetEl.removeEventListener("targetFound", onFound);
      targetEl.removeEventListener("targetLost", onLost);
    };
  }, [scriptsLoaded, dish]);

  const handleAddToCart = () => {
    try {
      const stored = localStorage.getItem("latelier_cart") || "[]";
      const cart = JSON.parse(stored);
      const existing = cart.find((c: any) => c.item.id === dish.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ item: dish, quantity: 1, notes: "" });
      }
      localStorage.setItem("latelier_cart", JSON.stringify(cart));
      setAddedNotification(true);
      setTimeout(() => setAddedNotification(false), 2500);
    } catch (e) {
      console.error("Error saving to cart:", e);
    }
  };

  const scaleVal = (dish?.scale || 1) * 0.35;


  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs tracking-widest uppercase font-sans text-zinc-400">Cargando experiencia AR...</p>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-sans mb-4">No se encontró el plato especificado.</p>
        <Link href={mesa ? `/?mesa=${encodeURIComponent(mesa)}` : "/"} className="px-6 py-2 border border-zinc-700 text-xs tracking-widest uppercase">
          Volver al Menú
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none font-sans z-50">
      {addedNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-zinc-900 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide shadow-2xl animate-fade-in-up">
          ✄ Añadido al pedido
        </div>
      )}

      <div ref={sceneContainerRef} className="absolute inset-0 w-full h-full z-0">
        {scriptsLoaded && dish.glbUrl && (
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <a-scene
                  mindar-image="imageTargetSrc: /targets/table-target.mind; autoStart: true; filterMinCF: 0.0001; filterBeta: 0.001; uiScanning: no;"
                  color-space="sRGB"
                  embedded
                  renderer="colorManagement: true, physicallyCorrectLights: true"
                  vr-mode-ui="enabled: false"
                  device-orientation-permission-ui="enabled: false"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                >
                  <a-assets>
                    <a-asset-item id="ar-dish-model" src="${dish.glbUrl}"></a-asset-item>
                  </a-assets>

                  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                  <a-entity id="dish-target" mindar-image-target="targetIndex: 0">
                    <a-gltf-model
                      src="#ar-dish-model"
                      position="0 0 0"
                      scale="${scaleVal} ${scaleVal} ${scaleVal}"
                      rotation="0 0 0"
                    ></a-gltf-model>
                  </a-entity>
                </a-scene>
              `,
            }}
            className="w-full h-full"
          />
        )}
      </div>

      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-40 bg-gradient-to-b from-black/70 to-transparent">
        <Link
          href={mesa ? `/?mesa=${encodeURIComponent(mesa)}` : "/"}
          className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors flex items-center gap-1.5"
        >
          ← Menú
        </Link>

        <button
          onClick={() => setShowMarkerModal(true)}
          className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-3.5 py-2 rounded text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors flex items-center gap-1.5"
        >
          🎯 Ver Marcador
        </button>
      </div>

      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div
          className={`px-4 py-1.5 rounded-full text-[11px] tracking-wider uppercase font-medium backdrop-blur-md transition-all flex items-center gap-2 ${
            targetFound
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
              : "bg-black/60 text-zinc-300 border border-white/20 animate-pulse"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${targetFound ? "bg-emerald-400" : "bg-amber-400"}`}></span>
          {targetFound ? "Plato anclado en mesa" : "Apunta la cámara al marcador"}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-3">
        <div className="bg-black/80 backdrop-blur-md border border-white/15 p-4 rounded-lg flex justify-between items-center text-white">
          <div>
            <h2 className="font-serif text-base font-normal tracking-wide text-white">{dish.name}</h2>
            <p className="font-sans text-xs text-zinc-400 mt-0.5">${dish.price.toFixed(2)}</p>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-white text-zinc-900 px-5 py-2.5 rounded font-sans text-xs tracking-widest uppercase font-medium hover:bg-zinc-200 active:scale-95 transition-all shadow-lg"
          >
            Añadir
          </button>
        </div>
      </div>


      {showMarkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/20 p-6 max-w-sm w-full rounded-xl flex flex-col items-center text-center shadow-2xl text-white">
            <h3 className="font-serif text-lg tracking-wide mb-1">Marcador de Mesa (MindAR)</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Apunta la cámara de tu celular a esta imagen (puedes verla en otra pantalla o imprimirla):
            </p>

            <div className="bg-white p-2 rounded-mg mb-4 border border-zinc-700">
              <img
                src="/targets/table-target.png"
                alt="Marcador de mesa"
                className="w-56 h-auto object-contain"
              />
            </div>

            <button
              onClick={() => setShowMarkerModal(false)}
              className="w-full py-2.5 bg-white text-zinc-900 font-sans text-xs tracking-widest uppercase font-medium rounded hover:bg-zinc-200 transition-colors"
            >
            Listo, escanear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
