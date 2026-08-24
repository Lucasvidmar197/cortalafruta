"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, Store, Package, Layers, Box, Image as ImageIcon } from "lucide-react";

// Initial mock data with images and 3D flag
const INITIAL_CATEGORIES = [
  {
    id: "c1",
    name: "Vasos de Fruta Cortada",
    items: [
      { 
        id: "p1", 
        name: "Vaso Sandía y Melón", 
        description: "Cortes frescos de sandía dulce y melón en su punto justo de maduración.", 
        price: 2500,
        imageUrl: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80",
        glbUrl: "/models/vaso_sandia.glb"
      },
      { 
        id: "p2", 
        name: "Vaso Mix Tropical", 
        description: "Combinación de mango, ananá, kiwi fresco y frutillas seleccionadas.", 
        price: 3200,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        glbUrl: "/models/vaso_tropical.glb"
      }
    ]
  },
  {
    id: "c2",
    name: "Ensaladas de Frutas",
    items: [
      { 
        id: "p3", 
        name: "Ensalada Clásica", 
        description: "Manzana, banana, naranja, uva y durazno macerados en su propio jugo.", 
        price: 3500,
        imageUrl: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80",
        glbUrl: "/models/ensalada_clasica.glb"
      }
    ]
  }
];

export default function AdminPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  
  // State for editing category name
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // State for adding/editing item
  const [editingItem, setEditingItem] = useState<{ 
    categoryId: string, 
    id: string | null, 
    name: string, 
    description: string, 
    price: number,
    imageUrl: string,
    glbUrl: string 
  } | null>(null);

  // Category Actions
  const addCategory = () => {
    const newCategory = {
      id: `c${Date.now()}`,
      name: "Nueva Categoría",
      items: []
    };
    setCategories([...categories, newCategory]);
  };

  const deleteCategory = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría y sus productos?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const startEditCategory = (id: string, name: string) => {
    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };

  const saveCategory = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name: editingCategoryName } : c));
    setEditingCategoryId(null);
  };

  // Item Actions
  const deleteItem = (categoryId: string, itemId: string) => {
    if (confirm("¿Eliminar producto?")) {
      setCategories(categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter(i => i.id !== itemId) };
        }
        return c;
      }));
    }
  };

  const openItemModal = (categoryId: string, item: any = null) => {
    if (item) {
      setEditingItem({ 
        categoryId, 
        id: item.id, 
        name: item.name, 
        description: item.description, 
        price: item.price,
        imageUrl: item.imageUrl || "",
        glbUrl: item.glbUrl || ""
      });
    } else {
      setEditingItem({ 
        categoryId, 
        id: null, 
        name: "", 
        description: "", 
        price: 0,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        glbUrl: "/models/nuevo_producto.glb"
      });
    }
  };

  const saveItem = () => {
    if (!editingItem) return;
    
    setCategories(categories.map(c => {
      if (c.id === editingItem.categoryId) {
        if (editingItem.id) {
          // Edit existing
          return {
            ...c,
            items: c.items.map(i => i.id === editingItem.id ? { 
              ...i, 
              name: editingItem.name, 
              description: editingItem.description, 
              price: editingItem.price,
              imageUrl: editingItem.imageUrl,
              glbUrl: editingItem.glbUrl 
            } : i)
          };
        } else {
          // Add new
          return {
            ...c,
            items: [...c.items, { 
              id: `p${Date.now()}`, 
              name: editingItem.name, 
              description: editingItem.description, 
              price: editingItem.price,
              imageUrl: editingItem.imageUrl,
              glbUrl: editingItem.glbUrl
            }]
          };
        }
      }
      return c;
    }));
    
    setEditingItem(null);
  };

  const totalProducts = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/corta-la-fruta" 
              className="text-zinc-600 hover:text-zinc-900 p-2 -ml-2 rounded-lg hover:bg-zinc-100 transition-colors flex items-center gap-1.5 text-sm font-semibold"
            >
              <ArrowLeft size={18} />
              <span>Ver Menú 3D</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <img 
                src="/logo-corta-la-fruta.png" 
                alt="Corta la Fruta Logo" 
                className="h-8 w-auto object-contain shrink-0" 
              />
              <h1 className="font-extrabold text-base text-zinc-900">
                Gestión de Catálogo & Modelos 3D
              </h1>
            </div>
          </div>
          
          <span className="text-xs bg-zinc-100 text-zinc-700 font-bold px-3 py-1 rounded-lg border border-zinc-200">
            Vista Previa Demo
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Dashboard KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Categorías</p>
              <p className="text-2xl font-extrabold text-zinc-900">{categories.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Productos Activos</p>
              <p className="text-2xl font-extrabold text-zinc-900">{totalProducts}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-end">
            <button 
              onClick={addCategory}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 w-full justify-center shadow-xs"
            >
              <Plus size={18} />
              Agregar Categoría
            </button>
          </div>
        </div>

        {/* Categories & Products List */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
              
              {/* Category Header */}
              <div className="bg-zinc-50/90 px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
                {editingCategoryId === category.id ? (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <input 
                      type="text" 
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="text-lg font-extrabold border border-zinc-300 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 w-full"
                      autoFocus
                    />
                    <button onClick={() => saveCategory(category.id)} className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg">
                      <Save size={18} />
                    </button>
                    <button onClick={() => setEditingCategoryId(null)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-lg">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-lg text-zinc-900">{category.name}</h3>
                    <span className="text-xs bg-zinc-200 text-zinc-700 px-2.5 py-0.5 rounded-full font-bold">
                      {category.items.length} productos
                    </span>
                    <button onClick={() => startEditCategory(category.id, category.name)} className="text-zinc-400 hover:text-zinc-700 p-1">
                      <Edit2 size={15} />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openItemModal(category.id)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Nuevo Producto
                  </button>
                  <button onClick={() => deleteCategory(category.id)} className="text-zinc-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Items Cards */}
              <div className="p-6">
                {category.items.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-sm italic bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    Sin productos en esta categoría.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map(item => (
                      <div key={item.id} className="border border-zinc-200 rounded-xl p-4 flex gap-4 hover:border-zinc-300 transition-colors bg-white">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-20 h-20 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm text-zinc-900">{item.name}</h4>
                              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                                ${item.price.toLocaleString("es-AR")}
                              </span>
                            </div>
                            <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <Box size={13} /> Modelo 3D Configurado
                            </span>
                            <div className="flex gap-1">
                              <button onClick={() => openItemModal(category.id, item)} className="p-1 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteItem(category.id, item.id)} className="p-1 text-zinc-500 hover:text-red-600 rounded hover:bg-red-50">
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
          ))}
        </div>
      </main>

      {/* Modal Add / Edit Product */}
      {editingItem && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200">
            <div className="p-5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-base text-zinc-900">
                {editingItem.id ? "Editar Producto & Archivos 3D" : "Nuevo Producto & Modelo 3D"}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Nombre del producto</label>
                <input 
                  type="text" 
                  value={editingItem.name}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full border border-zinc-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl px-3 py-2 outline-none"
                  placeholder="Ej: Vaso Sandía y Melón"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Descripción</label>
                <textarea 
                  value={editingItem.description}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full border border-zinc-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl px-3 py-2 outline-none resize-none h-20 text-xs"
                  placeholder="Detalles de ingredientes o tamaño de la porción..."
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Precio ($ ARS)</label>
                <input 
                  type="number" 
                  value={editingItem.price || ""}
                  onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})}
                  className="w-full border border-zinc-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl px-3 py-2 outline-none font-mono"
                  placeholder="2500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1 flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-zinc-500" />
                  URL de Imagen del Producto
                </label>
                <input 
                  type="text" 
                  value={editingItem.imageUrl}
                  onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})}
                  className="w-full border border-zinc-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl px-3 py-2 outline-none text-xs font-mono"
                  placeholder="https://..."
                />
              </div>

              {/* 3D Model GLB URL */}
              <div>
                <label className="block font-semibold text-zinc-800 mb-1 flex items-center gap-1.5">
                  <Box size={16} className="text-emerald-600" />
                  Archivo de Modelo 3D (.glb)
                </label>
                <input 
                  type="text" 
                  value={editingItem.glbUrl}
                  onChange={e => setEditingItem({...editingItem, glbUrl: e.target.value})}
                  className="w-full border border-zinc-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl px-3 py-2 outline-none text-xs font-mono"
                  placeholder="/models/vaso.glb"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-zinc-700 hover:bg-zinc-200 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveItem}
                disabled={!editingItem.name || !editingItem.price}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
