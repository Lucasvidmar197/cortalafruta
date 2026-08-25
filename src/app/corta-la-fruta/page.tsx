"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { 
  Star, MapPin, Clock, Phone, AtSign, ShoppingBag, Plus, Minus, Trash2, 
  X, Check, Box, ArrowRight, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, Search
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

interface CartItem {
  product: Product;
  quantity: number;
}

// Initial catalog dataset
const categoriesCatalog: Category[] = [
  {
    id: "c1",
    name: "Vasos de Fruta Cortada",
    subtitle: "Fruta fresca seleccionada y cortada al momento",
    theme: "strawberry",
    items: [
      { 
        id: "p1", 
        name: "Vaso Sandía & Melón", 
        description: "Cortes frescos de sandía dulce y melón en su punto justo de maduración.", 
        price: 2500, 
        badge: "Más Vendido", 
        badgeType: "strawberry",
        imageUrl: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      },
      { 
        id: "p2", 
        name: "Vaso Mix Tropical", 
        description: "Combinación de mango, ananá, kiwi fresco y frutillas de primera calidad.", 
        price: 3200, 
        badge: "Fresco", 
        badgeType: "kiwi",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      }
    ]
  },
  {
    id: "c2",
    name: "Ensaladas de Frutas",
    subtitle: "Preparadas al instante maceradas en jugo 100% natural",
    theme: "banana",
    items: [
      { 
        id: "p3", 
        name: "Ensalada Clásica", 
        description: "Manzana, banana, naranja, uva y durazno servidos en jugo natural de estación.", 
        price: 3500,
        imageUrl: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      },
      { 
        id: "p4", 
        name: "Especial Corta la Fruta", 
        description: "Nuestra ensalada tradicional enriquecida con kiwi, frutilla fresca y arándanos.", 
        price: 4200, 
        badge: "Recomendado", 
        badgeType: "banana",
        imageUrl: "/products/especial-corta-la-fruta.png",
        has3DModel: true,
        glbUrl: "/uploads/halloween-fruit-platter.glb"
      }
    ]
  },
  {
    id: "c3",
    name: "Combinaciones con Yogur & Granola",
    subtitle: "Equilibrio ideal entre yogur cremoso, granola horneada y fruta",
    theme: "kiwi",
    items: [
      { 
        id: "p5", 
        name: "Yogur con Frutos Rojos", 
        description: "Yogur natural cremoso, granola horneada artesanal y mix de frutos rojos.", 
        price: 4500, 
        badge: "Favorito", 
        badgeType: "strawberry",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
        has3DModel: false 
      },
      { 
        id: "p6", 
        name: "Yogur Tropical", 
        description: "Yogur natural, granola de miel, mango maduro y escamas de coco tostado.", 
        price: 4500,
        imageUrl: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      }
    ]
  },
  {
    id: "c4",
    name: "Avena Trasnochada (Overnight Oats)",
    subtitle: "Avena suave remojada en frío, nutritiva, ligera y saciante",
    theme: "banana",
    items: [
      { 
        id: "p7", 
        name: "Oats Manzana & Canela", 
        description: "Avena en leche de almendras, manzana rallada, trozos de nuez y canela.", 
        price: 3800,
        imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      },
      { 
        id: "p8", 
        name: "Oats Cacao & Banana", 
        description: "Avena suave con cacao amargo, rodajas de banana y mantequilla de maní.", 
        price: 4000,
        imageUrl: "https://images.unsplash.com/photo-1538356828944-091a54a20c6c?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      }
    ]
  },
  {
    id: "c5",
    name: "Servicio para Eventos & Reuniones",
    subtitle: "Presentaciones especiales para eventos corporativos y festejos",
    theme: "strawberry",
    items: [
      { 
        id: "p9", 
        name: "Bandeja Degustación (10 Personas)", 
        description: "Bandeja profesional con fruta de estación troceada y lista para servir.", 
        price: 35000,
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      },
      { 
        id: "p10", 
        name: "Pack Infantil Eventos (20 Vasos)", 
        description: "Vasos individuales pequeños listos para cumpleaños e instancias infantiles.", 
        price: 45000, 
        badge: "Ideal Eventos", 
        badgeType: "kiwi",
        imageUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80",
        has3DModel: false
      }
    ]
  }
];

const REVIEWS = [
  {
    id: 1,
    author: "Cliente en Google",
    text: "La fruta es increíblemente fresca, y las combinaciones con yogur y granola son deliciosas. Perfecto para eventos y cumpleaños infantiles.",
    rating: 5
  },
  {
    id: 2,
    author: "Cliente en Google",
    text: "Todo estaba delicioso, fresco, de excelente calidad, y el servicio fue excelente.",
    rating: 5
  },
  {
    id: 3,
    author: "Cliente en Google",
    text: "Fui con mi mamá, nos dejaron probar cosas, las ensaladas son deliciosas, todo es saludable, la dueña es encantadora.",
    rating: 5
  }
];

function TrustIndexWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://cdn.trustindex.io/loader.js?ffdf0397927a921fe646033d753";
      script.async = true;
      script.defer = true;
      containerRef.current.appendChild(script);
    }

    // Remove any duplicate TrustIndex elements appended directly to <body> outside main container
    const cleanupInterval = setInterval(() => {
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach((child) => {
        if (
          child.tagName !== "MAIN" && 
          child.tagName !== "NEXT-ROUTE-ANNOUNCER" &&
          (
            child.className?.toString().includes("ti-") || 
            child.className?.toString().includes("trustindex") || 
            child.querySelector?.("iframe[src*='trustindex']")
          )
        ) {
          child.remove();
        }
      });
    }, 400);

    return () => clearInterval(cleanupInterval);
  }, []);

  return <div ref={containerRef} className="w-full min-h-[160px] flex items-center justify-center" />;
}

export default function CortaLaFrutaPublicPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [active3DModal, setActive3DModal] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isAboutHighlighted, setIsAboutHighlighted] = useState<boolean>(false);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset page when category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Filter Categories & Items based on activeCategory AND searchQuery
  const filteredCategories = categoriesCatalog
    .filter(cat => activeCategory === "all" || cat.id === activeCategory)
    .map(category => {
      if (!searchQuery.trim()) return category;
      const query = searchQuery.toLowerCase();
      const matchingItems = category.items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.badge && item.badge.toLowerCase().includes(query))
      );
      return { ...category, items: matchingItems };
    })
    .filter(category => category.items.length > 0);

  // Flattened products for "Todos los productos" pagination (4 cols x 2 rows = 8 items per page)
  const ITEMS_PER_PAGE = 8;
  const allFlatProducts = filteredCategories.flatMap(cat => 
    cat.items.map(item => ({ ...item, categoryName: cat.name }))
  );
  const totalPages = Math.ceil(allFlatProducts.length / ITEMS_PER_PAGE);
  const paginatedFlatProducts = allFlatProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Cart helper functions
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });

    setToastMessage(`¡${product.name} agregado al pedido!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Generate WhatsApp Order Link
  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*Hola Corta la Fruta!* 🍓\nQuisiera realizar el siguiente pedido:\n\n`;
    
    cart.forEach(item => {
      const lineTotal = item.product.price * item.quantity;
      message += `• *${item.quantity}x ${item.product.name}* — $${lineTotal.toLocaleString("es-AR")}\n`;
    });

    message += `\n💰 *Total del pedido: $${totalCartPrice.toLocaleString("es-AR")}*`;

    if (orderNotes.trim()) {
      message += `\n📝 *Notas / Aclaraciones:* ${orderNotes.trim()}`;
    }

    message += `\n\nQuedo a la espera de la confirmación. ¡Muchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5491124735186?text=${encodedMessage}`, "_blank");
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Logo & Store Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/logo-corta-la-fruta.png" 
              alt="Corta la Fruta Logo" 
              className="h-9 sm:h-12 w-auto object-contain shrink-0" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 leading-tight truncate">
                  Corta la Fruta
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 shrink-0">
                  Fresca & Natural
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">Frutería & Bar Saludable • Quilmes</p>
            </div>
          </div>

          {/* WhatsApp Direct Header Button & Cart Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-amber-50/50 via-rose-50/30 to-[#FFFDF9] border-b border-zinc-100 py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-rose-600 border border-rose-200/80 rounded-full text-xs font-bold shadow-2xs mb-5">
            <Sparkles size={15} className="text-amber-500 fill-amber-400" />
            <span>Fruta fresca cortada y lista al instante</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
            Lo fresco, lo rico y lo simple, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-600">
              en un solo lugar.
            </span>
          </h2>

          <p className="text-base md:text-lg text-zinc-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            Vasos mixtos, ensaladas 100% naturales, yogur con granola artesanal y servicio de frutas para eventos.
          </p>

          {/* Fruit Accents Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-zinc-700">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Frutillas & Frutos Rojos</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Banana & Mango Dulce</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Kiwi & Mix Cítrico</span>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SEARCH & CATEGORY FILTER BAR */}
      <nav className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-2.5 sm:py-3.5 px-3 sm:px-6 shadow-2xs space-y-2 sm:space-y-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Live Search Input Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fruta, ensalada, ingrediente..."
              className="w-full bg-zinc-100/80 focus:bg-white border border-zinc-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Scrollable & Dragable on PC & Mobile) */}
          <div className="w-full max-w-full md:flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
            
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
              {categoriesCatalog.map((cat) => (
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
                  <span>{cat.name}</span>
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

        </div>
      </nav>

      {/* PRODUCT CATALOG GRID */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-8 space-y-3">
            <Search size={40} className="mx-auto text-zinc-300 stroke-1" />
            <h4 className="font-bold text-base text-zinc-800">
              No encontramos resultados para "{searchQuery}"
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Probá buscando con otro nombre de fruta, ingrediente o seleccioná "Todos los productos".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors inline-block"
            >
              Limpiar Búsqueda
            </button>
          </div>
        ) : activeCategory === "all" ? (
          /* PAGINATED GRID FOR ALL PRODUCTS (4 COLS x 2 ROWS = 8 ITEMS PER PAGE) */
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Todos los Productos ({allFlatProducts.length})
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Mostrando {paginatedFlatProducts.length} de {allFlatProducts.length} productos (Página {currentPage} de {totalPages || 1})
                </p>
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

                return (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="cursor-pointer bg-white rounded-xl sm:rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group p-2.5 sm:p-3.5"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-4/3 w-full bg-zinc-100 rounded-lg overflow-hidden">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Badge Overlay */}
                      {product.badge && (
                        <div className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs">
                          {product.badge}
                        </div>
                      )}

                      {/* 3D Button */}
                      {product.has3DModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive3DModal(product);
                          }}
                          className="absolute top-1.5 right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 transition-transform active:scale-95 z-10"
                        >
                          <Box size={13} className="text-white" />
                          <span>3D</span>
                        </button>
                      )}
                    </div>

                    {/* Product Details (Mercado Libre Price-First Hierarchy) */}
                    <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-extrabold text-sm sm:text-base text-zinc-900 font-mono block">
                          ${product.price.toLocaleString("es-AR")}
                        </span>

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
                      onClick={() => setSelectedProduct(product)}
                      className="cursor-pointer bg-white rounded-xl sm:rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group p-2.5 sm:p-3.5"
                    >
                      <div className="relative aspect-4/3 w-full bg-zinc-100 rounded-lg overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.badge && (
                          <div className={`absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs ${
                            product.badgeType === "strawberry" ? "bg-rose-500 text-white" :
                            product.badgeType === "kiwi" ? "bg-emerald-600 text-white" :
                            "bg-amber-500 text-white"
                          }`}>
                            {product.badge}
                          </div>
                        )}
                        {product.has3DModel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActive3DModal(product);
                            }}
                            className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-zinc-900 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
                          >
                            <Box size={12} className="text-emerald-600" />
                            <span>3D</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-extrabold text-sm sm:text-base text-zinc-900 font-mono block">
                            ${product.price.toLocaleString("es-AR")}
                          </span>

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
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
              >
                <X size={18} />
              </button>

              {/* Badge */}
              {selectedProduct.badge && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-lg shadow-md">
                  {selectedProduct.badge}
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-extrabold text-xl sm:text-2xl text-zinc-900 leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <span className="font-extrabold text-lg text-rose-600 font-mono bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl shrink-0">
                    ${selectedProduct.price.toLocaleString("es-AR")}
                  </span>
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {selectedProduct.has3DModel && (
                  <button
                    onClick={() => {
                      const prod = selectedProduct;
                      setSelectedProduct(null);
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
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
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
                poster: active3DModal.imageUrl,
                'ios-src': active3DModal.usdzUrl || undefined,
                alt: `Modelo 3D de ${active3DModal.name}`,
                ar: true,
                'ar-modes': "scene-viewer webxr quick-look",
                'ar-scale': "auto",
                'interaction-prompt': "none",
                scale: active3DModal.scale ? `${active3DModal.scale} ${active3DModal.scale} ${active3DModal.scale}` : "1 1 1",
                'camera-controls': true,
                'auto-rotate': true,
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
                <span className="font-mono font-extrabold text-base text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl">
                  ${active3DModal.price.toLocaleString("es-AR")}
                </span>
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
                  {cart.map(({ product, quantity }) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200/80 bg-white shadow-2xs"
                    >
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-zinc-900 truncate">{product.name}</h4>
                        <span className="text-xs font-mono font-extrabold text-rose-600">
                          ${(product.price * quantity).toLocaleString("es-AR")}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1.5 bg-zinc-100 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-6 h-6 rounded bg-white text-zinc-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-zinc-200"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold px-2">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-6 h-6 rounded bg-white text-zinc-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-zinc-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Order Notes */}
                  <div className="pt-4 border-t border-zinc-100">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Notas o aclaraciones para tu pedido:
                    </label>
                    <textarea 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ej: Sin endulzante extra, cambiar kiwi por frutilla..."
                      className="w-full border border-zinc-200 rounded-xl p-3 text-xs outline-none focus:border-rose-500 resize-none h-20 font-sans"
                    />
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

          {/* TrustIndex External Widget Only */}
          <div className="w-full min-h-[180px] bg-[#FAF9F6] p-4 rounded-2xl border border-zinc-200/80">
            <TrustIndexWidget />
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
              {categoriesCatalog.map((cat) => (
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
            <span>•</span>
            <Link href="/corta-la-fruta/admin" className="hover:text-amber-400 transition-colors underline underline-offset-4">
              Acceso Panel Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
