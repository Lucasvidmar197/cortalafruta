"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Trash2, Edit2, Save, X, ArrowLeft, Package, Layers, Box, 
  Image as ImageIcon, Upload, Loader2, LogOut, Check, Sparkles, ExternalLink, Lock 
} from "lucide-react";
import { WebIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit } from "@gltf-transform/extensions";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  scale?: number;
  glburl?: string | null;
  usdzurl?: string | null;
  category: string;
  image_urls?: string[];
  created_at?: string;
}

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

  // 2. Fetch menu items from Supabase when authenticated
  const fetchMenuData = async () => {
    setIsLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedItems: MenuItem[] = data.map((item: any) => ({
          ...item,
          glburl: item.glburl || null,
          image_urls: item.image_urls || [],
        }));
        setItems(mappedItems);

        // Compute unique categories combining defaults and database items
        const itemCategories = Array.from(new Set(mappedItems.map(i => i.category).filter(Boolean)));
        const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...itemCategories]));
        setCategoriesList(combined);
      }
    } catch (err: any) {
      console.error("Error al cargar menú de Supabase:", err);
      showToast("Error al conectar con Supabase: " + (err.message || "revisá la conexión"));
    } finally {
      setIsLoadingMenu(false);
    }
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
      setEditingProduct({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: item.price,
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

    const payload = {
      name: editingProduct.name.trim(),
      description: editingProduct.description.trim(),
      price: Number(editingProduct.price),
      category: editingProduct.category,
      glburl: editingProduct.has3D && editingProduct.glbUrl.trim() ? editingProduct.glbUrl.trim() : null,
      image_urls: editingProduct.imageUrl.trim() ? [editingProduct.imageUrl.trim()] : [],
    };

    try {
      if (editingProduct.id) {
        // Update existing product
        const { error } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", editingProduct.id);

        if (error) throw error;

        setItems(items.map(i => i.id === editingProduct.id ? { ...i, ...payload } : i));
        showToast("Producto actualizado correctamente");
      } else {
        // Insert new product
        const newId = `prod_${Date.now()}`;
        const { error } = await supabase
          .from("menu_items")
          .insert({
            id: newId,
            ...payload,
            scale: 1,
          });

        if (error) throw error;

        setItems([...items, { id: newId, ...payload, scale: 1 }]);
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Categorías Activas</p>
              <p className="text-2xl font-extrabold text-zinc-900 font-mono">{categoriesList.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Package size={22} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Productos en Carta</p>
              <p className="text-2xl font-extrabold text-zinc-900 font-mono">{totalProducts}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Box size={22} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Productos 3D / AR</p>
                <p className="text-2xl font-extrabold text-zinc-900 font-mono">{productsWith3D}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus size={16} />
              <span className="hidden lg:inline">Nueva Categoría</span>
            </button>
          </div>
        </div>

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
                                <span className="font-mono text-xs font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md shrink-0">
                                  ${item.price.toLocaleString("es-AR")}
                                </span>
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
                  Precio ($ ARS) *
                </label>
                <input 
                  type="number" 
                  value={editingProduct.price || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full border border-zinc-300 focus:border-emerald-600 rounded-xl px-3 py-2 outline-none font-mono font-bold text-zinc-900"
                  placeholder="3200"
                />
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
