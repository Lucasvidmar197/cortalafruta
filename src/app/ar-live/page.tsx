"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

function ARLiveContent() {
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("item");
  const mesa = searchParams.get("mesa");

  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isXrSupported, setIsXrSupported] = useState<boolean | null>(null);
  const [inArSession, setInArSession] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const currentLoadedGltfRef = useRef<THREE.Group | null>(null);
  const hitTestSourceRef = useRef<any>(null);
  const hitTestSourceRequestedRef = useRef(false);
  const xrSessionRef = useRef<any>(null);
  const loaderRef = useRef<GLTFLoader>(new GLTFLoader());

  // 1. Fetch Dishes
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;

        const formatted: MenuItem[] = (data || [])
          .map((item: any) => ({
            ...item,
            glbUrl: item.glburl || item.glbUrl || "",
            usdzUrl: item.usdzurl || item.usdzUrl || "",
            imageUrls: item.image_urls || [],
          }))
          .filter((item: MenuItem) => !!item.glbUrl);

        setDishes(formatted);

        if (formatted.length > 0) {
          const match = initialItemId
            ? formatted.find((d) => d.id === initialItemId)
            : formatted[0];
          setSelectedDish(match || formatted[0]);
        }
      } catch (err) {
        console.error("Error fetching dishes for AR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [initialItemId]);

  // 2. Check WebXR immersive-ar support
  useEffect(() => {
    if (typeof window !== "undefined" && "xr" in navigator) {
      (navigator as any).xr
        .isSessionSupported("immersive-ar")
        .then((supported: boolean) => {
          setIsXrSupported(supported);
        })
        .catch(() => setIsXrSupported(false));
    } else {
      setIsXrSupported(false);
    }
  }, []);

  // 3. Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 4, 2);
    scene.add(dirLight);

    // Reticle (Surface marker ring)
    const ringGeo = new THREE.RingGeometry(0.1, 0.12, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // Model Container Root
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    modelRootRef.current = modelRoot;

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // 4. Load or Swap Model on Selected Dish Change
  useEffect(() => {
    if (!selectedDish || !modelRootRef.current) return;

    const modelRoot = modelRootRef.current;

    loaderRef.current.load(
      selectedDish.glbUrl,
      (gltf) => {
        if (currentLoadedGltfRef.current) {
          modelRoot.remove(currentLoadedGltfRef.current);
        }

        const model = gltf.scene;

        // Apply scale
        const scale = (selectedDish.scale || 1) * 1.0;
        model.scale.set(scale, scale, scale);

        // Center model geometry over origin (Y=0 bottom)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -box.min.y;

        const wrapper = new THREE.Group();
        wrapper.add(model);

        modelRoot.add(wrapper);
        currentLoadedGltfRef.current = wrapper;
      },
      undefined,
      (error) => {
        console.error("Error loading GLTF model:", error);
      }
    );
  }, [selectedDish]);

  // 5. Start WebXR AR Session
  const startArSession = async () => {
    if (!rendererRef.current || !overlayRef.current) return;

    try {
      const sessionInit: any = {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: overlayRef.current },
      };

      const session = await (navigator as any).xr.requestSession(
        "immersive-ar",
        sessionInit
      );
      xrSessionRef.current = session;
      rendererRef.current.xr.setReferenceSpaceType("local");
      await rendererRef.current.xr.setSession(session);

      setInArSession(true);
      setIsPlaced(false);
      hitTestSourceRequestedRef.current = false;
      hitTestSourceRef.current = null;

      session.addEventListener("end", () => {
        setInArSession(false);
        hitTestSourceRequestedRef.current = false;
        hitTestSourceRef.current = null;
        xrSessionRef.current = null;
      });

      // Render Loop
      rendererRef.current.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const referenceSpace = rendererRef.current?.xr.getReferenceSpace();
        const session = frame.session;

        // Request Hit Test Source once
        if (!hitTestSourceRequestedRef.current) {
          (session as any).requestReferenceSpace?.("viewer").then((viewerSpace: any) => {
            (session as any)
              .requestHitTestSource?.({ space: viewerSpace })
              ?.then((source: any) => {
                hitTestSourceRef.current = source;
              });
          });
          session.addEventListener("end", () => {
            hitTestSourceRequestedRef.current = false;
            hitTestSourceRef.current = null;
          });
          hitTestSourceRequestedRef.current = true;
        }

        // Process Hit-Test Results
        if (hitTestSourceRef.current && referenceSpace) {
          const hitTestResults = (frame as any).getHitTestResults(
            hitTestSourceRef.current
          );

          if (hitTestResults && hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            if (pose && reticleRef.current) {
              if (!isPlaced) {
                reticleRef.current.visible = true;
                reticleRef.current.matrix.fromArray(pose.transform.matrix);
              } else {
                reticleRef.current.visible = false;
              }
            }
          } else {
            if (reticleRef.current && !isPlaced) {
              reticleRef.current.visible = false;
            }
          }
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      });
    } catch (err) {
      console.error("Failed to start WebXR session:", err);
      alert("No se pudo iniciar la sesión de Realidad Aumentada.");
    }
  };

  // 6. Handle Tap to Place or Re-anchor Model
  const handlePlaceModel = () => {
    if (!reticleRef.current || !modelRootRef.current) return;

    if (reticleRef.current.visible) {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      reticleRef.current.matrix.decompose(position, quaternion, scale);

      modelRootRef.current.position.copy(position);
      modelRootRef.current.quaternion.copy(quaternion);
      modelRootRef.current.visible = true;

      setIsPlaced(true);
      reticleRef.current.visible = false;
    }
  };

  const handleReposition = () => {
    setIsPlaced(false);
  };

  // 7. Add to Cart
  const handleAddToCart = (dish: MenuItem) => {
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
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2200);
    } catch (e) {
      console.error("Error adding to cart in AR:", e);
    }
  };

  // 8. Exit AR Session
  const handleExitAr = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] text-zinc-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-sans tracking-widest uppercase text-zinc-500">
          Cargando Menú 3D...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* WebXR DOM Overlay UI Layer */}
      <div
        ref={overlayRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none flex flex-col justify-between"
      >
        {/* Toast Notificación */}
        {addedToast && (
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 bg-white text-zinc-900 px-6 py-2 rounded-full text-xs font-medium tracking-wide shadow-2xl animate-fade-in-up border border-zinc-200">
            ✓ Plato añadido al pedido
          </div>
        )}

        {/* Top Header */}
        <div className="pointer-events-auto p-4 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {inArSession ? (
            <button
              onClick={handleExitAr}
              className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
            >
              ✕ Salir de AR
            </button>
          ) : (
            <Link
              href={mesa ? `/?mesa=${encodeURIComponent(mesa)}` : "/"}
              className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors flex items-center gap-1"
            >
              ← Menú
            </Link>
          )}

          <div className="bg-black/60 backdrop-blur-md text-white/90 border border-white/20 px-4 py-1.5 rounded-full text-[11px] tracking-wider uppercase font-medium">
            {mesa ? `Mesa ${mesa}` : "Modo Casa"}
          </div>
        </div>

        {/* Center Prompt when in AR */}
        {inArSession && (
          <div className="pointer-events-auto self-center text-center px-4">
            {!isPlaced ? (
              <button
                onClick={handlePlaceModel}
                className="bg-white text-zinc-950 px-6 py-3 rounded-full text-xs font-semibold tracking-widest uppercase shadow-2xl hover:bg-zinc-100 active:scale-95 transition-all flex items-center gap-2 border border-white/40"
              >
                <span>👇</span> Toca para apoyar en la mesa
              </button>
            ) : (
              <button
                onClick={handleReposition}
                className="bg-black/60 backdrop-blur-md text-white/80 border border-white/20 px-4 py-1.5 rounded-full text-[10px] tracking-wider uppercase hover:bg-white hover:text-black transition-all"
              >
                🔄 Reubicar en otra mesa
              </button>
            )}
          </div>
        )}

        {/* Bottom Panel */}
        <div className="pointer-events-auto p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-3">
          {/* Active Dish Details Card */}
          {selectedDish && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-white/15 p-4 rounded-xl flex justify-between items-center text-white shadow-2xl">
              <div className="flex-1 pr-3">
                <div className="flex items-baseline gap-2">
                  <h2 className="font-serif text-lg font-normal tracking-wide text-white">
                    {selectedDish.name}
                  </h2>
                  <span className="font-sans text-sm font-semibold text-amber-300">
                    ${selectedDish.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs line-clamp-1 mt-0.5">
                  {selectedDish.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToCart(selectedDish)}
                  className="bg-white text-zinc-950 px-4 py-2.5 rounded-lg text-xs font-medium tracking-widest uppercase hover:bg-zinc-200 active:scale-95 transition-all whitespace-nowrap shadow-md"
                >
                  + Añadir
                </button>
              </div>
            </div>
          )}

          {/* Bottom Dish Carousel */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            {dishes.map((dish) => {
              const isSelected = selectedDish?.id === dish.id;
              return (
                <button
                  key={dish.id}
                  onClick={() => setSelectedDish(dish)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-white text-zinc-950 border-white shadow-lg scale-105"
                      : "bg-black/60 backdrop-blur-md text-white/80 border-white/20 hover:bg-white/20"
                  }`}
                >
                  {dish.imageUrls && dish.imageUrls[0] ? (
                    <img
                      src={dish.imageUrls[0]}
                      alt={dish.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">🍽️</span>
                  )}
                  <span className="text-xs font-medium whitespace-nowrap">
                    {dish.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Start AR Session Button (if not in AR yet) */}
          {!inArSession && (
            <div className="pt-2">
              {isXrSupported ? (
                <button
                  onClick={startArSession}
                  className="w-full py-4 bg-white text-zinc-950 font-sans text-xs tracking-[0.2em] uppercase font-semibold rounded-xl hover:bg-zinc-200 active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3L2 8l10 5 10-5-10-5z" />
                    <path d="M2 8v8l10 5V11" />
                    <path d="M22 8v8l-10 5V11" />
                  </svg>
                  Proyectar en la mesa (WebXR)
                </button>
              ) : (
                <div className="bg-zinc-900/90 border border-white/20 p-3.5 rounded-xl text-center">
                  <p className="text-xs text-zinc-300 mb-2">
                    Visualizando en 3D interactivo. Para proyectar en iPhone toca abajo:
                  </p>
                  {selectedDish?.usdzUrl ? (
                    <a
                      href={selectedDish.usdzUrl}
                      rel="ar"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-950 text-xs tracking-widest uppercase font-semibold rounded-lg shadow-md"
                    >
                      📱 Ver en Quick Look (iPhone)
                    </a>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      Usa Chrome en Android para WebXR o sube un .usdz para iPhone.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ARLivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F0] text-zinc-900 flex items-center justify-center">
          Cargando Menú AR...
        </div>
      }
    >
      <ARLiveContent />
    </Suspense>
  );
}
