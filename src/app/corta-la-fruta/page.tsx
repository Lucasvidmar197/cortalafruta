"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Star, MapPin, Clock, Phone, AtSign, ShoppingBag, Plus, Minus, Trash2, 
  X, Check, Box, ArrowRight, Sparkles, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Heart, CheckCircle2, Loader2, ExternalLink, Package
} from "lucide-react";

// Official WhatsApp Logo Icon
const WhatsAppIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 2.15.68 4.14 1.84 5.77L2 22l4.38-1.81C7.94 21.34 9.9 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.81 0-3.52-.49-5-1.34l-.36-.21-2.6 1.07.7-2.54-.23-.37A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
);

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number | null;
  badge?: string;
  badgeType?: "strawberry" | "kiwi" | "banana";
  imageUrl: string;
  has3DModel?: boolean;
  glbUrl?: string;
  usdzUrl?: string;
  scale?: number;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  subtitle: string;
  theme: "strawberry" | "kiwi" | "banana";
  items: Product[];
}

export interface CupIngredient {
  id: string;
  name: string;
  available: boolean;
  emoji?: string;
  description?: string;
}

export interface CupSizeOption {
  id: string;
  name: string;
  icon: string;
  fruitsOnlyPrice: number;
  fullComboPrice: number;
  imageUrl?: string;
}

export interface CupBuilderConfig {
  enabled: boolean;
  name: string;
  price?: number;
  promo_price?: number | null;
  description: string;
  sizes: CupSizeOption[];
  fruits: CupIngredient[];
  bases: CupIngredient[];
  toppings: CupIngredient[];
}

export const DEFAULT_CUP_BUILDER_CONFIG: CupBuilderConfig = {
  enabled: true,
  name: "Armá tu Vaso",
  description: "Elegí el tamaño de tu vaso, frutas, yogur o crema y toppings capa por capa.",
  sizes: [
    {
      id: "vaso-mediano",
      name: "Vaso Mediano",
      icon: "🥤",
      fruitsOnlyPrice: 7500,
      fullComboPrice: 9500,
      imageUrl: "https://i.postimg.cc/Gm8bBX5t/image-removebg-preview.png",
    },
    {
      id: "vaso-grande",
      name: "Vaso Grande",
      icon: "🥤",
      fruitsOnlyPrice: 8500,
      fullComboPrice: 10500,
      imageUrl: "https://i.postimg.cc/Gm8bBX5t/image-removebg-preview.png",
    },
  ],
  fruits: [
    { id: "f1", name: "Mango Maracuyá", available: true, emoji: "🥭" },
    { id: "f2", name: "Pera", available: true, emoji: "🍐" },
    { id: "f3", name: "Frutilla", available: true, emoji: "🍓" },
    { id: "f4", name: "Manzana", available: true, emoji: "🍎" },
    { id: "f5", name: "Mandarina", available: true, emoji: "🍊" },
    { id: "f6", name: "Kiwi", available: true, emoji: "🥝" },
    { id: "f7", name: "Banana", available: true, emoji: "🍌" },
    { id: "f8", name: "Melón Brasil Dulce", available: true, emoji: "🍈" },
    { id: "f9", name: "Pomelo", available: true, emoji: "🍊" },
    { id: "f10", name: "Membrillo en Almíbar", available: true, emoji: "🍯" }
  ],
  bases: [
    { id: "b1", name: "Yogurt Griego con Chía", available: true, description: "Con semillas de chía hidratadas", emoji: "🥣" },
    { id: "b2", name: "Yogurt Griego", available: true, description: "Cremoso y natural", emoji: "🥣" },
    { id: "b3", name: "Yogurt con Stevia", available: true, description: "Sin azúcar agregada", emoji: "🥛" }
  ],
  toppings: [
    { id: "t1", name: "Cáscara de Naranja", available: true, emoji: "🍊" },
    { id: "t2", name: "Salsa de Frutilla", available: true, emoji: "🍓" },
    { id: "t3", name: "Salsa de Kiwi", available: true, emoji: "🥝" },
    { id: "t4", name: "Salsa de Uva", available: true, emoji: "🍇" },
    { id: "t5", name: "Salsa de Piña", available: true, emoji: "🍍" },
    { id: "t6", name: "Salsa de Arándanos", available: true, emoji: "🫐" }
  ]
};

interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
  notes?: string;
  customDetails?: {
    sizeName?: string;
    comboType?: "full" | "fruits_only";
    step1Fruit: string;
    step2Base?: string;
    step3Fruit: string;
    step4Toppings: string[];
  };
}

// Category visual metadata (subtitles, icons & colors)
const CATEGORY_META: Record<string, { subtitle: string; theme: "strawberry" | "kiwi" | "banana"; icon: string }> = {
  "Ensaladas": {
    subtitle: "Frescas, nutritivas y preparadas en el momento",
    theme: "kiwi",
    icon: "🥗"
  },
  "Desayunos": {
    subtitle: "Energía natural para arrancar tu día con fruta fresca y yogur",
    theme: "banana",
    icon: "🥣"
  },
  "Almuerzos": {
    subtitle: "Opciones saludables, viandas completas, tartas y platos calientes",
    theme: "strawberry",
    icon: "🥪"
  },
  "Meriendas": {
    subtitle: "Tentaciones frutales, pancakes y snacks saludables para la tarde",
    theme: "banana",
    icon: "🍓"
  },
  "Opciones Keto": {
    subtitle: "Bajas en carbohidratos, ricas y altamente nutritivas",
    theme: "kiwi",
    icon: "🥑"
  },
  "Eventos & Celebración": {
    subtitle: "Bandejas abundantes de fruta para compartir en tus festejos",
    theme: "strawberry",
    icon: "🎉"
  }
};

// Transform database rows from Supabase into structured Category objects
function buildCategoriesFromItems(rawItems: any[]): Category[] {
  const categoryMap = new Map<string, Product[]>();

  const canonicalOrder = [
    "Ensaladas",
    "Desayunos",
    "Almuerzos",
    "Meriendas",
    "Opciones Keto",
    "Eventos & Celebración"
  ];

  rawItems
    .filter((row) => 
      row.id !== "cup-builder-config" && 
      row.id !== "corta-la-fruta-reviews" && 
      !row.id.includes("review") &&
      !row.id.includes("config") &&
      row.category !== "Armá tu Vaso" &&
      row.category !== "Configuracion" &&
      row.category !== "Reseñas"
    )
    .forEach((row) => {
      const rawCat = row.category || "Otros";
      const catList = rawCat.split(/[,;|]/).map((c: string) => c.trim()).filter(Boolean);
      if (catList.length === 0) catList.push("Otros");

      const regPrice = Number(row.price) || 0;
      const rawPromo = row.promo_price ?? (row.usdzurl && !isNaN(Number(row.usdzurl)) ? Number(row.usdzurl) : null);
      const promoPrice = rawPromo && Number(rawPromo) > 0 && Number(rawPromo) < regPrice ? Number(rawPromo) : null;
      
      const productObj = {
        id: row.id,
        name: row.name,
        description: row.description || "",
        price: regPrice,
        promoPrice: promoPrice,
        badge: row.glburl ? "★ Destacado 3D" : undefined,
        badgeType: "strawberry" as const,
        imageUrl: (row.image_urls && row.image_urls[0]) || "/products/especial-corta-la-fruta.png",
        has3DModel: !!row.glburl,
        glbUrl: row.glburl || undefined,
        usdzUrl: row.usdzurl || undefined,
        scale: row.scale || 1,
      };

      catList.forEach((catName: string) => {
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, []);
        }
        categoryMap.get(catName)!.push({
          ...productObj,
          categoryName: catName,
        });
      });
    });

  const categories: Category[] = [];
  const processedNames = new Set<string>();

  canonicalOrder.forEach((catName, idx) => {
    if (categoryMap.has(catName)) {
      const meta = CATEGORY_META[catName] || {
        subtitle: "Catálogo de productos frescos seleccionados",
        theme: idx % 3 === 0 ? "strawberry" : idx % 3 === 1 ? "banana" : "kiwi",
        icon: "✨"
      };
      categories.push({
        id: `c_${idx + 1}`,
        name: catName,
        subtitle: meta.subtitle,
        theme: meta.theme,
        items: categoryMap.get(catName)!
      });
      processedNames.add(catName);
    }
  });

  let extraIdx = canonicalOrder.length + 1;
  categoryMap.forEach((items, catName) => {
    if (!processedNames.has(catName)) {
      categories.push({
        id: `c_${extraIdx++}`,
        name: catName,
        subtitle: "Catálogo de productos frescos seleccionados",
        theme: extraIdx % 2 === 0 ? "strawberry" : "kiwi",
        items
      });
    }
  });

  return categories;
}

import { DEFAULT_REVIEWS_CONFIG, type ReviewsConfig, type GoogleReviewItem } from "@/app/api/reviews/route";

function GooglePlacesWidget() {
  const [config, setConfig] = useState<ReviewsConfig>(DEFAULT_REVIEWS_CONFIG);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Swipe / Drag movement state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Fetch reviews from our custom API
  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setConfig(data);
        }
      })
      .catch((err) => console.warn("Using default reviews fallback:", err));
  }, []);

  // Responsive visible count for carousel mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const reviews = config.reviews && config.reviews.length > 0 ? config.reviews : DEFAULT_REVIEWS_CONFIG.reviews;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Carousel auto-slide timer
  useEffect(() => {
    if (isPaused || isDragging || maxIndex <= 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, maxIndex]);

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setDragOffset(0);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setDragOffset(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const threshold = 40; // minimum px movement to switch slide
    if (dragOffset < -threshold) {
      nextSlide();
    } else if (dragOffset > threshold) {
      prevSlide();
    }
    setTouchStartX(null);
    setDragOffset(0);
    setTimeout(() => setIsPaused(false), 800);
  };

  // Mouse Drag Handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
    setDragOffset(0);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartX === null) return;
    setDragOffset(e.clientX - touchStartX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    const threshold = 50;
    if (dragOffset < -threshold) {
      nextSlide();
    } else if (dragOffset > threshold) {
      prevSlide();
    }
    setIsDragging(false);
    setTouchStartX(null);
    setDragOffset(0);
    setTimeout(() => setIsPaused(false), 800);
  };

  const renderReviewCard = (rev: GoogleReviewItem) => (
    <div 
      key={rev.id}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-2xs flex flex-col justify-between h-full hover:border-zinc-300 hover:shadow-md transition-all select-none pointer-events-none sm:pointer-events-auto"
    >
      <div>
        {/* Customer Header: Avatar + Name + Stars */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={rev.author_photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={rev.author_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                }}
              />
              {/* Google G badge overlay */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-2xs border border-zinc-100">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
            </div>

            <div className="min-w-0">
              <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                <span className="truncate max-w-[125px] sm:max-w-[150px]">{rev.author_name}</span>
                {rev.verified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24" aria-label="Reseña verificada">
                    <title>Reseña verificada</title>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
              </h5>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                {rev.local_guide && (
                  <span className="text-amber-600 font-semibold">Local Guide</span>
                )}
                {rev.local_guide && <span>•</span>}
                <span>{rev.time}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
            {[...Array(rev.rating || 5)].map((_, i) => (
              <Star key={i} size={13} className="fill-amber-400" />
            ))}
          </div>
        </div>

        {/* Review Text */}
        <p className="text-xs text-zinc-600 leading-relaxed italic font-normal line-clamp-4">
          &ldquo;{rev.text}&rdquo;
        </p>
      </div>

      <div className="mt-4 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
        <span className="font-semibold text-emerald-700 flex items-center gap-1">
          <span>Reseña de Google Maps</span>
        </span>
        <span className="font-mono font-bold text-zinc-700">★ 5.0</span>
      </div>
    </div>
  );

  return (
    <div 
      id="google-reviews" 
      className="w-full relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      itemScope
      itemType="http://schema.org/Store"
    >
      <meta itemProp="name" content="Corta la fruta" />
      <meta itemProp="image" content="https://cortalafruta.vercel.app/logo-corta-la-fruta.png" />
      <div itemProp="aggregateRating" itemScope itemType="http://schema.org/AggregateRating" className="hidden">
        <span itemProp="ratingValue">4.8</span>
        <span itemProp="bestRating">5</span>
        <span itemProp="ratingCount">{reviews.length}</span>
      </div>

      {/* Header controls & Google Branding */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Google G logo */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <div>
            <span className="text-xs font-bold text-zinc-900 block leading-tight">
              Opiniones Reales en Google Maps
            </span>
            <span className="text-[10px] text-zinc-500">
              Nicolás Videla 173, Quilmes • Calificación 4.8 ★★★★★ ({reviews.length} opiniones)
            </span>
          </div>
        </div>

        {/* Carousel controls with count indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 font-mono hidden sm:inline">
            {currentIndex + 1} - {Math.min(currentIndex + visibleCount, reviews.length)} de {reviews.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              aria-label="Anterior reseña"
              className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center transition-colors shadow-2xs active:scale-95 cursor-pointer touch-manipulation"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Siguiente reseña"
              className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center transition-colors shadow-2xs active:scale-95 cursor-pointer touch-manipulation"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SWIPEABLE / DRAGGABLE CAROUSEL TRACK */}
      <div 
        className="overflow-hidden -mx-2 cursor-grab active:cursor-grabbing touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className={`flex ${isDragging || dragOffset !== 0 ? "" : "transition-transform duration-500 ease-out"}`}
          style={{ 
            transform: `translateX(calc(-${currentIndex * (100 / visibleCount)}% + ${dragOffset}px))` 
          }}
        >
          {reviews.map((rev) => (
            <div 
              key={rev.id}
              className="shrink-0 px-2"
              style={{ width: `${100 / visibleCount}%` }}
            >
              {renderReviewCard(rev)}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {Array.from({ length: Math.min(10, maxIndex + 1) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir a la reseña ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex ? "w-6 bg-emerald-600" : "w-2 bg-zinc-300 hover:bg-zinc-400"
            }`}
          />
        ))}
      </div>

      {/* Footer link to Google Maps */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-200/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Deslizá para ver más opiniones</span>
        </div>
        <a 
          href={config.business?.mapUrl || "https://maps.app.goo.gl/Uc8cmMc5MBuLm5pX8"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Ver perfil oficial en Google Maps</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

interface PromoBanner {
  id: string;
  title: string;
  imageUrl: string;
  alt: string;
}

const HERO_PROMO_BANNERS: PromoBanner[] = [
  {
    id: "banner-1",
    title: "10% de descuento en efectivo",
    imageUrl: "https://i.postimg.cc/Z595r7XC/image.png",
    alt: "10% de descuento en efectivo en Corta la Fruta",
  },
  {
    id: "banner-2",
    title: "Envío gratis en productos seleccionados",
    imageUrl: "https://i.postimg.cc/G2mNyNSj/image.png",
    alt: "Envío gratis en productos seleccionados",
  }
];

function HeroPromoBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const totalBanners = HERO_PROMO_BANNERS.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalBanners);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalBanners) % totalBanners);
  };

  // Auto-play carousel every 5s with pause on hover
  useEffect(() => {
    if (isHovered || totalBanners <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, totalBanners]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      nextSlide();
    } else if (distance < -45) {
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <section className="w-full bg-[#FFFDF9] pt-3 sm:pt-5 pb-2 sm:pb-3 px-3 sm:px-6">
      <div 
        className="max-w-6xl mx-auto relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-zinc-200/80 bg-zinc-900 group select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Banner Images Track */}
        <div 
          className="flex transition-transform duration-500 ease-in-out w-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_PROMO_BANNERS.map((banner, index) => (
            <div 
              key={banner.id} 
              className="w-full shrink-0 relative aspect-[1024/286] bg-zinc-900 overflow-hidden"
            >
              <img 
                src={banner.imageUrl} 
                alt={banner.alt}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Bottom Left Navigation Arrows */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-3 sm:left-5 flex items-center gap-1.5 sm:gap-2 z-20">
          <button
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs border border-white/40 transition-all shadow-md active:scale-90"
          >
            <ChevronLeft size={16} className="sm:size-[18px] stroke-[2.5]" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Siguiente banner"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs border border-white/40 transition-all shadow-md active:scale-90"
          >
            <ChevronRight size={16} className="sm:size-[18px] stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Center Indicator Pills */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
          {HERO_PROMO_BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide 
                  ? "w-5 sm:w-7 bg-rose-600 shadow-xs" 
                  : "w-1.5 sm:w-2 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const FRUIT_CUP_IMAGE_URL = "https://i.postimg.cc/Gm8bBX5t/image-removebg-preview.png";

function FloatingFruitCupWidget({ onOpenAbout }: { onOpenAbout: () => void }) {
  return (
    <aside 
      aria-label="Vaso artesanal Corta la Fruta"
      onClick={onOpenAbout}
      className="fixed bottom-6 left-6 z-30 hidden md:block cursor-pointer select-none group"
      title="Corta la Fruta - 100% Fresco y Natural (Clic para conocer más)"
    >
      {/* Pure Floating Animated Cup - NO BOX, NO BORDER, NO SQUARE */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-20 lg:w-24 h-28 lg:h-32 flex items-center justify-center">
          <img 
            src={FRUIT_CUP_IMAGE_URL} 
            alt="Vaso de Fruta Corta la Fruta" 
            className="w-full h-full object-contain animate-float drop-shadow-2xl transition-transform duration-300 group-hover:scale-110"
          />
          {/* Natural floating ground shadow */}
          <div className="absolute -bottom-1 w-14 lg:w-16 h-2 bg-black/25 rounded-full blur-[2px] animate-float-shadow pointer-events-none" />
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-black uppercase tracking-wider bg-zinc-900/80 text-white px-2 py-0.5 rounded-full shadow-md mt-1 backdrop-blur-xs pointer-events-none">
          100% Fresco ✨
        </span>
      </div>
    </aside>
  );
}

export default function CortaLaFrutaPublicPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [active3DModal, setActive3DModal] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isAboutHighlighted, setIsAboutHighlighted] = useState<boolean>(false);

  // Cup Builder State (PedidosYa Multi-Size & Combo Flow)
  const [cupConfig, setCupConfig] = useState<CupBuilderConfig>(DEFAULT_CUP_BUILDER_CONFIG);
  const [isCupBuilderOpen, setIsCupBuilderOpen] = useState<boolean>(false);
  const [builderSelectedSizeId, setBuilderSelectedSizeId] = useState<string>("");
  const [builderComboType, setBuilderComboType] = useState<"full" | "fruits_only" | null>(null);
  const [builderStep1Fruit, setBuilderStep1Fruit] = useState<string>("");
  const [builderStep2Base, setBuilderStep2Base] = useState<string>("");
  const [builderStep3Fruit, setBuilderStep3Fruit] = useState<string>("");
  const [builderStep4Toppings, setBuilderStep4Toppings] = useState<string[]>([]);
  const [builderNotes, setBuilderNotes] = useState<string>("");
  const [builderQuantity, setBuilderQuantity] = useState<number>(1);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    size: true,
    comboType: false,
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  const safeSizes: CupSizeOption[] = (cupConfig?.sizes && cupConfig.sizes.length > 0) ? cupConfig.sizes : DEFAULT_CUP_BUILDER_CONFIG.sizes;
  const currentSelectedSize: CupSizeOption | null = safeSizes.find(s => s.id === builderSelectedSizeId) || null;
  const currentEffectiveUnitPrice = currentSelectedSize
    ? (builderComboType === "fruits_only" ? currentSelectedSize.fruitsOnlyPrice : (builderComboType === "full" ? currentSelectedSize.fullComboPrice : currentSelectedSize.fruitsOnlyPrice))
    : (safeSizes[0]?.fruitsOnlyPrice || 7500);

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const openCupBuilderForSize = (sizeId?: string) => {
    setBuilderSelectedSizeId(sizeId || "");
    setBuilderComboType(null);
    setBuilderStep1Fruit("");
    setBuilderStep2Base("");
    setBuilderStep3Fruit("");
    setBuilderStep4Toppings([]);
    setBuilderNotes("");
    setBuilderQuantity(1);
    setOpenSections({
      size: true,
      comboType: false,
      step1: false,
      step2: false,
      step3: false,
      step4: false,
    });
    setIsCupBuilderOpen(true);
  };

  const resetCupBuilder = () => {
    setBuilderSelectedSizeId("");
    setBuilderComboType(null);
    setBuilderStep1Fruit("");
    setBuilderStep2Base("");
    setBuilderStep3Fruit("");
    setBuilderStep4Toppings([]);
    setBuilderNotes("");
    setBuilderQuantity(1);
    setOpenSections({
      size: true,
      comboType: false,
      step1: false,
      step2: false,
      step3: false,
      step4: false,
    });
  };

  const handleToggleTopping = (topName: string) => {
    setBuilderStep4Toppings(prev => 
      prev.includes(topName) ? prev.filter(t => t !== topName) : [...prev, topName]
    );
  };

  const handleAddCustomCupToCart = () => {
    if (!currentSelectedSize) return;
    if (!builderComboType) return;
    if (!builderStep1Fruit || !builderStep3Fruit) return;
    if (builderComboType === "full" && !builderStep2Base) return;

    const toppingsList = builderStep4Toppings.length > 0 ? builderStep4Toppings.join(", ") : "Sin toppings adicionales";

    const customProduct: Product = {
      id: `custom-combo-${Date.now()}`,
      name: `${currentSelectedSize.name} (${builderComboType === "full" ? "Completo" : "Solo Frutas"})`,
      description: builderComboType === "full"
        ? `1ª Fruta: ${builderStep1Fruit} | Yogur: ${builderStep2Base} | 2ª Fruta: ${builderStep3Fruit} | Toppings: ${toppingsList}`
        : `1ª Fruta: ${builderStep1Fruit} | 2ª Fruta: ${builderStep3Fruit} (Solo Frutas)`,
      price: currentEffectiveUnitPrice,
      promoPrice: null,
      imageUrl: currentSelectedSize.imageUrl || "https://i.postimg.cc/Gm8bBX5t/image-removebg-preview.png",
      badge: currentSelectedSize.name,
      badgeType: "strawberry",
      categoryName: "Armá tu Vaso",
    };

    const cartItemId = `custom-combo-${Date.now()}`;
    const customCartItem: CartItem = {
      id: cartItemId,
      product: customProduct,
      quantity: builderQuantity,
      notes: builderNotes.trim() || undefined,
      customDetails: {
        sizeName: currentSelectedSize.name,
        comboType: builderComboType,
        step1Fruit: builderStep1Fruit,
        step2Base: builderComboType === "full" ? builderStep2Base : undefined,
        step3Fruit: builderStep3Fruit,
        step4Toppings: builderComboType === "full" ? builderStep4Toppings : [],
      }
    };

    setCart(prev => [...prev, customCartItem]);
    setIsCupBuilderOpen(false);
    resetCupBuilder();
    setToastMessage(`¡${currentSelectedSize.name} agregado al pedido!`);
    setTimeout(() => setToastMessage(null), 2500);
    setIsCartOpen(true);
  };

  // Fetch dynamic menu from Supabase & subscribe to real-time changes
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (data) {
          const configRow = data.find((i: any) => i.id === "cup-builder-config" || i.category === "Armá tu Vaso");
          if (configRow && configRow.description) {
            try {
              const parsed = JSON.parse(configRow.description);
              setCupConfig({
                ...DEFAULT_CUP_BUILDER_CONFIG,
                ...parsed,
                sizes: (parsed.sizes && parsed.sizes.length > 0) ? parsed.sizes : DEFAULT_CUP_BUILDER_CONFIG.sizes,
              });
            } catch (e) {
              console.error("Error parsing cup builder config:", e);
            }
          }
          setCategories(buildCategoriesFromItems(data));
        }
      } catch (err) {
        console.error("Error al cargar menú desde Supabase:", err);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenu();

    // Subscribe to real-time updates from Supabase
    const channel = supabase
      .channel("corta-la-fruta-menu-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenAbout = () => {
    setIsAboutOpen(true);
    setIsAboutHighlighted(true);
    setTimeout(() => {
      const el = document.getElementById("quienes-somos");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
    setTimeout(() => {
      setIsAboutHighlighted(false);
    }, 2200);
  };
  
  // Category Scroll Ref & PC Mouse Drag-to-Scroll State
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const scrollCategoryNav = (direction: "left" | "right") => {
    if (categoryNavRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      categoryNavRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleCategoryMouseDown = (e: React.MouseEvent) => {
    if (!categoryNavRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - categoryNavRef.current.offsetLeft);
    setScrollLeftPos(categoryNavRef.current.scrollLeft);
  };

  const handleCategoryMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleCategoryMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !categoryNavRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryNavRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoryNavRef.current.scrollLeft = scrollLeftPos - walk;
  };
  
  // Real-time Store Status & Clock (Lun-Sáb 9:00-20:00)
  const [currentTimeString, setCurrentTimeString] = useState<string>("");
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  useEffect(() => {
    const updateStoreStatus = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const day = now.getDay(); // 0 = Sunday, 1-6 = Mon-Sat

      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hs`;
      setCurrentTimeString(formattedTime);

      // Open Mon-Sat 9:00 to 20:00
      const isOpen = day >= 1 && day <= 6 && hours >= 9 && hours < 20;
      setIsOpenNow(isOpen);
    };

    updateStoreStatus();
    const interval = setInterval(updateStoreStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [modalNote, setModalNote] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore saved order notes from localStorage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("cortalafruta_notes");
      if (savedNotes) {
        setOrderNotes(savedNotes);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOrderNotesChange = (val: string) => {
    setOrderNotes(val);
    try {
      localStorage.setItem("cortalafruta_notes", val);
    } catch {
      // ignore
    }
  };

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Single Custom Cup product item (with "Desde" starting price of the smallest size)
  const minCupPrice = safeSizes.length > 0
    ? Math.min(...safeSizes.map(s => s.fruitsOnlyPrice))
    : 7500;

  const customCupProduct: Product | null = cupConfig.enabled ? {
    id: "cup-builder-product",
    name: cupConfig.name || "Armá tu Vaso",
    description: cupConfig.description || "Elegí el tamaño de tu vaso, frutas, yogur o crema y toppings capa por capa a tu gusto.",
    price: minCupPrice,
    promoPrice: null,
    imageUrl: FRUIT_CUP_IMAGE_URL,
    badge: "🥤 Armá tu Vaso",
    badgeType: "strawberry",
    categoryName: "Armá tu Vaso",
  } : null;

  // Filter Categories based on activeCategory
  const filteredCategories = categories
    .filter(cat => activeCategory === "all" || cat.id === activeCategory);

  // Flattened products for "Todos los productos" pagination (4 cols x 2 rows = 8 items per page)
  const ITEMS_PER_PAGE = 8;
  const standardProducts = activeCategory === "all"
    ? Array.from(
        new Map(
          categories.flatMap(cat => cat.items.map(item => [item.id, { ...item, categoryName: item.categoryName }]))
        ).values()
      )
    : filteredCategories.flatMap(cat => 
        cat.items.map(item => ({ ...item, categoryName: cat.name }))
      );
  
  const allFlatProducts = activeCategory === "armar-vaso"
    ? (customCupProduct ? [customCupProduct] : [])
    : activeCategory === "all"
    ? (customCupProduct ? [customCupProduct, ...standardProducts] : standardProducts)
    : standardProducts;

  const totalPages = Math.ceil(allFlatProducts.length / ITEMS_PER_PAGE);
  const paginatedFlatProducts = allFlatProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Cart helper functions
  const addToCart = (product: Product, itemNotes?: string) => {
    const cleanNote = itemNotes?.trim() || "";
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.product.id === product.id && (item.notes || "") === cleanNote
      );
      if (existing) {
        return prevCart.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return [...prevCart, { id: cartItemId, product, quantity: 1, notes: cleanNote || undefined }];
    });

    setToastMessage(`¡${product.name} agregado al pedido!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateQuantity = (cartItemIdOrProductId: string, delta: number) => {
    setCart((prevCart) => {
      // 1. Try matching by unique item ID
      const byCartId = prevCart.find(item => item.id === cartItemIdOrProductId);
      if (byCartId) {
        return prevCart
          .map(item => {
            if (item.id === cartItemIdOrProductId) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];
      }

      // 2. Fallback: match by product ID (e.g. from catalog card buttons)
      const byProductId = prevCart.find(item => item.product.id === cartItemIdOrProductId);
      if (byProductId) {
        return prevCart
          .map(item => {
            if (item.id === byProductId.id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];
      }

      return prevCart;
    });
  };

  const removeFromCart = (cartItemIdOrProductId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== cartItemIdOrProductId && item.product.id !== cartItemIdOrProductId));
  };

  const getProductEffectivePrice = (prod: Product) => {
    if (prod.promoPrice && prod.promoPrice > 0 && prod.promoPrice < prod.price) {
      return prod.promoPrice;
    }
    return prod.price;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (getProductEffectivePrice(item.product) * item.quantity), 0);

  // Generate WhatsApp Order Link (Direct API & Bulletproof formatting)
  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*Hola Corta la Fruta!* 🍓\nQuisiera realizar el siguiente pedido:\n\n`;
    
    cart.forEach(item => {
      const effectiveUnitPrice = getProductEffectivePrice(item.product);
      const lineTotal = effectiveUnitPrice * item.quantity;
      const isOffer = item.product.promoPrice && item.product.promoPrice < item.product.price;
      const promoTag = isOffer ? " *(OFERTA)*" : "";

      message += `• *${item.quantity}x ${item.product.name}* — $${lineTotal.toLocaleString("es-AR")}${promoTag}\n`;
      if (item.customDetails) {
        message += `   ↳ _Presentación: ${item.customDetails.sizeName} (${item.customDetails.comboType === "full" ? "Completo: Frutas + Yogur + Toppings" : "Solo Frutas"})_\n`;
        message += `   ↳ _1ª Fruta: ${item.customDetails.step1Fruit}_\n`;
        if (item.customDetails.comboType === "full" && item.customDetails.step2Base) {
          message += `   ↳ _Yogur/Crema: ${item.customDetails.step2Base}_\n`;
        }
        message += `   ↳ _2ª Fruta: ${item.customDetails.step3Fruit}_\n`;
        if (item.customDetails.comboType === "full" && item.customDetails.step4Toppings && item.customDetails.step4Toppings.length > 0) {
          message += `   ↳ _Toppings/Salsas: ${item.customDetails.step4Toppings.join(", ")}_\n`;
        }
      }
      if (item.notes && item.notes.trim()) {
        message += `   ↳ _Aclaración: ${item.notes.trim()}_\n`;
      }
    });

    message += `\n💰 *Total del pedido: $${totalCartPrice.toLocaleString("es-AR")}*`;

    const cleanNotes = orderNotes.trim();
    if (cleanNotes) {
      message += `\n\n📝 *NOTAS / ACLARACIONES DEL PEDIDO:*\n${cleanNotes}`;
    }

    message += `\n\nQuedo a la espera de la confirmación. ¡Muchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = "5491124735186";
    const directApiUrl = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodedMessage}`;

    // Reliable link trigger across mobile (Safari/Chrome) and desktop
    try {
      const link = document.createElement("a");
      link.href = directApiUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 100);
    } catch {
      window.location.href = directApiUrl;
    }
  };

  return (
    <main className="min-h-screen font-sans bg-[#FFFDF9] text-zinc-900 antialiased selection:bg-rose-500 selection:text-white">
      
      {/* VIBRANT FRUIT COLORED ACCENT BAR (Frutilla, Banana, Kiwi) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500" />

      {/* TOP ANNOUNCEMENT BAR WITH LIVE CLOCK & STORE STATUS */}
      <div className="bg-zinc-950 text-white text-xs py-2 px-4 text-center font-semibold flex flex-wrap items-center justify-center gap-2.5 border-b border-zinc-800">
        {isOpenNow ? (
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/90 border border-emerald-800/90 px-2.5 py-0.5 rounded-full text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ABIERTO AHORA
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-rose-400 bg-rose-950/90 border border-rose-800/90 px-2.5 py-0.5 rounded-full text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            CERRADO AHORA
          </span>
        )}

        <span className="text-amber-300 font-mono font-bold">
          {currentTimeString || "19:50 hs"}
        </span>

        <span className="text-zinc-400 font-normal hidden sm:inline">
          • Horario: Lun a Sáb 9:00–20:00 hs • Nicolás Videla 173, Quilmes
        </span>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Logo & Store Name */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <img 
              src="/logo-corta-la-fruta.png" 
              alt="Corta la Fruta Logo" 
              className="h-10 sm:h-14 md:h-16 w-auto object-contain shrink-0" 
            />
            <h1 
              aria-label="Corta la Fruta"
              className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight text-zinc-900 leading-none flex items-center whitespace-nowrap select-none"
            >
              <span>C</span>
              <img 
                src="/orange-o.png" 
                alt="O" 
                className="inline-block h-[0.88em] w-[0.88em] object-contain mx-[0.02em] translate-y-[0.02em] shrink-0 drop-shadow-xs" 
              />
              <span>RTA LA FRUTA</span>
            </h1>
          </div>

          {/* WhatsApp Direct Header Button & Cart Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
            <button
              onClick={handleOpenAbout}
              className="text-xs font-bold text-zinc-700 hover:text-zinc-900 px-3.5 py-2 rounded-xl hover:bg-zinc-100 transition-colors hidden md:flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-amber-500 fill-amber-400" />
              <span>Quiénes Somos</span>
            </button>

            <a 
              href="https://wa.me/5491124735186" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <WhatsAppIcon size={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Pedido</span>
              {totalCartCount > 0 && (
                <span className="bg-amber-400 text-zinc-950 font-extrabold text-xs px-1.5 py-0.2 rounded-full shadow-2xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO PROMOTIONAL BANNER CAROUSEL */}
      <HeroPromoBannerCarousel />

      {/* STICKY CATEGORY FILTER BAR */}
      <nav className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-2 sm:py-3 px-3 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 sm:gap-2">
          
          {/* PC Left Scroll Arrow Button */}
          <button
            onClick={() => scrollCategoryNav("left")}
            className="hidden md:flex p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors shrink-0 shadow-2xs"
            title="Desplazar a la izquierda"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Scrollable Container with PC Mouse Drag */}
          <div 
            ref={categoryNavRef}
            onMouseDown={handleCategoryMouseDown}
            onMouseLeave={handleCategoryMouseLeaveOrUp}
            onMouseUp={handleCategoryMouseLeaveOrUp}
            onMouseMove={handleCategoryMouseMove}
            className={`w-full min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth touch-pan-x cursor-grab ${
              isMouseDown ? "cursor-grabbing select-none" : ""
            }`}
          >
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === "all"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
              }`}
            >
              Todos los productos
            </button>

            {cupConfig.enabled && (
              <button
                onClick={() => {
                  setActiveCategory("armar-vaso");
                  openCupBuilderForSize("");
                }}
                className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                  activeCategory === "armar-vaso"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100"
                }`}
              >
                <span>🍓 {cupConfig.name || "Armá tu Vaso"}</span>
              </button>
            )}

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? cat.theme === "strawberry" 
                      ? "bg-rose-500 text-white shadow-xs" 
                      : cat.theme === "kiwi" 
                      ? "bg-emerald-600 text-white shadow-xs" 
                      : "bg-amber-500 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                }`}
              >
                <span>{(CATEGORY_META[cat.name]?.icon ? `${CATEGORY_META[cat.name].icon} ` : "") + cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
                }`}>
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>

          {/* PC Right Scroll Arrow Button */}
          <button
            onClick={() => scrollCategoryNav("right")}
            className="hidden md:flex p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors shrink-0 shadow-2xs"
            title="Desplazar a la derecha"
          >
            <ChevronRight size={16} />
          </button>

        </div>
      </nav>

      {/* PRODUCT CATALOG GRID */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-12">
        {isLoadingMenu && categories.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-zinc-200 p-8 space-y-3">
            <Loader2 size={36} className="mx-auto text-rose-500 animate-spin" />
            <h4 className="font-extrabold text-base text-zinc-800">
              Cargando productos frescos...
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Conectando con la base de datos de Corta la Fruta.
            </p>
          </div>
        ) : allFlatProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200/90 p-8 space-y-4 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Package size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-zinc-900">
                Catálogo en preparación
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                Estamos preparando y cargando los nuevos productos frescos. ¡Podés consultar y hacer tu pedido directo por WhatsApp!
              </p>
            </div>
            <a
              href="https://wa.me/5491124735186"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <WhatsAppIcon size={16} />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        ) : activeCategory === "all" || activeCategory === "armar-vaso" ? (
          /* PAGINATED GRID FOR ALL PRODUCTS / ARMAR VASO */
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Organic Floating Cup - No box, pure transparent image */}
                <div 
                  onClick={() => openCupBuilderForSize("")}
                  className="relative w-12 h-16 sm:w-14 sm:h-20 shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform touch-manipulation"
                >
                  <img 
                    src={FRUIT_CUP_IMAGE_URL} 
                    alt="Vaso Corta la Fruta" 
                    className="w-full h-full object-contain animate-float drop-shadow-md"
                  />
                  <div className="absolute -bottom-1 w-9 sm:w-11 h-1.5 bg-black/20 rounded-full blur-[1.5px] animate-float-shadow pointer-events-none" />
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
                    {activeCategory === "armar-vaso" ? (cupConfig.name || "Armá tu Vaso") : `Todos los Productos (${allFlatProducts.length})`}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {activeCategory === "armar-vaso"
                      ? "Armá tu vaso con tus frutas, bases y toppings a elección"
                      : `Mostrando ${paginatedFlatProducts.length} de ${allFlatProducts.length} productos (Página ${currentPage} de ${totalPages || 1})`}
                  </p>
                </div>
              </div>

              {/* Top Page Navigator */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>

            {/* MERCADO LIBRE STYLE GRID (2 COLS MOBILE / 4 COLS DESKTOP) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {paginatedFlatProducts.map((product) => {
                const inCartItem = cart.find(i => i.product.id === product.id);
                const quantityInCart = inCartItem ? inCartItem.quantity : 0;
                const isCupBuilder = product.id.startsWith("cup-size-") || product.id === "cup-builder-product";

                return (
                  <div 
                    key={product.id}
                    onClick={() => {
                      if (isCupBuilder) {
                        openCupBuilderForSize("");
                      } else {
                        setSelectedProduct(product);
                        setModalNote("");
                      }
                    }}
                    className={`cursor-pointer bg-white rounded-xl sm:rounded-2xl border border-zinc-200/80 hover:border-zinc-300 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group p-2.5 sm:p-3.5 select-none touch-manipulation ${
                      paginatedFlatProducts.length === 1 ? "col-span-2 max-w-md mx-auto w-full sm:col-span-1" : ""
                    }`}
                  >
                    {/* Image / 3D Model Viewport */}
                    <div className="relative aspect-4/3 w-full bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center">
                      {isCupBuilder ? (
                        <div className="w-full h-full p-2 flex items-center justify-center">
                          <img 
                            src={FRUIT_CUP_IMAGE_URL} 
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : product.has3DModel && product.glbUrl ? (
                        <div 
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {React.createElement('model-viewer', {
                            id: `grid-viewer-${product.id}`,
                            src: product.glbUrl,
                            alt: product.name,
                            ar: true,
                            'ar-modes': "scene-viewer webxr quick-look",
                            'ar-scale': "auto",
                            'interaction-prompt': "none",
                            scale: "1 1 1",
                            'camera-controls': true,
                            'auto-rotate': true,
                            'disable-zoom': true,
                            'disable-pan': true,
                            'min-camera-orbit': "auto 0deg auto",
                            'max-camera-orbit': "auto 90deg auto",
                            'shadow-intensity': "1.5",
                            'exposure': "0.7",
                            'environment-image': "neutral",
                            'loading': "eager",
                            'reveal': "auto",
                            style: { width: "100%", height: "100%", backgroundColor: "transparent" },
                            class: "w-full h-full object-contain"
                          })}
                        </div>
                      ) : (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      
                      {/* Badge Overlay & OFERTA */}
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 pointer-events-none">
                        {product.promoPrice && product.promoPrice < product.price && (
                          <div className="bg-rose-600 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-0.5">
                            <span>🔥</span> OFERTA
                          </div>
                        )}
                        {product.badge && (
                          <div className="bg-rose-500 text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs">
                            {product.badge}
                          </div>
                        )}
                      </div>

                      {/* 3D Button */}
                      {!isCupBuilder && product.has3DModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive3DModal(product);
                          }}
                          className="absolute top-1.5 right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 transition-transform active:scale-95 z-10"
                        >
                          <Box size={13} className="text-white" />
                          <span>AR 3D</span>
                        </button>
                      )}
                    </div>

                    {/* Product Details (Mercado Libre Price-First Hierarchy) */}
                    <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
                      <div>
                        {isCupBuilder ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Desde</span>
                            <span className="font-extrabold text-sm sm:text-base text-zinc-900 font-mono">
                              ${product.price.toLocaleString("es-AR")}
                            </span>
                          </div>
                        ) : product.promoPrice && product.promoPrice < product.price ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-mono line-through text-zinc-400">
                              ${product.price.toLocaleString("es-AR")}
                            </span>
                            <span className="font-extrabold text-sm sm:text-base text-rose-600 font-mono">
                              ${product.promoPrice.toLocaleString("es-AR")}
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-sm sm:text-base text-zinc-900 font-mono block">
                            ${product.price.toLocaleString("es-AR")}
                          </span>
                        )}

                        <h4 className="font-semibold text-xs text-zinc-800 leading-snug line-clamp-2 mt-0.5 group-hover:text-rose-600 transition-colors">
                          {product.name}
                        </h4>

                        <span className="text-[9px] font-bold uppercase text-emerald-700 block mt-0.5">
                          {product.categoryName}
                        </span>

                        <p className="hidden sm:block text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mt-1 font-normal">
                          {product.description}
                        </p>
                      </div>

                      {/* Add to Cart Controls */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-100">
                        {isCupBuilder ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCupBuilderForSize("");
                            }}
                            className="w-full bg-[#E2004B] hover:bg-[#c70041] active:bg-[#a60037] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer touch-manipulation"
                          >
                            <span>Armar Vaso</span>
                            <ChevronRight size={14} />
                          </button>
                        ) : quantityInCart > 0 ? (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 rounded-lg p-0.5 justify-between"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, -1);
                              }}
                              className="w-5 h-5 rounded bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-emerald-100"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="font-extrabold text-[10px] sm:text-[11px] text-emerald-950 px-1">
                              {quantityInCart}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, 1);
                              }}
                              className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-emerald-700"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Plus size={13} />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-zinc-200/80">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                >
                  ‹ Anterior
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? "bg-zinc-900 text-white shadow-xs"
                            : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </div>
        ) : (
          /* SPECIFIC CATEGORY VIEW (4 COLS GRID) */
          filteredCategories.map((category) => (
            <div key={category.id} className="scroll-mt-36">
              <div className="mb-6 flex items-start gap-3">
                <div className={`w-3.5 h-8 rounded-full ${
                  category.theme === "strawberry" ? "bg-rose-500" :
                  category.theme === "kiwi" ? "bg-emerald-500" : "bg-amber-400"
                }`} />
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
                    {category.name}
                  </h3>
                  {category.subtitle && (
                    <p className="text-sm text-zinc-500 font-medium mt-0.5">{category.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {category.items.map((product) => {
                  const inCartItem = cart.find(i => i.product.id === product.id);
                  const quantityInCart = inCartItem ? inCartItem.quantity : 0;

                  return (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setModalNote("");
                      }}
                      className="cursor-pointer bg-white rounded-xl sm:rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group p-2.5 sm:p-3.5"
                    >
                      <div className="relative aspect-4/3 w-full bg-zinc-100 rounded-lg overflow-hidden">
                        {product.has3DModel && product.glbUrl ? (
                          <div 
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            {React.createElement('model-viewer', {
                              id: `cat-grid-viewer-${product.id}`,
                              src: product.glbUrl,
                              alt: product.name,
                              ar: true,
                              'ar-modes': "scene-viewer webxr quick-look",
                              'ar-scale': "auto",
                              'interaction-prompt': "none",
                              scale: "1 1 1",
                              'camera-controls': true,
                              'auto-rotate': true,
                              'disable-zoom': true,
                              'disable-pan': true,
                              'min-camera-orbit': "auto 0deg auto",
                              'max-camera-orbit': "auto 90deg auto",
                              'shadow-intensity': "1.5",
                              'exposure': "0.7",
                              'environment-image': "neutral",
                              'loading': "eager",
                              'reveal': "auto",
                              style: { width: "100%", height: "100%", backgroundColor: "transparent" },
                              class: "w-full h-full object-contain"
                            })}
                          </div>
                        ) : (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        {/* Badge Overlay & OFERTA */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 pointer-events-none">
                          {product.promoPrice && product.promoPrice < product.price && (
                            <div className="bg-rose-600 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-0.5">
                              <span>🔥</span> OFERTA
                            </div>
                          )}
                          {product.badge && (
                            <div className={`text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs ${
                              product.badgeType === "strawberry" ? "bg-rose-500 text-white" :
                              product.badgeType === "kiwi" ? "bg-emerald-600 text-white" :
                              "bg-amber-500 text-white"
                            }`}>
                              {product.badge}
                            </div>
                          )}
                        </div>
                        {product.has3DModel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActive3DModal(product);
                            }}
                            className="absolute top-1.5 right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 transition-transform active:scale-95 z-10"
                          >
                            <Box size={13} className="text-white" />
                            <span>AR 3D</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
                        <div>
                          {product.promoPrice && product.promoPrice < product.price ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-mono line-through text-zinc-400">
                                ${product.price.toLocaleString("es-AR")}
                              </span>
                              <span className="font-extrabold text-sm sm:text-base text-rose-600 font-mono">
                                ${product.promoPrice.toLocaleString("es-AR")}
                              </span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-sm sm:text-base text-zinc-900 font-mono block">
                              ${product.price.toLocaleString("es-AR")}
                            </span>
                          )}

                          <h4 className="font-semibold text-xs text-zinc-800 leading-snug line-clamp-2 mt-0.5 group-hover:text-rose-600 transition-colors">
                            {product.name}
                          </h4>

                          <p className="hidden sm:block text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mt-1 font-normal">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-zinc-100">
                          {quantityInCart > 0 ? (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 rounded-lg p-0.5 justify-between"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, -1);
                                }}
                                className="w-5 h-5 rounded bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-emerald-100"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="font-extrabold text-[10px] sm:text-[11px] text-emerald-950 px-1">
                                {quantityInCart}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, 1);
                                }}
                                className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-emerald-700"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Plus size={13} />
                              <span>Agregar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* PRODUCT DETAIL POPUP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Image Header */}
            <div className="relative aspect-4/3 w-full bg-zinc-100 shrink-0 overflow-hidden">
              {selectedProduct.has3DModel && selectedProduct.glbUrl ? (
                <div 
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {React.createElement('model-viewer', {
                    id: `modal-img-viewer-${selectedProduct.id}`,
                    src: selectedProduct.glbUrl,
                    alt: selectedProduct.name,
                    ar: true,
                    'ar-modes': "scene-viewer webxr quick-look",
                    'ar-scale': "auto",
                    'interaction-prompt': "none",
                    scale: "1 1 1",
                    'camera-controls': true,
                    'auto-rotate': true,
                    'disable-zoom': true,
                    'disable-pan': true,
                    'min-camera-orbit': "auto 0deg auto",
                    'max-camera-orbit': "auto 90deg auto",
                    'shadow-intensity': "1.5",
                    'exposure': "0.7",
                    'environment-image': "neutral",
                    'loading': "eager",
                    'reveal': "auto",
                    style: { width: "100%", height: "100%", backgroundColor: "transparent" },
                    class: "w-full h-full object-contain"
                  })}
                </div>
              ) : (
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setModalNote("");
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
              >
                <X size={18} />
              </button>

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                {selectedProduct.promoPrice && selectedProduct.promoPrice < selectedProduct.price && (
                  <div className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-lg shadow-md flex items-center gap-1">
                    <span>🔥</span> OFERTA
                  </div>
                )}
                {selectedProduct.badge && (
                  <div className="bg-rose-500 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-lg shadow-md">
                    {selectedProduct.badge}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-extrabold text-xl sm:text-2xl text-zinc-900 leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <div className="text-right shrink-0">
                    {selectedProduct.promoPrice && selectedProduct.promoPrice < selectedProduct.price ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono line-through text-zinc-400">
                          ${selectedProduct.price.toLocaleString("es-AR")}
                        </span>
                        <span className="font-extrabold text-lg sm:text-xl text-rose-600 font-mono bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-xl shadow-2xs">
                          ${selectedProduct.promoPrice.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-lg text-rose-600 font-mono bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl shrink-0">
                        ${selectedProduct.price.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                </div>
                {selectedProduct.categoryName && (
                  <span className="text-xs font-extrabold uppercase text-emerald-700 block">
                    {selectedProduct.categoryName}
                  </span>
                )}
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-1">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Descripción del producto</h5>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Item Clarification / Note Input */}
              <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/80 space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span>📝</span> Aclaración para este producto (opcional)
                </label>
                <input
                  type="text"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Ej: Sin kiwi, cambiar durazno por frutilla..."
                  className="w-full bg-white border border-amber-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {selectedProduct.has3DModel && (
                  <button
                    onClick={() => {
                      const prod = selectedProduct;
                      setSelectedProduct(null);
                      setModalNote("");
                      setActive3DModal(prod);
                    }}
                    className="py-3 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                  >
                    <Box size={16} className="text-emerald-600" />
                    <span>Ver 3D</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    addToCart(selectedProduct, modalNote);
                    setSelectedProduct(null);
                    setModalNote("");
                  }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus size={18} />
                  <span>Agregar al Pedido</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3D INTERACTIVE MODAL WITH REAL AR SYSTEM */}
      {active3DModal && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 px-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Box size={18} className="text-emerald-600" />
                <h3 className="font-bold text-base text-zinc-900">Visor 3D & Realidad Aumentada (AR)</h3>
              </div>
              <button 
                onClick={() => setActive3DModal(null)}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3D Model Viewport with AR Button */}
            <div className="relative h-80 bg-gradient-to-b from-zinc-100 to-zinc-50 flex items-center justify-center p-2">
              {React.createElement('model-viewer', {
                id: `viewer-${active3DModal.id}`,
                src: active3DModal.glbUrl || "/uploads/1787369490158-Spicy Ramen.glb",
                'ios-src': active3DModal.usdzUrl || undefined,
                alt: `Modelo 3D de ${active3DModal.name}`,
                ar: true,
                'ar-modes': "scene-viewer webxr quick-look",
                'ar-scale': "auto",
                'interaction-prompt': "none",
                scale: active3DModal.scale ? `${active3DModal.scale} ${active3DModal.scale} ${active3DModal.scale}` : "1 1 1",
                'camera-controls': true,
                'auto-rotate': true,
                'disable-zoom': true,
                'disable-pan': true,
                'min-camera-orbit': "auto 0deg auto",
                'max-camera-orbit': "auto 90deg auto",
                'shadow-intensity': "1.5",
                'exposure': "0.7",
                'environment-image': "neutral",
                'loading': "eager",
                'reveal': "auto",
                style: { width: "100%", height: "100%", backgroundColor: "transparent" },
                class: "w-full h-full object-contain"
              },
                <button
                  slot="ar-button"
                  className="absolute bottom-3 right-3 bg-zinc-900 hover:bg-black text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 z-20 border border-zinc-700"
                >
                  <Box size={15} className="text-emerald-400" />
                  <span>Ver en mi mesa (AR)</span>
                </button>
              )}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-extrabold text-lg text-zinc-900">{active3DModal.name}</h4>
                {active3DModal.promoPrice && active3DModal.promoPrice < active3DModal.price ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono line-through text-zinc-400">
                      ${active3DModal.price.toLocaleString("es-AR")}
                    </span>
                    <span className="font-mono font-extrabold text-base text-rose-600 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-xl shadow-2xs">
                      ${active3DModal.promoPrice.toLocaleString("es-AR")}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-extrabold text-base text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl">
                    ${active3DModal.price.toLocaleString("es-AR")}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-6 font-normal">
                {active3DModal.description}
              </p>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActive3DModal(null)}
                  className="w-1/2 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    addToCart(active3DModal);
                    setActive3DModal(null);
                  }}
                  className="w-1/2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={16} />
                  <span>Agregar al Pedido</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER MODAL WITH OFFICIAL WHATSAPP LOGO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-rose-500" />
                <h3 className="font-extrabold text-lg text-zinc-900">Tu Pedido</h3>
                <span className="text-xs bg-rose-100 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-full">
                  {totalCartCount} items
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 space-y-3">
                  <ShoppingBag size={48} className="mx-auto opacity-30 stroke-1" />
                  <p className="text-sm font-semibold">Tu carrito está vacío</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Agregá vasos de fruta, ensaladas o potes de yogur con granola a tu pedido.
                  </p>
                </div>
              ) : (
                <>
                  {cart.map((item) => {
                    const { product, quantity, notes } = item;
                    const itemKey = item.id || product.id;

                    return (
                      <div 
                        key={itemKey}
                        className="p-3.5 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg bg-zinc-100 shrink-0 overflow-hidden relative flex items-center justify-center border border-zinc-200/60">
                            {product.has3DModel && product.glbUrl ? (
                              <div className="w-full h-full pointer-events-none select-none">
                                {React.createElement('model-viewer', {
                                  id: `cart-thumb-${itemKey}`,
                                  src: product.glbUrl,
                                  alt: product.name,
                                  'interaction-prompt': 'none',
                                  scale: '1 1 1',
                                  'camera-controls': false,
                                  'auto-rotate': false,
                                  'shadow-intensity': '1.5',
                                  'exposure': '0.7',
                                  'environment-image': 'neutral',
                                  'loading': 'eager',
                                  'reveal': 'auto',
                                  style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
                                  class: 'w-full h-full object-contain pointer-events-none'
                                })}
                              </div>
                            ) : (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-zinc-900 truncate">{product.name}</h4>
                            {(() => {
                              const effectivePrice = getProductEffectivePrice(product);
                              const isOffer = product.promoPrice && product.promoPrice < product.price;
                              return (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isOffer && (
                                    <span className="text-[10px] font-mono line-through text-zinc-400">
                                      ${(product.price * quantity).toLocaleString("es-AR")}
                                    </span>
                                  )}
                                  <span className="text-xs font-mono font-extrabold text-rose-600">
                                    ${(effectivePrice * quantity).toLocaleString("es-AR")}
                                  </span>
                                  {isOffer && (
                                    <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                      Oferta
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1.5 bg-zinc-100 rounded-lg p-0.5">
                                <button
                                  onClick={() => updateQuantity(itemKey, -1)}
                                  className="w-6 h-6 rounded bg-white text-zinc-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-zinc-200"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-bold px-2">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(itemKey, 1)}
                                  className="w-6 h-6 rounded bg-white text-zinc-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-zinc-200"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(itemKey)}
                            className="p-2 text-zinc-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {item.customDetails && (
                          <div className="text-[11px] bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 space-y-1 text-zinc-700">
                            <p className="font-extrabold text-rose-900 text-[10px] uppercase tracking-wider flex items-center justify-between">
                              <span>🍓 {item.customDetails.sizeName}</span>
                              <span className="text-zinc-500 font-bold">{item.customDetails.comboType === "full" ? "Completo" : "Solo Frutas"}</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                              <div><span className="font-bold text-rose-700">1ª Fruta:</span> {item.customDetails.step1Fruit}</div>
                              {item.customDetails.comboType === "full" && item.customDetails.step2Base && (
                                <div><span className="font-bold text-blue-700">Yogur:</span> {item.customDetails.step2Base}</div>
                              )}
                              <div><span className="font-bold text-emerald-700">2ª Fruta:</span> {item.customDetails.step3Fruit}</div>
                              {item.customDetails.comboType === "full" && (
                                <div><span className="font-bold text-amber-700">Toppings:</span> {item.customDetails.step4Toppings.join(", ") || "Sin toppings"}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {notes && (
                          <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5 font-medium">
                            <span className="font-bold text-amber-800 shrink-0">Nota:</span>
                            <span className="italic">{notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Order Notes */}
                  <div className="pt-4 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-800">
                        Notas o aclaraciones para tu pedido:
                      </label>
                      {orderNotes.trim() && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" />
                          Incluida en el pedido
                        </span>
                      )}
                    </div>
                    <textarea 
                      value={orderNotes}
                      onChange={(e) => handleOrderNotesChange(e.target.value)}
                      placeholder="Ej: Sin endulzante extra, cambiar kiwi por frutilla, enviar cubiertos..."
                      className="w-full border border-zinc-200 focus:border-rose-500 rounded-xl p-3 text-xs outline-none resize-none h-20 font-sans transition-colors bg-zinc-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Esta nota se enviará directamente en el mensaje de WhatsApp a Corta la Fruta.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer with WhatsApp Logo Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-600">Total estimado:</span>
                  <span className="text-xl font-extrabold text-zinc-900 font-mono">
                    ${totalCartPrice.toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Accepted Payment Methods */}
                <div className="pt-2 border-t border-zinc-200/80">
                  <span className="text-[11px] font-semibold text-zinc-500 block mb-2 text-center">
                    Medios de Pago Aceptados
                  </span>
                  <div className="flex items-center justify-center gap-4 bg-white p-2 rounded-xl border border-zinc-200/60">
                    <img 
                      src="/payments/mercadopago.png" 
                      alt="Mercado Pago" 
                      className="h-6 w-auto object-contain"
                      title="Mercado Pago"
                    />
                    <img 
                      src="/payments/visa.png" 
                      alt="Visa" 
                      className="h-5 w-auto object-contain"
                      title="Visa"
                    />
                    <img 
                      src="/payments/mastercard.png" 
                      alt="Mastercard" 
                      className="h-6 w-auto object-contain"
                      title="Mastercard"
                    />
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-md"
                >
                  <WhatsAppIcon size={22} />
                  <span>Enviar pedido por WhatsApp</span>
                </button>
                
                <p className="text-[11px] text-zinc-400 text-center font-medium">
                  Se abrirá tu WhatsApp con el mensaje estructurado de tu pedido.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CART BAR */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-zinc-800 hover:bg-zinc-800 transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white font-bold flex items-center justify-center text-xs">
                {totalCartCount}
              </div>
              <div className="text-left">
                <span className="text-xs text-zinc-400 block font-medium">Tu pedido activo</span>
                <span className="text-sm font-bold text-white">Ver carrito ({totalCartCount} items)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base text-amber-400">
                ${totalCartPrice.toLocaleString("es-AR")}
              </span>
              <ChevronRight size={18} className="text-zinc-400" />
            </div>
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* QUIÉNES SOMOS EXPANDABLE SECTION */}
      <section id="quienes-somos" className="max-w-6xl mx-auto px-4 md:px-6 pt-10 scroll-mt-28">
        <div className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden shadow-2xs ${
          isAboutHighlighted 
            ? "border-rose-400 ring-4 ring-rose-400/40 shadow-2xl scale-[1.01]" 
            : "border-zinc-200/90"
        }`}>
          <button
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-50/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🌿</span>
              <div>
                <h3 className="font-extrabold text-lg md:text-xl text-zinc-900 leading-tight">
                  Quiénes Somos
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Conocé nuestra historia, filosofía y pasión por la fruta fresca.
                </p>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold transition-transform duration-300 ${isAboutOpen ? "rotate-180 bg-rose-50 text-rose-600" : ""}`}>
              <ChevronRight size={18} className="rotate-90" />
            </div>
          </button>

          {isAboutOpen && (
            <div className="px-6 pb-6 pt-2 border-t border-zinc-100 text-sm text-zinc-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="leading-relaxed font-medium">
                En <strong>Corta la Fruta</strong> creemos que comer rico también puede ser fresco, natural y divertido.
              </p>
              
              <p className="leading-relaxed font-normal">
                Somos un espacio creado para quienes disfrutan de los sabores auténticos, la fruta fresca y las combinaciones que sorprenden. Seleccionamos nuestros ingredientes con dedicación para ofrecerte productos ricos, frescos y preparados especialmente para vos.
              </p>
              
              <p className="leading-relaxed font-normal">
                Nos encanta transformar ingredientes simples en experiencias llenas de color, sabor y frescura. Cada preparación está pensada para que puedas disfrutar algo diferente, ya sea para darte un gusto, compartir o simplemente disfrutar tu momento.
              </p>

              <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl space-y-2 my-3">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                  <span>🍊</span> Frescura en cada bocado
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Trabajamos cada día para brindarte productos de calidad, una atención cercana y una experiencia que quieras repetir. <br />
                  <strong>Corta la Fruta es sabor, frescura y ganas de disfrutar. 🍓🥝🍊</strong>
                </p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                  <span>💚</span> Nuestra misión
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  Queremos que cada vez que nos elijas encuentres algo más que un producto: un momento rico, fresco y especial.
                </p>
                <p className="text-xs font-bold text-emerald-950 pt-1">
                  Corta la Fruta — Elegí tu sabor. Disfrutá lo fresco.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* GOOGLE REVIEWS SECTION WITH TRUSTINDEX WIDGET ONLY */}
      <section className="bg-white border-y border-zinc-200/80 py-12 md:py-16 px-4 md:px-6 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-1">
                <Star size={18} className="fill-amber-500" />
                <span className="text-zinc-900">4.8 de 5 Estrellas</span>
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900">Opiniones de nuestros clientes</h3>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs">
              Reseñas reales sincronizadas directamente desde Google Maps.
            </p>
          </div>

          {/* Google Places Reviews Section */}
          <div className="w-full bg-[#FAF9F6] p-4 sm:p-6 rounded-2xl border border-zinc-200/80">
            <GooglePlacesWidget />
          </div>
        </div>
      </section>

      {/* LOCATION & MAP SECTION */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Ubicación & Horarios</h3>
              <p className="text-sm text-zinc-600">
                Visitanos directamente en nuestro local comercial o realizá tu pedido para retirar.
              </p>
            </div>

            <div className="space-y-4 text-sm text-zinc-700">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-zinc-900 font-bold">Dirección:</strong>
                  Nicolás Videla 173<br />
                  B1874 Quilmes, Provincia de Buenos Aires
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-zinc-900 font-bold">Horarios de atención:</strong>
                  Lunes a Sábado: 9:00 a 20:00 hs<br />
                  <span className="text-zinc-500">Domingos: Cerrado</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <WhatsAppIcon size={20} className="text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-zinc-900 font-bold">Contacto WhatsApp:</strong>
                  +54 9 11 2473-5186
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-zinc-200 shadow-xs h-[380px]">
            <iframe 
              src="https://maps.google.com/maps?q=Nicol%C3%A1s%20Videla%20173%2C%20Quilmes%2C%20Provincia%20de%20Buenos%20Aires&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Corta la Fruta - Nicolás Videla 173, Quilmes"
            />
          </div>
        </div>
      </section>

      {/* ULTRA-PROFESSIONAL FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 pt-16 pb-12 px-4 md:px-6 border-t border-zinc-850">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/80">
          
          {/* Col 1: Brand Info & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-corta-la-fruta.png" 
                alt="Corta la Fruta Logo" 
                className="h-12 w-auto bg-white p-1 rounded-xl object-contain shrink-0" 
              />
              <div>
                <span className="font-extrabold text-white text-lg block leading-tight font-space">
                  Corta la Fruta
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Frutería & Bar Saludable</span>
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Lo fresco, lo rico y lo simple, en un solo lugar. Fruta seleccionada y preparada al momento en Quilmes.
            </p>

            <div className="pt-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                Medios de Pago Aceptados
              </span>
              <div className="inline-flex items-center gap-3 bg-white p-2 rounded-xl border border-zinc-800 shadow-2xs">
                <img 
                  src="/payments/mercadopago.png" 
                  alt="Mercado Pago" 
                  className="h-5 w-auto object-contain"
                />
                <img 
                  src="/payments/visa.png" 
                  alt="Visa" 
                  className="h-4 w-auto object-contain"
                />
                <img 
                  src="/payments/mastercard.png" 
                  alt="Mastercard" 
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Col 2: Navigation & Categories */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-space">
              Categorías de Menú
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => {
                      setActiveCategory(cat.id);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }} 
                    className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-zinc-600">›</span> {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Store Details & Schedule */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-space">
              Local & Horarios
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400 font-normal">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200 block font-semibold">Dirección Oficial:</strong>
                  Nicolás Videla 173, B1874 Quilmes, Buenos Aires
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200 block font-semibold">Horario Comercial:</strong>
                  Lunes a Sábado: 09:00 – 20:00 hs<br />
                  <span className="text-zinc-500">Domingos: Cerrado</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Direct WhatsApp Order */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-space">
              Contacto Directo
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              ¿Tenés alguna consulta o querés encargar para un evento? Escribinos directamente.
            </p>
            
            <div className="space-y-2.5 pt-1">
              <a 
                href="https://wa.me/5491124735186" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <WhatsAppIcon size={18} />
                <span>WhatsApp: +54 9 11 2473-5186</span>
              </a>

              <a 
                href="https://instagram.com/cortalafruta" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <AtSign size={16} />
                <span>Instagram: @cortalafruta</span>
              </a>
            </div>
          </div>

        </div>

        {/* Sub-Footer Bar */}
        <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} Corta la Fruta. Todos los derechos reservados.</p>
          
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <span>
              Desarrollado por{" "}
              <a 
                href="https://vidrro.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-200 font-extrabold hover:text-rose-400 transition-colors underline underline-offset-4"
              >
                Vidrro
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* CUP BUILDER MODAL (1:1 EXACT PEDIDOSYA MULTI-SIZE COMBO STYLE) */}
      {isCupBuilderOpen && (
        <div 
          onClick={() => setIsCupBuilderOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl h-[92dvh] max-h-[92dvh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
            
            {/* PedidosYa Top Bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCupBuilderOpen(false)}
                className="p-1 -ml-1 text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-1 cursor-pointer touch-manipulation"
                aria-label="Volver"
              >
                <ChevronLeft size={22} className="stroke-[2.5]" />
                <span className="text-xs font-bold text-zinc-600 sm:hidden">Volver</span>
              </button>

              <h3 className="font-bold text-base text-zinc-900 leading-tight truncate px-2 text-center">
                {cupConfig.name || "Armá tu Vaso"}
              </h3>

              <button
                type="button"
                onClick={() => setIsCupBuilderOpen(false)}
                className="p-1 -mr-1 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer touch-manipulation"
                aria-label="Cerrar"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable List of Options */}
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-200/80 px-4 sm:px-5 overscroll-contain touch-pan-y">
              
              {/* SECTION: TAMAÑO DE TU VASO */}
              <div className="py-4">
                <div 
                  onClick={() => toggleSection("size")}
                  className="flex items-start justify-between cursor-pointer select-none mb-1 touch-manipulation"
                >
                  <div>
                    <h4 className="font-bold text-base text-zinc-900">
                      1. Elegí el tamaño de tu vaso
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {currentSelectedSize ? `Seleccionado: ${currentSelectedSize.name}` : "Elige 1 opción"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Requerido
                    </span>
                    {openSections.size ? (
                      <ChevronUp size={20} className="text-zinc-700" />
                    ) : (
                      <ChevronDown size={20} className="text-zinc-700" />
                    )}
                  </div>
                </div>

                {openSections.size && (
                  <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                    {safeSizes.map((size) => {
                      const isSelected = builderSelectedSizeId === size.id;
                      return (
                        <div
                          key={size.id}
                          onClick={() => {
                            setBuilderSelectedSizeId(size.id);
                            setOpenSections(prev => ({ ...prev, size: false, comboType: true }));
                          }}
                          className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                        >
                          <div>
                            <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                              <span>{size.icon}</span>
                              <span>{size.name}</span>
                            </span>
                            <span className="text-xs text-zinc-500 block mt-0.5">
                              Solo Frutas: ${size.fruitsOnlyPrice.toLocaleString("es-AR")} | Completo: ${size.fullComboPrice.toLocaleString("es-AR")}
                            </span>
                          </div>

                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? "bg-[#E2004B] border-[#E2004B] text-white" 
                              : "border-zinc-300 bg-white"
                          }`}>
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: TIPO DE PREPARACIÓN / COMBO */}
              <div className="py-4">
                <div 
                  onClick={() => toggleSection("comboType")}
                  className="flex items-start justify-between cursor-pointer select-none mb-1"
                >
                  <div>
                    <h4 className="font-bold text-base text-zinc-900">
                      2. ¿Cómo querés tu vaso?
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {builderComboType === "full" ? "Completo con Yogur y Toppings" : builderComboType === "fruits_only" ? "Solo Frutas frescas" : "Elige 1 opción"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Requerido
                    </span>
                    {openSections.comboType ? (
                      <ChevronUp size={20} className="text-zinc-700" />
                    ) : (
                      <ChevronDown size={20} className="text-zinc-700" />
                    )}
                  </div>
                </div>

                {openSections.comboType && (
                  <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                    <div
                      onClick={() => {
                        setBuilderComboType("full");
                        setOpenSections(prev => ({ ...prev, comboType: false, step1: true }));
                      }}
                      className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                    >
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold block leading-none mb-1">
                          Más popular
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          Con Frutas, Yogur o Crema, Toppings y Salsa
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-700 block mt-0.5">
                          ${(currentSelectedSize ? currentSelectedSize.fullComboPrice : 9500).toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${
                        builderComboType === "full" 
                          ? "bg-[#E2004B] border-[#E2004B] text-white" 
                          : "border-zinc-300 bg-white"
                      }`}>
                        {builderComboType === "full" && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setBuilderComboType("fruits_only");
                        setOpenSections(prev => ({ ...prev, comboType: false, step1: true }));
                      }}
                      className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          Con Frutas (Solo Frutas)
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-700 block mt-0.5">
                          ${(currentSelectedSize ? currentSelectedSize.fruitsOnlyPrice : 7500).toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${
                        builderComboType === "fruits_only" 
                          ? "bg-[#E2004B] border-[#E2004B] text-white" 
                          : "border-zinc-300 bg-white"
                      }`}>
                        {builderComboType === "fruits_only" && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: 1ª FRUTA (BASE) */}
              <div className="py-4">
                <div 
                  onClick={() => toggleSection("step1")}
                  className="flex items-start justify-between cursor-pointer select-none mb-1 touch-manipulation"
                >
                  <div>
                    <h4 className="font-bold text-base text-zinc-900">
                      3. Primera Fruta (Base)
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {builderStep1Fruit ? `Seleccionado: ${builderStep1Fruit}` : "Elige 1 opción"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Requerido
                    </span>
                    {openSections.step1 ? (
                      <ChevronUp size={20} className="text-zinc-700" />
                    ) : (
                      <ChevronDown size={20} className="text-zinc-700" />
                    )}
                  </div>
                </div>

                {openSections.step1 && (
                  <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                    {cupConfig.fruits.filter(f => f.available).map((fruit, idx) => {
                      const isSelected = builderStep1Fruit === fruit.name;
                      return (
                        <div
                          key={fruit.id}
                          onClick={() => {
                            setBuilderStep1Fruit(fruit.name);
                            if (builderComboType === "full") {
                              setOpenSections({ size: false, comboType: false, step1: false, step2: true, step3: false, step4: false });
                            } else {
                              setOpenSections({ size: false, comboType: false, step1: false, step2: false, step3: true, step4: false });
                            }
                          }}
                          className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                        >
                          <div>
                            {idx < 2 && (
                              <span className="text-[10px] text-zinc-400 font-medium block leading-none mb-1">
                                Más popular
                              </span>
                            )}
                            <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                              <span>{fruit.emoji || "🍓"}</span>
                              <span>{fruit.name}</span>
                            </span>
                          </div>

                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? "bg-[#E2004B] border-[#E2004B] text-white" 
                              : "border-zinc-300 bg-white"
                          }`}>
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: YOGUR O CREMA (Solo si comboType === 'full') */}
              {builderComboType === "full" && (
                <div className="py-4">
                  <div 
                    onClick={() => toggleSection("step2")}
                    className="flex items-start justify-between cursor-pointer select-none mb-1 touch-manipulation"
                  >
                    <div>
                      <h4 className="font-bold text-base text-zinc-900">
                        4. Yogur o Crema
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {builderStep2Base ? `Seleccionado: ${builderStep2Base}` : "Elige 1 opción"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Requerido
                      </span>
                      {openSections.step2 ? (
                        <ChevronUp size={20} className="text-zinc-700" />
                      ) : (
                        <ChevronDown size={20} className="text-zinc-700" />
                      )}
                    </div>
                  </div>

                  {openSections.step2 && (
                    <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                      {cupConfig.bases.filter(b => b.available).map((base, idx) => {
                        const isSelected = builderStep2Base === base.name;
                        return (
                          <div
                            key={base.id}
                            onClick={() => {
                              setBuilderStep2Base(base.name);
                              setOpenSections({ size: false, comboType: false, step1: false, step2: false, step3: true, step4: false });
                            }}
                            className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                          >
                            <div>
                              {idx === 0 && (
                                <span className="text-[10px] text-zinc-400 font-medium block leading-none mb-1">
                                  Más popular
                                </span>
                              )}
                              <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                                <span>{base.emoji || "🥣"}</span>
                                <span>{base.name}</span>
                              </span>
                              {base.description && (
                                <span className="text-xs text-zinc-400 block mt-0.5">{base.description}</span>
                              )}
                            </div>

                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-[#E2004B] border-[#E2004B] text-white" 
                                : "border-zinc-300 bg-white"
                            }`}>
                              {isSelected && <Check size={14} className="stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 2ª FRUTA (SUPERIOR) */}
              <div className="py-4">
                <div 
                  onClick={() => toggleSection("step3")}
                  className="flex items-start justify-between cursor-pointer select-none mb-1 touch-manipulation"
                >
                  <div>
                    <h4 className="font-bold text-base text-zinc-900">
                      {builderComboType === "full" ? "5. Segunda Fruta (Superior)" : "4. Segunda Fruta"}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {builderStep3Fruit ? `Seleccionado: ${builderStep3Fruit}` : "Elige 1 opción"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Requerido
                    </span>
                    {openSections.step3 ? (
                      <ChevronUp size={20} className="text-zinc-700" />
                    ) : (
                      <ChevronDown size={20} className="text-zinc-700" />
                    )}
                  </div>
                </div>

                {openSections.step3 && (
                  <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                    {cupConfig.fruits.filter(f => f.available).map((fruit, idx) => {
                      const isSelected = builderStep3Fruit === fruit.name;
                      return (
                        <div
                          key={fruit.id}
                          onClick={() => {
                            setBuilderStep3Fruit(fruit.name);
                            if (builderComboType === "full") {
                              setOpenSections({ size: false, comboType: false, step1: false, step2: false, step3: false, step4: true });
                            } else {
                              setOpenSections({ size: false, comboType: false, step1: false, step2: false, step3: false, step4: false });
                            }
                          }}
                          className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                        >
                          <div>
                            {idx < 2 && (
                              <span className="text-[10px] text-zinc-400 font-medium block leading-none mb-1">
                                Más popular
                              </span>
                            )}
                            <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                              <span>{fruit.emoji || "🍓"}</span>
                              <span>{fruit.name}</span>
                            </span>
                          </div>

                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? "bg-[#E2004B] border-[#E2004B] text-white" 
                              : "border-zinc-300 bg-white"
                          }`}>
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: TOPPINGS & SALSAS (Solo si comboType === 'full') */}
              {builderComboType === "full" && (
                <div className="py-4">
                  <div 
                    onClick={() => toggleSection("step4")}
                    className="flex items-start justify-between cursor-pointer select-none mb-1 touch-manipulation"
                  >
                    <div>
                      <h4 className="font-bold text-base text-zinc-900">
                        6. Toppings y Salsas
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {builderStep4Toppings.length > 0 
                          ? `Seleccionados: ${builderStep4Toppings.join(", ")}` 
                          : "Elige las opciones que desees"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Opcional
                      </span>
                      {openSections.step4 ? (
                        <ChevronUp size={20} className="text-zinc-700" />
                      ) : (
                        <ChevronDown size={20} className="text-zinc-700" />
                      )}
                    </div>
                  </div>

                  {openSections.step4 && (
                    <div className="pt-2 divide-y divide-zinc-100 animate-in fade-in duration-150">
                      {cupConfig.toppings.filter(t => t.available).map((top) => {
                        const isChecked = builderStep4Toppings.includes(top.name);
                        return (
                          <div
                            key={top.id}
                            onClick={() => handleToggleTopping(top.name)}
                            className="py-3.5 px-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors select-none touch-manipulation"
                          >
                            <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                              <span>{top.emoji || "🍯"}</span>
                              <span>{top.name}</span>
                            </span>

                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-[#E2004B] border-[#E2004B] text-white" 
                                : "border-zinc-300 bg-white"
                            }`}>
                              {isChecked && <Check size={14} className="stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES */}
              <div className="py-4">
                <label className="block text-sm font-bold text-zinc-900 mb-1">
                  Aclaraciones o notas (opcional)
                </label>
                <input 
                  type="text"
                  value={builderNotes}
                  onChange={(e) => setBuilderNotes(e.target.value)}
                  placeholder="Ej: poco yogur, enviar cubiertos..."
                  className="w-full border border-zinc-200 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-xs outline-none bg-zinc-50/50"
                />
              </div>

            </div>

            {/* PedidosYa Sticky Bottom Bar */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-zinc-200 px-4 py-3 sm:px-5 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0 space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-zinc-900">
                  {builderQuantity} {builderQuantity === 1 ? "producto" : "productos"}
                </span>
                <span className="text-xl font-extrabold text-zinc-900 font-mono">
                  ${(currentEffectiveUnitPrice * builderQuantity).toLocaleString("es-AR")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="bg-zinc-100 rounded-full px-3 py-2 flex items-center gap-3 text-sm font-bold text-zinc-900 shrink-0 select-none touch-manipulation">
                  <button 
                    type="button"
                    onClick={() => setBuilderQuantity(prev => Math.max(1, prev - 1))}
                    className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-90 touch-manipulation"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-4 text-center font-bold text-sm">{builderQuantity}</span>
                  <button 
                    type="button"
                    onClick={() => setBuilderQuantity(prev => prev + 1)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-90 touch-manipulation"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* PedidosYa Magenta/Red Button */}
                <button
                  type="button"
                  onClick={handleAddCustomCupToCart}
                  disabled={!currentSelectedSize || !builderComboType || !builderStep1Fruit || !builderStep3Fruit || (builderComboType === "full" && !builderStep2Base)}
                  className="flex-1 min-h-[48px] bg-[#E2004B] hover:bg-[#c70041] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-base py-3 px-6 rounded-full transition-all shadow-xs active:scale-98 text-center flex items-center justify-center touch-manipulation cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING ANIMATED FRUIT CUP MASCOT WIDGET */}
      <FloatingFruitCupWidget onOpenAbout={handleOpenAbout} />
    </main>
  );
}
