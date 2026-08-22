"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"cocina" | "menu">("cocina");

  // Realtime States
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  
  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Edit Menu Item State
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);

  const fetchData = async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: reqData } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
    const { data: menuData } = await supabase.from('menu_items').select('*').order('created_at', { ascending: true });
    if (ordersData) setOrders(ordersData);
    if (reqData) setRequests(reqData);
    if (menuData) setMenuItems(menuData);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();

    // Subscribe to realtime channels
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta. (Usa: admin123)");
    }
  };

  // =========================================================================
  // COCINA Y SALON LOGIC
  // =========================================================================

  const updateOrderStatus = async (id: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const resolveRequest = async (id: string) => {
    await supabase.from('service_requests').update({ status: 'Resuelto' }).eq('id', id);
  };

  const handleEditQuantity = (itemId: string, delta: number) => {
    setEditingOrder((prev: any) => {
      if (!prev) return prev;
      const newItems = prev.items.map((item: any) => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter((item: any) => item.quantity > 0);
      
      const newTotal = newItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, total: newTotal };
    });
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    if (editingOrder.items.length === 0) {
      await supabase.from('orders').update({ status: 'Cancelado', items: [], total: 0 }).eq('id', editingOrder.id);
    } else {
      await supabase.from('orders').update({ items: editingOrder.items, total: editingOrder.total }).eq('id', editingOrder.id);
    }
    setEditingOrder(null);
  };

  // =========================================================================
  // GESTION DE MENU LOGIC
  // =========================================================================

  const handleMenuSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;
    
    const uploadData = new FormData();
    const glb = formData.get("glb") as File;
    const usdz = formData.get("usdz") as File;
    const imageFiles = formData.getAll("images") as File[];
    
    if (glb && glb.size > 0) uploadData.append("glb", glb);
    if (usdz && usdz.size > 0) uploadData.append("usdz", usdz);
    for (const img of imageFiles) {
      if (img.size > 0) uploadData.append("images", img);
    }

    try {
      let uploadedFiles: { glb?: string; usdz?: string; images?: string[] } = {};

      if ((glb && glb.size > 0) || (usdz && usdz.size > 0) || imageFiles.some(f => f.size > 0)) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
        uploadedFiles = await uploadRes.json();
      }

      const menuRes = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category: category || "Destacados",
          scale: 1,
          glbUrl: uploadedFiles.glb || "",
          usdzUrl: uploadedFiles.usdz || "",
          imageUrls: uploadedFiles.images || [],
        }),
      });

      if (!menuRes.ok) throw new Error("Failed to save menu item");

      alert("Plato agregado exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchData(); // reload
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el plato.");
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres borrar este plato? Esta acción no se puede deshacer.")) {
      await supabase.from('menu_items').delete().eq('id', id);
      alert("Plato borrado");
    }
  };

  const saveEditedMenuItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const price = formData.get("price") as string;
      const category = formData.get("category") as string;

      await supabase.from('menu_items').update({
        name,
        description,
        price: parseFloat(price),
        category: category || "Destacados"
      }).eq('id', editingMenuItem.id);

      alert("Cambios guardados");
      setEditingMenuItem(null);
    } catch (err) {
      alert("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const renameCategory = async (oldName: string) => {
    const newName = prompt(`Ingresa el nuevo nombre para la categoría "${oldName}":`, oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
      await supabase.from('menu_items').update({ category: newName.trim() }).eq('category', oldName);
      alert("Categoría renombrada");
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-none w-full max-w-sm text-center border border-zinc-200">
          <h2 className="text-2xl font-light tracking-widest uppercase text-zinc-900 mb-2">L'Atelier</h2>
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-8">Administración</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-500 transition-all mb-4 outline-none text-center tracking-widest text-sm"
          />
          <button type="submit" className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-sans text-xs tracking-widest uppercase transition-all">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'Pendiente');
  const pastOrders = orders.filter(o => o.status !== 'Pendiente').slice(0, 5);
  const pendingRequests = requests.filter(r => r.status === 'Pendiente');
  const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category || "Destacados")));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      
      {/* Header Admin */}
      <header className="bg-zinc-900 text-white p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-light tracking-[0.2em] uppercase">L'Atelier</h1>
            <p className="text-zinc-400 text-[10px] tracking-widest uppercase mt-1">Terminal de Salón</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-xs tracking-widest uppercase transition-colors">
              Ver Menú
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-zinc-200 mb-8 sticky top-[88px] z-30">
        <div className="max-w-6xl mx-auto flex">
          <button 
            onClick={() => setActiveTab("cocina")}
            className={`px-8 py-4 text-xs tracking-widest uppercase transition-colors border-b-2 ${activeTab === 'cocina' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            Cocina y Salón
            {(pendingOrders.length > 0 || pendingRequests.length > 0) && (
              <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                {pendingOrders.length + pendingRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("menu")}
            className={`px-8 py-4 text-xs tracking-widest uppercase transition-colors border-b-2 ${activeTab === 'menu' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            Gestión de Platos
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {activeTab === "cocina" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ALERTAS DE SALON */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-4">Alertas de Mesas</h2>
              
              {pendingRequests.length === 0 ? (
                <p className="text-zinc-400 text-sm italic">No hay llamados pendientes.</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className={`p-5 border-l-4 bg-white shadow-sm flex justify-between items-center ${req.request_type === 'cuenta' ? 'border-green-500' : 'border-red-500'}`}>
                    <div>
                      <p className="text-2xl font-light">Mesa {req.table_number}</p>
                      <p className="text-sm font-medium uppercase tracking-wider mt-1">
                        {req.request_type === 'cuenta' ? '🧾 Pide la cuenta' : '🛎️ Llama al mozo'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">{new Date(req.created_at).toLocaleTimeString()}</p>
                    </div>
                    <button 
                      onClick={() => resolveRequest(req.id)}
                      className="w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                      title="Marcar como resuelto"
                    >
                      ✓
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* PEDIDOS DE COCINA */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-4">Pedidos Nuevos (Cocina)</h2>
                {pendingOrders.length === 0 ? (
                  <p className="text-zinc-400 text-sm italic">No hay pedidos pendientes.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingOrders.map(order => (
                      <div key={order.id} className="bg-white border border-zinc-200 p-5 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4 border-b border-zinc-100 pb-4">
                          <div>
                            <span className="bg-zinc-900 text-white text-xs px-2 py-1 tracking-widest uppercase">Mesa {order.table_number}</span>
                            <p className="text-xs text-zinc-400 mt-2">{new Date(order.created_at).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500 tracking-widest uppercase">Total</p>
                            <p className="text-lg font-medium">${order.total}</p>
                          </div>
                        </div>
                        
                        <div className="flex-grow space-y-3 mb-6">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span><span className="font-medium mr-2">{item.quantity}x</span> {item.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingOrder(order)}
                            className="w-1/3 py-3 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs tracking-widest uppercase transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Entregado')}
                            className="w-2/3 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-colors"
                          >
                            Marcar como Servido
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HISTORIAL BREVE */}
              <div className="opacity-70">
                <h2 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-4">Últimos Entregados</h2>
                <div className="space-y-2">
                  {pastOrders.map(order => (
                    <div key={order.id} className="bg-zinc-100 p-3 flex justify-between items-center text-sm">
                      <span className="font-medium">Mesa {order.table_number}</span>
                      <span className="text-zinc-500">{order.items.length} platos</span>
                      <span className="text-xs px-2 py-1 bg-green-200 text-green-900 rounded">{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* MODAL DE EDICION DE PEDIDO */}
            {editingOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingOrder(null)}></div>
                <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h2 className="font-light text-xl tracking-wide uppercase">Editar Mesa {editingOrder.table_number}</h2>
                    <button onClick={() => setEditingOrder(null)} className="text-zinc-400 hover:text-zinc-900 text-2xl font-light">&times;</button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-grow space-y-4">
                    {editingOrder.items.length === 0 ? (
                      <p className="text-red-500 text-sm">El pedido quedará cancelado porque no tiene platos.</p>
                    ) : (
                      editingOrder.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center border-b border-zinc-100 pb-4">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-zinc-500">${item.price.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex items-center gap-4 bg-zinc-50 rounded-full px-2 py-1 border border-zinc-200">
                            <button onClick={() => handleEditQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-lg hover:text-red-500">-</button>
                            <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => handleEditQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-lg hover:text-green-500">+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-6 border-t border-zinc-100 bg-zinc-50">
                    <div className="flex justify-between mb-4">
                      <span className="text-sm font-medium uppercase tracking-widest text-zinc-500">Nuevo Total</span>
                      <span className="text-xl font-bold">${editingOrder.total.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={saveEditedOrder}
                      className="w-full py-4 bg-zinc-900 text-white font-sans text-xs tracking-widest uppercase hover:bg-zinc-800 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* FORMULARIO AGREGAR PLATO */}
            <div className="bg-white p-8 border border-zinc-200 shadow-sm self-start sticky top-[160px]">
              <h2 className="text-lg font-light tracking-widest uppercase border-b border-zinc-200 pb-4 mb-8">Agregar Plato al Menú</h2>
              <form onSubmit={handleMenuSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Nombre del Plato</label>
                    <input name="name" type="text" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Precio ($)</label>
                    <input name="price" type="number" step="0.01" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Categoría</label>
                  <input 
                    name="category"
                    list="category-list"
                    required
                    placeholder="Ej. Destacados, Entradas, Pizzas..."
                    className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-white"
                  />
                  <datalist id="category-list">
                    {uniqueCategories.map(cat => (
                      <option key={cat as string} value={cat as string} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Descripción</label>
                  <textarea name="description" required rows={3} className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors resize-none"></textarea>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-100">
                  <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-900 mb-4">Fotos y Modelos 3D</h3>
                  
                  <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 border-dashed">
                    <label className="block text-xs font-medium text-zinc-700 mb-2">Fotos Normales (Puedes seleccionar varias)</label>
                    <input name="images" type="file" accept="image/*" multiple className="w-full text-xs text-zinc-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-zinc-50 border border-zinc-200 border-dashed">
                      <label className="block text-xs font-medium text-zinc-700 mb-2">.glb (Android/Web)</label>
                      <input name="glb" type="file" accept=".glb" className="w-full text-xs text-zinc-500" />
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 border-dashed">
                      <label className="block text-xs font-medium text-zinc-700 mb-2">.usdz (iOS)</label>
                      <input name="usdz" type="file" accept=".usdz" className="w-full text-xs text-zinc-500" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-8 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-all disabled:opacity-50 flex justify-center h-[52px]"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Publicar Plato"}
                </button>
              </form>
            </div>

            {/* LISTA DE PLATOS EXISTENTES */}
            <div className="space-y-8">
              {uniqueCategories.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">No hay platos en el menú.</p>
              ) : (
                uniqueCategories.map(cat => (
                  <div key={cat as string} className="bg-white border border-zinc-200 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-2">
                      <h3 className="text-lg font-light tracking-widest uppercase">{cat as string}</h3>
                      <button 
                        onClick={() => renameCategory(cat as string)}
                        className="text-xs text-blue-600 hover:underline tracking-widest uppercase"
                      >
                        ✏️ Renombrar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {menuItems.filter(item => (item.category || "Destacados") === cat).map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-100">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-zinc-500">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingMenuItem(item)}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors"
                              title="Editar Plato"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => deleteMenuItem(item.id)}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar Plato"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MODAL EDITAR PLATO */}
            {editingMenuItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingMenuItem(null)}></div>
                <div className="relative bg-white w-full max-w-lg shadow-2xl flex flex-col">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h2 className="font-light text-xl tracking-wide uppercase">Editar Plato</h2>
                    <button onClick={() => setEditingMenuItem(null)} className="text-zinc-400 hover:text-zinc-900 text-2xl font-light">&times;</button>
                  </div>
                  
                  <form onSubmit={saveEditedMenuItem} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Nombre</label>
                        <input name="name" defaultValue={editingMenuItem.name} type="text" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Precio ($)</label>
                        <input name="price" defaultValue={editingMenuItem.price} type="number" step="0.01" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Categoría</label>
                      <input 
                        name="category"
                        list="edit-category-list"
                        defaultValue={editingMenuItem.category || "Destacados"}
                        required
                        className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-white"
                      />
                      <datalist id="edit-category-list">
                        {uniqueCategories.map(cat => (
                          <option key={cat as string} value={cat as string} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Descripción</label>
                      <textarea name="description" defaultValue={editingMenuItem.description} required rows={3} className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors resize-none"></textarea>
                    </div>
                    
                    <p className="text-xs text-zinc-400 italic">Nota: Para cambiar la foto o el modelo 3D, debes borrar el plato y crearlo de nuevo.</p>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-all disabled:opacity-50"
                    >
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
