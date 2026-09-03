"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Trash2, Edit2, Save, X, ArrowLeft, Package, Layers, Box, 
  Image as ImageIcon, Upload, Loader2, LogOut, Check, Sparkles, ExternalLink, Lock, Star, Sliders,
  Ticket, Percent, DollarSign, Calendar, Hash, Tag, AlertCircle, Copy, CheckCircle2
} from "lucide-react";
import { type Coupon, DEFAULT_COUPONS } from "@/app/api/coupons/route";
import { WebIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit } from "@gltf-transform/extensions";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  promo_price?: number | null;
  scale?: number;
  glburl?: string | null;
  usdzurl?: string | null;
  category: string;
  image_urls?: string[];
  created_at?: string;
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

const DEFAULT_CATEGORIES = [
  "Vasos de Fruta Cortada",
  "Ensaladas de Frutas",
  "Combinaciones con Yogur & Granola",
  "Avena Trasnochada (Overnight Oats)",
  "Servicio para Eventos & Reuniones"
];

// Helper: Optimizar modelo GLB para Realidad Aumentada inyectando KHR_materials_unlit
const processGlbUnlit = async (file: File): Promise<Blob> => {
  try {
    const io = new WebIO().registerExtensions([KHRMaterialsUnlit]);
    const buffer = await file.arrayBuffer();
    const doc = await io.readBinary(new Uint8Array(buffer));
    const unlitExtension = doc.createExtension(KHRMaterialsUnlit);
    const unlit = unlitExtension.createUnlit();
    
    for (const material of doc.getRoot().listMaterials()) {
      material.setExtension("KHR_materials_unlit", unlit);
      material.setMetallicFactor(0);
      material.setRoughnessFactor(1);
    }
    
    const modifiedBuffer = await io.writeBinary(doc);
    return new Blob([modifiedBuffer], { type: "model/gltf-binary" });
  } catch (err) {
    console.warn("No se pudo inyectar unlit, usando archivo original:", err);
    return file;
  }
};

// Helper: Subir archivo a Supabase Storage bucket 'menu-assets'
const uploadFileToSupabase = async (file: File | Blob, originalName: string, contentType: string, folder: string = "products"): Promise<string> => {
  const cleanOriginal = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${folder}/${Date.now()}-${cleanOriginal}`;
  
  const { error } = await supabase.storage
    .from("menu-assets")
    .upload(fileName, file, {
      contentType: contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("menu-assets")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

export default function CortaLaFrutaAdminPage() {
  const router = useRouter();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Menu data state
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab state: 'menu' (standard catalog), 'cup-builder' (Armá tu Vaso config), or 'coupons' (discount coupons)
  const [activeAdminTab, setActiveAdminTab] = useState<"menu" | "cup-builder" | "coupons">("menu");

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [isSavingCoupons, setIsSavingCoupons] = useState<boolean>(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<{
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number | "";
    minOrderAmount: number | "";
    expirationDate: string;
    totalUsageLimit: number | "";
    isActive: boolean;
    description: string;
  }>({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: "",
    expirationDate: "",
    totalUsageLimit: "",
    isActive: true,
    description: ""
  });

  // Cup Builder configuration state
  const [cupConfig, setCupConfig] = useState<CupBuilderConfig>(DEFAULT_CUP_BUILDER_CONFIG);
  const [isSavingCupConfig, setIsSavingCupConfig] = useState(false);

  // Quick addition inputs for Cup Builder
  const [newFruitName, setNewFruitName] = useState("");
  const [newFruitEmoji, setNewFruitEmoji] = useState("🍓");
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseDesc, setNewBaseDesc] = useState("");
  const [newBaseEmoji, setNewBaseEmoji] = useState("🥣");
  const [newToppingName, setNewToppingName] = useState("");
  const [newToppingEmoji, setNewToppingEmoji] = useState("🍯");

  // Category editing state
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<{
    id: string | null;
    name: string;
    description: string;
    price: number;
    hasPromo: boolean;
    promoPrice: number | "";
    category: string;
    imageUrl: string;
    glbUrl: string;
    has3D: boolean;
  } | null>(null);

  // File upload states inside product modal
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGlb, setIsUploadingGlb] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Check existing Supabase auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error comprobando sesión:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch menu items and Cup Builder config from Supabase when authenticated
  const fetchMenuData = async () => {
    setIsLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        // Find cup builder config
        const configRow = data.find((i: any) => i.id === "cup-builder-config" || i.category === "Armá tu Vaso");
        if (configRow && configRow.description) {
          try {
            const parsed = JSON.parse(configRow.description);
            setCupConfig({
              ...DEFAULT_CUP_BUILDER_CONFIG,
              ...parsed,
              sizes: parsed.sizes || DEFAULT_CUP_BUILDER_CONFIG.sizes,
            });
          } catch (e) {
            console.error("Error parsing cup builder config:", e);
          }
        }

        // Find coupons config
        const couponsRow = data.find((i: any) => i.id === "coupons-config");
        if (couponsRow && couponsRow.description) {
          try {
            const parsed = JSON.parse(couponsRow.description);
            if (Array.isArray(parsed)) {
              setCoupons(parsed);
            }
          } catch (e) {
            console.error("Error parsing coupons config:", e);
          }
        }

        // Regular menu products (filter out cup builder config & reviews config from catalog list)
        const regularProducts = data.filter((i: any) => 
          i.id !== "cup-builder-config" && 
          i.id !== "corta-la-fruta-reviews" &&
          !i.id.includes("config") &&
          !i.id.includes("review") &&
          i.category !== "Configuracion" &&
          i.category !== "Reseñas"
        );
        const mappedItems: MenuItem[] = regularProducts.map((item: any) => ({
          ...item,
          glburl: item.glburl || null,
          image_urls: item.image_urls || [],
        }));
        setItems(mappedItems);

        // Compute unique categories combining defaults and database items
        const itemCategories = Array.from(new Set(mappedItems.map(i => i.category).filter(Boolean)));
        const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...itemCategories])).filter(c => c !== "Armá tu Vaso");
        setCategoriesList(combined);
      }
    } catch (err: any) {
      console.error("Error al cargar menú de Supabase:", err);
      showToast("Error al conectar con Supabase: " + (err.message || "revisá la conexión"));
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Cup Builder Handlers
  const handleToggleIngredient = (type: "fruits" | "bases" | "toppings", id: string) => {
    setCupConfig((prev) => ({
      ...prev,
      [type]: prev[type].map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      ),
    }));
  };

  const handleDeleteIngredient = (type: "fruits" | "bases" | "toppings", id: string) => {
    setCupConfig((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  const handleAddFruit = () => {
    if (!newFruitName.trim()) return;
    const newId = "f-" + Date.now();
    setCupConfig((prev) => ({
      ...prev,
      fruits: [
        ...prev.fruits,
        {
          id: newId,
          name: newFruitName.trim(),
          emoji: newFruitEmoji.trim() || "🍓",
          available: true,
        },
      ],
    }));
    setNewFruitName("");
    showToast(`¡Fruta "${newFruitName.trim()}" agregada! Recordá guardar.`);
  };

  const handleAddBase = () => {
    if (!newBaseName.trim()) return;
    const newId = "b-" + Date.now();
    setCupConfig((prev) => ({
      ...prev,
      bases: [
        ...prev.bases,
        {
          id: newId,
          name: newBaseName.trim(),
          description: newBaseDesc.trim() || undefined,
          emoji: newBaseEmoji.trim() || "🥣",
          available: true,
        },
      ],
    }));
    setNewBaseName("");
    setNewBaseDesc("");
    showToast(`¡Opción "${newBaseName.trim()}" agregada! Recordá guardar.`);
  };

  const handleAddTopping = () => {
    if (!newToppingName.trim()) return;
    const newId = "t-" + Date.now();
    setCupConfig((prev) => ({
      ...prev,
      toppings: [
        ...prev.toppings,
        {
          id: newId,
          name: newToppingName.trim(),
          emoji: newToppingEmoji.trim() || "🍯",
          available: true,
        },
      ],
    }));
    setNewToppingName("");
    showToast(`¡Topping "${newToppingName.trim()}" agregado! Recordá guardar.`);
  };

  const handleSaveCupConfig = async () => {
    setIsSavingCupConfig(true);
    try {
      const payload = {
        id: "cup-builder-config",
        name: cupConfig.name || "Armá tu Combo Favorito",
        description: JSON.stringify(cupConfig),
        price: cupConfig.sizes?.[0]?.fruitsOnlyPrice || 7500,
        category: "Armá tu Vaso",
        image_urls: ["https://i.postimg.cc/Gm8bBX5t/image-removebg-preview.png"]
      };

      const { error } = await supabase.from("menu_items").upsert(payload);
      if (error) throw error;

      showToast("✨ ¡Configuración y precios guardados con éxito!");
    } catch (err: any) {
      console.error("Error al guardar configurador:", err);
      showToast("Error al guardar: " + (err.message || "revisá la conexión"));
    } finally {
      setIsSavingCupConfig(false);
    }
  };

  // --- COUPON HANDLERS ---
  const handleSaveCoupons = async (updatedCoupons?: Coupon[]) => {
    const listToSave = updatedCoupons || coupons;
    setIsSavingCoupons(true);
    try {
      const payload = {
        id: "coupons-config",
        name: "Configuración de Cupones",
        description: JSON.stringify(listToSave),
        price: 0,
        scale: 1,
        glburl: null,
        usdzurl: null,
        category: "Configuracion",
        image_urls: []
      };

      const { error } = await supabase.from("menu_items").upsert(payload);
      if (error) throw error;

      showToast("✨ ¡Cupones guardados y sincronizados con éxito!");
    } catch (err: any) {
      console.error("Error al guardar cupones:", err);
      showToast("Error al guardar cupones: " + (err.message || "revisá la conexión"));
    } finally {
      setIsSavingCoupons(false);
    }
  };

  const handleOpenCreateCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: "",
      expirationDate: "",
      totalUsageLimit: "",
      isActive: true,
      description: ""
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCouponForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || "",
      expirationDate: c.expirationDate || "",
      totalUsageLimit: c.totalUsageLimit || "",
      isActive: c.isActive,
      description: c.description || ""
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCouponModal = async () => {
    const cleanCode = couponForm.code.trim().toUpperCase();
    if (!cleanCode) {
      showToast("Por favor escribí un código para el cupón.");
      return;
    }

    const val = Number(couponForm.discountValue);
    if (!val || val <= 0) {
      showToast("El valor del descuento debe ser mayor a 0.");
      return;
    }

    if (couponForm.discountType === "percentage" && val > 100) {
      showToast("El porcentaje de descuento no puede superar el 100%.");
      return;
    }

    // Check duplicate code (excluding current editing coupon)
    const exists = coupons.some(
      (c) => c.code.trim().toUpperCase() === cleanCode && c.id !== editingCouponId
    );
    if (exists) {
      showToast(`Ya existe un cupón con el código "${cleanCode}".`);
      return;
    }

    let nextCoupons: Coupon[];
    if (editingCouponId) {
      nextCoupons = coupons.map((c) => {
        if (c.id === editingCouponId) {
          return {
            ...c,
            code: cleanCode,
            discountType: couponForm.discountType,
            discountValue: val,
            minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : undefined,
            expirationDate: couponForm.expirationDate ? couponForm.expirationDate : undefined,
            totalUsageLimit: couponForm.totalUsageLimit ? Number(couponForm.totalUsageLimit) : undefined,
            isActive: couponForm.isActive,
            description: couponForm.description.trim() || undefined
          };
        }
        return c;
      });
    } else {
      const newCoupon: Coupon = {
        id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: cleanCode,
        discountType: couponForm.discountType,
        discountValue: val,
        minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : undefined,
        expirationDate: couponForm.expirationDate ? couponForm.expirationDate : undefined,
        totalUsageLimit: couponForm.totalUsageLimit ? Number(couponForm.totalUsageLimit) : undefined,
        currentUses: 0,
        isActive: couponForm.isActive,
        description: couponForm.description.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      nextCoupons = [newCoupon, ...coupons];
    }

    setCoupons(nextCoupons);
    setIsCouponModalOpen(false);
    await handleSaveCoupons(nextCoupons);
  };

  const handleToggleCouponActive = async (id: string) => {
    const nextCoupons = coupons.map((c) => {
      if (c.id === id) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });
    setCoupons(nextCoupons);
    await handleSaveCoupons(nextCoupons);
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar el cupón "${code}"?`)) {
      return;
    }
    const nextCoupons = coupons.filter((c) => c.id !== id);
    setCoupons(nextCoupons);
    await handleSaveCoupons(nextCoupons);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMenuData();
    }
  }, [isAuthenticated]);

  // Auth handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      if (data.session) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(err.message || "Correo o contraseña incorrectos");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // Category Actions
  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categoriesList.includes(trimmed)) {
      alert("Esta categoría ya existe.");
      return;
    }
    setCategoriesList([...categoriesList, trimmed]);
    setNewCategoryName("");
    setIsAddingCategory(false);
    showToast(`Categoría "${trimmed}" agregada`);
  };

  const handleSaveCategoryName = async (oldName: string) => {
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategoryOldName(null);
      return;
    }

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("menu_items")
        .update({ category: trimmed })
        .eq("category", oldName);

      if (error) throw error;

      // Update in local state
      setCategoriesList(categoriesList.map(c => c === oldName ? trimmed : c));
      setItems(items.map(i => i.category === oldName ? { ...i, category: trimmed } : i));
      showToast(`Categoría renombrada a "${trimmed}"`);
    } catch (err: any) {
      console.error(err);
      alert("Error al renombrar categoría en Supabase: " + err.message);
    } finally {
      setEditingCategoryOldName(null);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    const itemsInCat = items.filter(i => i.category === catName);
    const confirmText = itemsInCat.length > 0
      ? `¿Estás seguro de eliminar la categoría "${catName}" y sus ${itemsInCat.length} producto(s)?`
      : `¿Eliminar la categoría "${catName}"?`;

    if (!confirm(confirmText)) return;

    try {
      if (itemsInCat.length > 0) {
        const ids = itemsInCat.map(i => i.id);
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .in("id", ids);

        if (error) throw error;
      }

      setCategoriesList(categoriesList.filter(c => c !== catName));
      setItems(items.filter(i => i.category !== catName));
      showToast(`Categoría "${catName}" eliminada`);
    } catch (err: any) {
      console.error(err);
      alert("Error al eliminar categoría: " + err.message);
    }
  };

  // Product Actions
  const handleOpenProductModal = (category: string, item: MenuItem | null = null) => {
    if (item) {
      const rawPromo = item.promo_price ?? (item.usdzurl && !isNaN(Number(item.usdzurl)) ? Number(item.usdzurl) : null);
      const isPromo = !!(rawPromo && Number(rawPromo) > 0);

      setEditingProduct({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        hasPromo: isPromo,
        promoPrice: isPromo ? Number(rawPromo) : "",
        category: item.category || category,
        imageUrl: item.image_urls?.[0] || "",
        glbUrl: item.glburl || "",
        has3D: !!item.glburl,
      });
    } else {
      setEditingProduct({
        id: null,
        name: "",
        description: "",
        price: 0,
        hasPromo: false,
        promoPrice: "",
        category: category,
        imageUrl: "",
        glbUrl: "",
        has3D: false,
      });
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await uploadFileToSupabase(file, file.name, file.type || "image/jpeg", "products");
      setEditingProduct({
        ...editingProduct,
        imageUrl: publicUrl,
      });
      showToast("Imagen subida a Supabase con éxito");
    } catch (err: any) {
      console.error("Error subiendo imagen:", err);
      alert("Error al subir imagen a Supabase: " + (err.message || "revisá que el bucket menu-assets exista"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGlbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    if (!file.name.toLowerCase().endsWith(".glb")) {
      alert("Solo se admiten archivos 3D con extensión .glb");
      return;
    }

    setIsUploadingGlb(true);
    try {
      // Inyectar unlit para que se vea óptimo en Realidad Aumentada
      const processedBlob = await processGlbUnlit(file);
      const publicUrl = await uploadFileToSupabase(processedBlob, file.name, "model/gltf-binary", "3d-models");
      
      setEditingProduct({
        ...editingProduct,
        glbUrl: publicUrl,
        has3D: true,
      });
      showToast("Modelo 3D optimizado y subido a Supabase");
    } catch (err: any) {
      console.error("Error subiendo modelo 3D:", err);
      alert("Error al subir modelo 3D: " + err.message);
    } finally {
      setIsUploadingGlb(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || editingProduct.price <= 0) {
      alert("Por favor ingresá un nombre y un precio válido.");
      return;
    }

    const promoVal = editingProduct.hasPromo && editingProduct.promoPrice && Number(editingProduct.promoPrice) > 0
      ? Number(editingProduct.promoPrice)
      : null;

    if (promoVal && promoVal >= editingProduct.price) {
      alert("El precio de promoción debe ser menor al precio normal.");
      return;
    }

    const payload: any = {
      name: editingProduct.name.trim(),
      description: editingProduct.description.trim(),
      price: Number(editingProduct.price),
      category: editingProduct.category,
      glburl: editingProduct.has3D && editingProduct.glbUrl.trim() ? editingProduct.glbUrl.trim() : null,
      image_urls: editingProduct.imageUrl.trim() ? [editingProduct.imageUrl.trim()] : [],
      usdzurl: promoVal ? String(promoVal) : null,
      promo_price: promoVal,
    };

    try {
      if (editingProduct.id) {
        // Update existing product
        let { error } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", editingProduct.id);

        if (error && error.code === "PGRST204") {
          // promo_price column not yet added to SQL schema, save with usdzurl fallback
          delete payload.promo_price;
          const retry = await supabase
            .from("menu_items")
            .update(payload)
            .eq("id", editingProduct.id);
          error = retry.error;
        }

        if (error) throw error;

        setItems(items.map(i => i.id === editingProduct.id ? { ...i, ...payload, promo_price: promoVal } : i));
        showToast("Producto actualizado correctamente");
      } else {
        // Insert new product
        const newId = `prod_${Date.now()}`;
        let { error } = await supabase
          .from("menu_items")
          .insert({
            id: newId,
            ...payload,
            scale: 1,
          });

        if (error && error.code === "PGRST204") {
          delete payload.promo_price;
          const retry = await supabase
            .from("menu_items")
            .insert({
              id: newId,
              ...payload,
              scale: 1,
            });
          error = retry.error;
        }

        if (error) throw error;

        setItems([...items, { id: newId, ...payload, scale: 1, promo_price: promoVal }]);
        showToast("Nuevo producto creado en Supabase");
      }

      setEditingProduct(null);
    } catch (err: any) {
      console.error("Error al guardar producto:", err);
      alert("Error al guardar en Supabase: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(items.filter(i => i.id !== id));
      showToast(`"${name}" eliminado`);
    } catch (err: any) {
      console.error("Error al eliminar producto:", err);
      alert("Error al eliminar: " + err.message);
    }
  };

  // Loading Session Screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-emerald-700 mb-3" />
        <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Cargando panel de administración...</p>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 w-full max-w-md shadow-xl">
          
          <div className="text-center mb-8">
            <img 
              src="/logo-corta-la-fruta.png" 
              alt="Corta la Fruta Logo" 
              className="h-14 w-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Panel de Control</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Gestión de Catálogo, Precios y Modelos 3D
            </p>
          </div>

          {authError && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
              <X size={16} className="shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cortalafruta.com"
                required
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmittingAuth ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <Link 
              href="/" 
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Volver a la tienda pública</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Total KPIs
  const totalProducts = items.length;
  const productsWith3D = items.filter(i => !!i.glburl).length;
  const productsInPromo = items.filter(i => {
    const raw = i.promo_price ?? (i.usdzurl && !isNaN(Number(i.usdzurl)) ? Number(i.usdzurl) : null);
    return raw && Number(raw) > 0 && Number(raw) < i.price;
  }).length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 font-sans pb-24 selection:bg-rose-500 selection:text-white">
      
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href="/" 
              className="text-zinc-600 hover:text-zinc-900 p-2 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Ver Menú</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 shrink-0" />
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src="/logo-corta-la-fruta.png" 
                alt="Corta la Fruta Logo" 
                className="h-8 w-auto object-contain shrink-0" 
              />
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm sm:text-base text-zinc-900 truncate">
                  Panel de Catálogo & Modelos 3D
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchMenuData}
              disabled={isLoadingMenu}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors text-xs font-bold hidden sm:flex items-center gap-1.5"
              title="Recargar datos de Supabase"
            >
              <Loader2 size={14} className={isLoadingMenu ? "animate-spin text-emerald-600" : ""} />
              <span>Sincronizar</span>
            </button>

            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        
        {/* Dashboard KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Categorías</p>
              <p className="text-2xl font-extrabold text-zinc-900 font-mono">{categoriesList.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold">
              <Package size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Productos</p>
              <p className="text-2xl font-extrabold text-zinc-900 font-mono">{totalProducts}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Ofertas Activas</p>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">{productsInPromo}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Box size={22} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">3D / AR</p>
                <p className="text-2xl font-extrabold text-zinc-900 font-mono">{productsWith3D}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
              title="Nueva Categoría"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nueva</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-zinc-200/60 p-1.5 rounded-2xl w-fit flex-wrap">
          <button
            onClick={() => setActiveAdminTab("menu")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === "menu"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
            }`}
          >
            <Package size={16} />
            <span>Catálogo Tradicional ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab("cup-builder")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === "cup-builder"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
            }`}
          >
            <Sparkles size={16} />
            <span>🍓 Armá tu Vaso (PedidosYa)</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              activeAdminTab === "cup-builder" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700 font-bold"
            }`}>
              Activo
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab("coupons")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === "coupons"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
            }`}
          >
            <Ticket size={16} />
            <span>🎟️ Cupones de Descuento</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              activeAdminTab === "coupons" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 font-bold"
            }`}>
              {coupons.filter(c => c.isActive).length} Activos
            </span>
          </button>
        </div>

        {/* CUP BUILDER CONFIGURATION VIEW */}
        {activeAdminTab === "cup-builder" ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* General Cup Settings Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl shadow-xs">
                    🍓
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 flex items-center gap-2">
                      <span>Configuración de "Armá tu Vaso"</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Estilo PedidosYa
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Personalizá las frutas, bases y toppings que tus clientes pueden elegir capa por capa.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCupConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                      cupConfig.enabled 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${cupConfig.enabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                    <span>{cupConfig.enabled ? "Activo en la web" : "Desactivado en la web"}</span>
                  </button>

                  <button
                    onClick={handleSaveCupConfig}
                    disabled={isSavingCupConfig}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSavingCupConfig ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              {/* Name & Description Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                    Título del Sección
                  </label>
                  <input 
                    type="text"
                    value={cupConfig.name}
                    onChange={(e) => setCupConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-zinc-300 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    placeholder="Armá tu Combo Favorito"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                    Descripción / Subtítulo
                  </label>
                  <input 
                    type="text"
                    value={cupConfig.description}
                    onChange={(e) => setCupConfig(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-zinc-300 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    placeholder="Elegí tu tamaño, frutas, yogur o crema y toppings capa por capa."
                  />
                </div>
              </div>

              {/* Official 4 Sizes Pricing Grid */}
              <div className="pt-2">
                <label className="block text-[11px] font-extrabold text-zinc-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💰 Precios por Tamaño y Formato (Cartel Oficial)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(cupConfig.sizes || DEFAULT_CUP_BUILDER_CONFIG.sizes).map((size, idx) => (
                    <div key={size.id} className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{size.icon}</span>
                        <span className="font-extrabold text-xs text-zinc-900">{size.name}</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">
                          Solo Frutas ($)
                        </label>
                        <input 
                          type="number"
                          value={size.fruitsOnlyPrice || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCupConfig(prev => {
                              const updated = [...(prev.sizes || DEFAULT_CUP_BUILDER_CONFIG.sizes)];
                              updated[idx] = { ...updated[idx], fruitsOnlyPrice: val };
                              return { ...prev, sizes: updated };
                            });
                          }}
                          className="w-full border border-zinc-300 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs font-bold outline-none font-mono bg-white"
                          placeholder="7500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-rose-600 mb-0.5">
                          Completo: Yogur + Toppings ($)
                        </label>
                        <input 
                          type="number"
                          value={size.fullComboPrice || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCupConfig(prev => {
                              const updated = [...(prev.sizes || DEFAULT_CUP_BUILDER_CONFIG.sizes)];
                              updated[idx] = { ...updated[idx], fullComboPrice: val };
                              return { ...prev, sizes: updated };
                            });
                          }}
                          className="w-full border border-zinc-300 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs font-bold outline-none font-mono bg-white text-rose-600"
                          placeholder="9500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 1 & STEP 3: FRUITS MANAGEMENT */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                      Paso 1 y Paso 3
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-zinc-900">
                      🍓 Frutas Disponibles (Base & Capa Superior)
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    El cliente elegirá una fruta en el Paso 1 (base) y otra en el Paso 3. Si te quedás sin stock de alguna, desactivala acá con 1 clic.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-xl">
                  {cupConfig.fruits.filter(f => f.available).length} activas / {cupConfig.fruits.length} total
                </span>
              </div>

              {/* Add New Fruit Input */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                <input 
                  type="text"
                  value={newFruitEmoji}
                  onChange={(e) => setNewFruitEmoji(e.target.value)}
                  className="w-12 text-center border border-zinc-300 rounded-xl py-2 text-sm bg-white focus:outline-none focus:border-rose-500"
                  placeholder="🍓"
                />
                <input 
                  type="text"
                  value={newFruitName}
                  onChange={(e) => setNewFruitName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddFruit(); }}
                  className="flex-1 min-w-[180px] border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-rose-500 font-medium"
                  placeholder="Nombre de la nueva fruta (ej: Arándanos, Maracuyá, Frutillas)"
                />
                <button
                  type="button"
                  onClick={handleAddFruit}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Agregar Fruta</span>
                </button>
              </div>

              {/* Fruits Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cupConfig.fruits.map((fruit) => (
                  <div 
                    key={fruit.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      fruit.available 
                        ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs" 
                        : "bg-zinc-50 border-dashed border-zinc-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{fruit.emoji || "🍓"}</span>
                      <span className="text-xs font-bold text-zinc-900 truncate">{fruit.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleIngredient("fruits", fruit.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          fruit.available
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                        }`}
                        title={fruit.available ? "Disponible (clic para pausar)" : "Pausado (clic para activar)"}
                      >
                        {fruit.available ? "En Stock" : "Agotado"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient("fruits", fruit.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar fruta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 2: YOGURT & CREAM BASES */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                      Paso 2
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-zinc-900">
                      🥣 Yogures, Cremas & Chía (Capa Intermedia)
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    El cliente elegirá 1 base cremosa. Podés agregar opciones veganas, sin azúcar o solo frutas.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-xl">
                  {cupConfig.bases.filter(b => b.available).length} activas / {cupConfig.bases.length} total
                </span>
              </div>

              {/* Add New Base Input */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                <input 
                  type="text"
                  value={newBaseEmoji}
                  onChange={(e) => setNewBaseEmoji(e.target.value)}
                  className="w-12 text-center border border-zinc-300 rounded-xl py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                  placeholder="🥣"
                />
                <input 
                  type="text"
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  className="flex-1 min-w-[160px] border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="Nombre de la base (ej: Yogur Griego Sin Azúcar)"
                />
                <input 
                  type="text"
                  value={newBaseDesc}
                  onChange={(e) => setNewBaseDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddBase(); }}
                  className="flex-1 min-w-[160px] border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500"
                  placeholder="Detalle opcional (ej: Cremoso y proteico)"
                />
                <button
                  type="button"
                  onClick={handleAddBase}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Agregar Base</span>
                </button>
              </div>

              {/* Bases Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cupConfig.bases.map((base) => (
                  <div 
                    key={base.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      base.available 
                        ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs" 
                        : "bg-zinc-50 border-dashed border-zinc-300 opacity-60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{base.emoji || "🥣"}</span>
                        <span className="text-xs font-bold text-zinc-900 truncate">{base.name}</span>
                      </div>
                      {base.description && (
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5 ml-7">{base.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleIngredient("bases", base.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          base.available
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                        }`}
                        title={base.available ? "Disponible" : "Pausado"}
                      >
                        {base.available ? "En Stock" : "Agotado"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient("bases", base.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar base"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 4: TOPPINGS & SAUCES */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      Paso 4
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-zinc-900">
                      🍯 Toppings & Salsas (Cierre del Vaso)
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    El cliente podrá seleccionar sus toppings y salsas preferidos para coronar su vaso.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-xl">
                  {cupConfig.toppings.filter(t => t.available).length} activos / {cupConfig.toppings.length} total
                </span>
              </div>

              {/* Add New Topping Input */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                <input 
                  type="text"
                  value={newToppingEmoji}
                  onChange={(e) => setNewToppingEmoji(e.target.value)}
                  className="w-12 text-center border border-zinc-300 rounded-xl py-2 text-sm bg-white focus:outline-none focus:border-amber-500"
                  placeholder="🍯"
                />
                <input 
                  type="text"
                  value={newToppingName}
                  onChange={(e) => setNewToppingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTopping(); }}
                  className="flex-1 min-w-[180px] border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-amber-500 font-medium"
                  placeholder="Nombre del topping o salsa (ej: Chips de Chocolate, Miel, Granola)"
                />
                <button
                  type="button"
                  onClick={handleAddTopping}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Agregar Topping</span>
                </button>
              </div>

              {/* Toppings Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cupConfig.toppings.map((top) => (
                  <div 
                    key={top.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      top.available 
                        ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs" 
                        : "bg-zinc-50 border-dashed border-zinc-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{top.emoji || "🍯"}</span>
                      <span className="text-xs font-bold text-zinc-900 truncate">{top.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleIngredient("toppings", top.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          top.available
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                        }`}
                        title={top.available ? "Disponible" : "Pausado"}
                      >
                        {top.available ? "En Stock" : "Agotado"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient("toppings", top.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar topping"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="bg-zinc-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Check size={16} className="text-emerald-400" />
                  <span>¿Terminaste de configurar tus vasos?</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Los cambios se guardan directamente en Supabase y se actualizan al instante en el menú online.
                </p>
              </div>

              <button
                onClick={handleSaveCupConfig}
                disabled={isSavingCupConfig}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSavingCupConfig ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>Guardar Configuración</span>
              </button>
            </div>

          </div>
        ) : activeAdminTab === "coupons" ? (
          /* DISCOUNT COUPONS MANAGEMENT VIEW */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header & Quick Action Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shadow-xs">
                    🎟️
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                      <span>Cupones de Descuento</span>
                      <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                        {coupons.length} creados
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Creá y administrá códigos promocionales para que tus clientes los apliquen en el carrito.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenCreateCoupon}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Nuevo Cupón</span>
                  </button>

                  <button
                    onClick={() => handleSaveCoupons()}
                    disabled={isSavingCoupons}
                    className="bg-zinc-900 hover:bg-black text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingCoupons ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Total Cupones</p>
                  <p className="text-2xl font-black text-zinc-900 font-mono mt-1">{coupons.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700">Cupones Activos</p>
                  <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {coupons.filter(c => c.isActive).length}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700">Usos Totales Canjeados</p>
                  <p className="text-2xl font-black text-amber-700 font-mono mt-1">
                    {coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Coupons List */}
            {coupons.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-2xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                  🎟️
                </div>
                <h4 className="text-base font-extrabold text-zinc-800">No hay cupones creados</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Creá tu primer código de descuento (ej: BIENVENIDA10, PROMO2000) para incentivar las ventas en la tienda.
                </p>
                <button
                  onClick={handleOpenCreateCoupon}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Crear Primer Cupón</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => {
                  const isExpired = c.expirationDate && new Date(c.expirationDate + "T23:59:59") < new Date();
                  const isLimitReached = c.totalUsageLimit && (c.currentUses || 0) >= c.totalUsageLimit;
                  
                  return (
                    <div
                      key={c.id}
                      className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs flex flex-col justify-between gap-4 ${
                        !c.isActive 
                          ? "border-zinc-200 opacity-75 bg-zinc-50/50" 
                          : isExpired 
                          ? "border-rose-200 bg-rose-50/30" 
                          : isLimitReached
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-zinc-200 hover:border-amber-300"
                      }`}
                    >
                      {/* Top Row: Code Badge & Discount */}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm px-3 py-1 bg-zinc-900 text-white rounded-lg tracking-wider shadow-2xs flex items-center gap-1.5">
                              <Ticket size={13} className="text-amber-400" />
                              {c.code}
                            </span>
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                              c.discountType === "percentage" 
                                ? "bg-rose-100 text-rose-700" 
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {c.discountType === "percentage" 
                                ? `${c.discountValue}% OFF` 
                                : `$${Number(c.discountValue).toLocaleString("es-AR")} OFF`}
                            </span>
                          </div>

                          {/* Status Pill */}
                          <div>
                            {!c.isActive ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
                                Pausado
                              </span>
                            ) : isExpired ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                Vencido
                              </span>
                            ) : isLimitReached ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Agotado
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Activo
                              </span>
                            )}
                          </div>
                        </div>

                        {c.description && (
                          <p className="text-xs text-zinc-600 font-medium">
                            {c.description}
                          </p>
                        )}

                        {/* Rules & Details Pills */}
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-600 font-medium">
                          {c.minOrderAmount ? (
                            <span className="bg-zinc-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <DollarSign size={11} className="text-zinc-500" />
                              Mínimo: ${Number(c.minOrderAmount).toLocaleString("es-AR")}
                            </span>
                          ) : (
                            <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-400">
                              Sin mínimo
                            </span>
                          )}

                          {c.expirationDate ? (
                            <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isExpired ? "bg-rose-100 text-rose-700 font-bold" : "bg-zinc-100"
                            }`}>
                              <Calendar size={11} className="text-zinc-500" />
                              Vence: {c.expirationDate}
                            </span>
                          ) : (
                            <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-400">
                              Sin vencimiento
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isLimitReached ? "bg-amber-100 text-amber-800 font-bold" : "bg-zinc-100"
                          }`}>
                            <Hash size={11} className="text-zinc-500" />
                            Usos: {c.currentUses || 0}{c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : " (ilimitado)"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleCouponActive(c.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                            c.isActive 
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80" 
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${c.isActive ? "bg-emerald-600" : "bg-zinc-400"}`}></span>
                          <span>{c.isActive ? "Habilitado" : "Deshabilitado"}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCoupon(c)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Editar cupón"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar cupón"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODAL CREAR / EDITAR CUPÓN */}
            {isCouponModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-zinc-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-zinc-900">
                          {editingCouponId ? "Editar Cupón" : "Crear Nuevo Cupón"}
                        </h4>
                        <p className="text-xs text-zinc-500 font-medium">
                          Configurá el código, porcentaje o monto y reglas de uso.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCouponModalOpen(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 text-xs font-medium">
                    {/* Código */}
                    <div className="space-y-1.5">
                      <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                        Código del Cupón *
                      </label>
                      <input
                        type="text"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        placeholder="Ej: FRUTA10, VERANO2026, BIENVENIDA"
                        className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-mono font-extrabold text-sm uppercase outline-none bg-zinc-50 focus:bg-white transition-colors"
                        autoFocus
                      />
                      <p className="text-[10px] text-zinc-400">Se convertirá automáticamente a mayúsculas sin espacios.</p>
                    </div>

                    {/* Tipo y Valor de Descuento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                          Tipo de Descuento *
                        </label>
                        <select
                          value={couponForm.discountType}
                          onChange={(e) => setCouponForm({ 
                            ...couponForm, 
                            discountType: e.target.value as "percentage" | "fixed" 
                          })}
                          className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3 py-2.5 font-bold outline-none bg-zinc-50 focus:bg-white"
                        >
                          <option value="percentage">Porcentaje (%)</option>
                          <option value="fixed">Monto Fijo ($)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                          {couponForm.discountType === "percentage" ? "Porcentaje de Descuento (%) *" : "Monto a Descontar ($) *"}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={couponForm.discountType === "percentage" ? "100" : undefined}
                            value={couponForm.discountValue}
                            onChange={(e) => setCouponForm({ 
                              ...couponForm, 
                              discountValue: e.target.value === "" ? "" : Number(e.target.value) 
                            })}
                            placeholder={couponForm.discountType === "percentage" ? "15" : "2000"}
                            className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-bold outline-none bg-zinc-50 focus:bg-white"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                            {couponForm.discountType === "percentage" ? "%" : "$"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compra mínima y Límite de usos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                          Compra Mínima ($) (Opcional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponForm.minOrderAmount}
                          onChange={(e) => setCouponForm({ 
                            ...couponForm, 
                            minOrderAmount: e.target.value === "" ? "" : Number(e.target.value) 
                          })}
                          placeholder="Ej: 8000 (0 = sin mínimo)"
                          className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none bg-zinc-50 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                          Límite de Usos Totales (Opcional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={couponForm.totalUsageLimit}
                          onChange={(e) => setCouponForm({ 
                            ...couponForm, 
                            totalUsageLimit: e.target.value === "" ? "" : Number(e.target.value) 
                          })}
                          placeholder="Ej: 50 pedidos (vacío = ilimitado)"
                          className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none bg-zinc-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Fecha de Expiración */}
                    <div className="space-y-1.5">
                      <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                        Fecha de Vencimiento (Opcional)
                      </label>
                      <input
                        type="date"
                        value={couponForm.expirationDate}
                        onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })}
                        className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none bg-zinc-50 focus:bg-white"
                      />
                      <p className="text-[10px] text-zinc-400">Si no definís fecha, el cupón no tendrá vencimiento.</p>
                    </div>

                    {/* Descripción o nota interna */}
                    <div className="space-y-1.5">
                      <label className="block text-zinc-700 font-extrabold uppercase text-[10px] tracking-wider">
                        Descripción o Nota Interna (Opcional)
                      </label>
                      <input
                        type="text"
                        value={couponForm.description}
                        onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                        placeholder="Ej: Descuento para historias de Instagram, amigos del local..."
                        className="w-full border border-zinc-300 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none bg-zinc-50 focus:bg-white"
                      />
                    </div>

                    {/* Switch Activo */}
                    <div className="pt-2 flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      <div>
                        <p className="font-extrabold text-zinc-800">Cupón Activo</p>
                        <p className="text-[10px] text-zinc-500">Permite que los clientes puedan ingresarlo y canjearlo en el carrito.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={couponForm.isActive}
                        onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                        className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                    <button
                      onClick={() => setIsCouponModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCouponModal}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={16} />
                      <span>{editingCouponId ? "Guardar Cambios" : "Crear Cupón"}</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        ) : (
          /* TRADITIONAL PRODUCTS CATALOG VIEW */
          <>
            {/* Modal: Crear Nueva Categoría */}
            {isAddingCategory && (
              <div className="mb-6 bg-white p-5 rounded-2xl border border-emerald-300 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="font-extrabold text-sm text-zinc-900 mb-2 flex items-center gap-2">
                  <Plus size={16} className="text-emerald-700" />
                  <span>Agregar Nueva Categoría al Menú</span>
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la nueva categoría (ej: Smoothies & Jugos Naturales)"
                    className="w-full sm:flex-1 border border-zinc-300 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-xs outline-none font-medium"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleCreateCategory}
                      className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      Guardar Categoría
                    </button>
                    <button
                      onClick={() => setIsAddingCategory(false)}
                      className="flex-1 sm:flex-none bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories & Products List */}
            <div className="space-y-8">
          {categoriesList.map((catName) => {
            const categoryItems = items.filter(i => i.category === catName);

            return (
              <div key={catName} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
                
                {/* Category Header */}
                <div className="bg-zinc-50/90 px-5 sm:px-6 py-4 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-3">
                  {editingCategoryOldName === catName ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input 
                        type="text" 
                        value={editingCategoryNewName}
                        onChange={(e) => setEditingCategoryNewName(e.target.value)}
                        className="text-base font-extrabold border border-zinc-300 rounded-xl px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 w-full"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveCategoryName(catName)} 
                        className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                        title="Guardar nombre"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingCategoryOldName(null)} 
                        className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-xl"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-base sm:text-lg text-zinc-900">{catName}</h3>
                      <span className="text-[11px] bg-zinc-200 text-zinc-700 px-2.5 py-0.5 rounded-full font-bold">
                        {categoryItems.length} {categoryItems.length === 1 ? "producto" : "productos"}
                      </span>
                      <button 
                        onClick={() => {
                          setEditingCategoryOldName(catName);
                          setEditingCategoryNewName(catName);
                        }} 
                        className="text-zinc-400 hover:text-zinc-700 p-1 transition-colors"
                        title="Renombrar categoría"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenProductModal(catName)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} /> 
                      <span>Nuevo Producto</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(catName)} 
                      className="text-zinc-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-5 sm:p-6">
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 text-xs italic bg-zinc-50 rounded-xl border border-dashed border-zinc-200 space-y-2">
                      <Package size={28} className="mx-auto opacity-30 stroke-1" />
                      <p>Sin productos registrados en esta categoría.</p>
                      <button
                        onClick={() => handleOpenProductModal(catName)}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        + Agregar el primer producto
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryItems.map(item => (
                        <div key={item.id} className="border border-zinc-200 rounded-2xl p-4 flex gap-4 hover:border-zinc-300 transition-all bg-white shadow-2xs">
                          <img 
                            src={item.image_urls?.[0] || "/products/especial-corta-la-fruta.png"} 
                            alt={item.name} 
                            className="w-20 h-20 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-sm text-zinc-900 leading-tight truncate">{item.name}</h4>
                                {(() => {
                                  const rawPromo = item.promo_price ?? (item.usdzurl && !isNaN(Number(item.usdzurl)) ? Number(item.usdzurl) : null);
                                  const hasPromo = rawPromo && Number(rawPromo) > 0 && Number(rawPromo) < item.price;
                                  if (hasPromo) {
                                    return (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono text-[10px] line-through text-zinc-400">
                                          ${item.price.toLocaleString("es-AR")}
                                        </span>
                                        <span className="font-mono text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                                          ${Number(rawPromo).toLocaleString("es-AR")}
                                        </span>
                                        <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                          OFERTA
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="font-mono text-xs font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md shrink-0">
                                      ${item.price.toLocaleString("es-AR")}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                              {item.glburl ? (
                                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  <Box size={13} /> Con Modelo 3D
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">Solo imagen</span>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenProductModal(item.category, item)} 
                                  className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                                  title="Editar producto"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(item.id, item.name)} 
                                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Eliminar producto"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </>
    )}

      </main>

      {/* Modal Add / Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">
                  {editingProduct.id ? "Editar Producto & Archivos" : "Nuevo Producto & Modelo 3D"}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Categoría: {editingProduct.category}</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {/* Category Select */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[10px]">
                  Categoría
                </label>
                <select
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-medium text-zinc-800 bg-white"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[10px]">
                  Nombre del producto *
                </label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-medium text-zinc-900"
                  placeholder="Ej: Vaso Sandía y Melón"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[10px]">
                  Descripción / Ingredientes
                </label>
                <textarea 
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none resize-none h-20 font-medium text-zinc-800"
                  placeholder="Detalles de los ingredientes frescos, preparación o tamaño..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1 uppercase tracking-wider text-[10px]">
                  Precio Regular ($ ARS) *
                </label>
                <input 
                  type="number" 
                  value={editingProduct.price || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-mono font-bold text-zinc-900"
                  placeholder="3200"
                />
              </div>

              {/* Promociones / Precio de Oferta */}
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-rose-950 flex items-center gap-1.5 text-xs">
                    <Sparkles size={16} className="text-rose-600" />
                    ¿Poner en Promoción / Oferta?
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-800">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.hasPromo}
                      onChange={e => setEditingProduct({ ...editingProduct, hasPromo: e.target.checked })}
                      className="rounded accent-rose-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Activar Oferta</span>
                  </label>
                </div>

                {editingProduct.hasPromo && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block font-bold text-rose-900 mb-1 uppercase tracking-wider text-[10px]">
                        Precio de Promoción / Oferta ($ ARS) *
                      </label>
                      <input 
                        type="number" 
                        value={editingProduct.promoPrice}
                        onChange={e => setEditingProduct({ ...editingProduct, promoPrice: e.target.value ? Number(e.target.value) : "" })}
                        className="w-full border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 rounded-xl px-3 py-2 outline-none font-mono font-extrabold text-rose-700 bg-white"
                        placeholder="Ej: 2800"
                      />
                    </div>

                    {editingProduct.price > 0 && Number(editingProduct.promoPrice) > 0 && Number(editingProduct.promoPrice) < editingProduct.price && (
                      <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                            🔥 OFERTA
                          </span>
                          <span className="line-through text-zinc-400 font-mono text-xs">
                            ${editingProduct.price.toLocaleString("es-AR")}
                          </span>
                          <span className="font-extrabold text-rose-600 font-mono text-sm">
                            ${Number(editingProduct.promoPrice).toLocaleString("es-AR")}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          -{Math.round(((editingProduct.price - Number(editingProduct.promoPrice)) / editingProduct.price) * 100)}%
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      En la tienda web el precio viejo aparecerá <strong>tachado</strong> y se destacará el nuevo precio con el cartel de <strong>OFERTA</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Image Upload / URL */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-2">
                <label className="font-bold text-zinc-800 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon size={16} className="text-zinc-500" />
                    Foto del Producto
                  </span>
                  {editingProduct.imageUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold">✓ Imagen vinculada</span>
                  )}
                </label>

                {editingProduct.imageUrl && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-zinc-200">
                    <img 
                      src={editingProduct.imageUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-lg object-cover bg-zinc-100" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{editingProduct.imageUrl}</p>
                    </div>
                    <button 
                      onClick={() => setEditingProduct({ ...editingProduct, imageUrl: "" })}
                      className="p-1 text-zinc-400 hover:text-red-600"
                      title="Quitar imagen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    accept="image/*" 
                    onChange={handleImageFileChange} 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => imageInputRef.current?.click()}
                    className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors text-xs"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-emerald-600" />
                        <span>Subiendo a Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Subir Foto</span>
                      </>
                    )}
                  </button>

                  <input 
                    type="text" 
                    value={editingProduct.imageUrl}
                    onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    placeholder="O pegar URL externa (https://...)"
                    className="flex-1 border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-mono text-[11px] bg-white"
                  />
                </div>
              </div>

              {/* 3D Model GLB Upload / URL */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                    <Box size={16} className="text-emerald-700" />
                    Modelo 3D para Realidad Aumentada (.glb)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-800">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.has3D}
                      onChange={e => setEditingProduct({ ...editingProduct, has3D: e.target.checked })}
                      className="rounded accent-emerald-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Activar 3D</span>
                  </label>
                </div>

                {editingProduct.has3D && (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-zinc-500">
                      Subí tu archivo <code>.glb</code>. Será optimizado automáticamente para verse plano y perfecto en Realidad Aumentada.
                    </p>

                    {editingProduct.glbUrl && (
                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200 text-xs font-mono">
                        <Box size={14} className="text-emerald-600 shrink-0" />
                        <span className="truncate flex-1 text-[10px] text-zinc-600">{editingProduct.glbUrl}</span>
                        <button 
                          onClick={() => setEditingProduct({ ...editingProduct, glbUrl: "" })}
                          className="p-1 text-zinc-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={glbInputRef} 
                        accept=".glb" 
                        onChange={handleGlbFileChange} 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        disabled={isUploadingGlb}
                        onClick={() => glbInputRef.current?.click()}
                        className="bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors text-xs"
                      >
                        {isUploadingGlb ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-emerald-600" />
                            <span>Procesando y Subiendo 3D...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Subir Archivo .glb</span>
                          </>
                        )}
                      </button>

                      <input 
                        type="text" 
                        value={editingProduct.glbUrl}
                        onChange={e => setEditingProduct({ ...editingProduct, glbUrl: e.target.value })}
                        placeholder="O pegar URL del modelo (/uploads/...)"
                        className="flex-1 border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-mono text-[11px] bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-200 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProduct}
                disabled={!editingProduct.name || !editingProduct.price || isUploadingImage || isUploadingGlb}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
              >
                <Save size={16} />
                <span>Guardar Producto</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
