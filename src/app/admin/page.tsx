"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"cocina" | "menu" | "salon" | "caja">("cocina");
  
  // Billing States
  const [billingTable, setBillingTable] = useState<any>(null);
  const [customChargeName, setCustomChargeName] = useState("");
  const [customChargePrice, setCustomChargePrice] = useState("");

  // Realtime States
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  
  // Modals States
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  
  // Salon States
  const [searchTable, setSearchTable] = useState("");
  const [editingTable, setEditingTable] = useState<any>(null);
  const [printingTable, setPrintingTable] = useState<any>(null);

  const fetchData = async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: reqData } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
    const { data: menuData } = await supabase.from('menu_items').select('*').order('created_at', { ascending: true });
    const { data: tablesData } = await supabase.from('tables').select('*').order('name', { ascending: true });
    
    if (ordersData) setOrders(ordersData);
    if (reqData) setRequests(reqData);
    if (menuData) setMenuItems(menuData);
    if (tablesData) setTables(tablesData);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAuthenticated(true);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    // Intentamos usar Realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchData())
      .subscribe();

    // PLAN B: Recargar automáticamente cada 3 segundos por si Realtime no está activado en Supabase
    const intervalId = setInterval(() => {
      fetchData();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);
    if (error) {
      setAuthError("Correo o contraseña incorrectos");
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // =========================================================================
  // COCINA Y SALON LOGIC
  // =========================================================================

  const updateOrderStatus = async (id: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    fetchData(); // Recarga instantánea
  };

  const resolveRequest = async (id: string) => {
    await supabase.from('service_requests').update({ status: 'Resuelto' }).eq('id', id);
    fetchData(); // Recarga instantánea
  };

  const handleEditQuantity = (itemId: string, delta: number) => {
    setEditingOrder((prev: any) => {
      if (!prev) return prev;
      const newItems = prev.items.map((item: any) => {
        if (item.id === itemId) return { ...item, quantity: Math.max(0, item.quantity + delta) };
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
    for (const img of imageFiles) if (img.size > 0) uploadData.append("images", img);

    try {
      let uploadedFiles: { glb?: string; usdz?: string; images?: string[] } = {};

      if ((glb && glb.size > 0) || (usdz && usdz.size > 0) || imageFiles.some(f => f.size > 0)) {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        if (!uploadRes.ok) throw new Error("File upload failed");
        uploadedFiles = await uploadRes.json();
      }

      const menuRes = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, price: parseFloat(price), category: category || "Destacados",
          scale: 1, glbUrl: uploadedFiles.glb || "", usdzUrl: uploadedFiles.usdz || "",
          imageUrls: uploadedFiles.images || [],
        }),
      });

      if (!menuRes.ok) throw new Error("Failed to save menu item");
      alert("Plato agregado exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchData();
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
      fetchData();
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
        name, description, price: parseFloat(price), category: category || "Destacados"
      }).eq('id', editingMenuItem.id);
      setEditingMenuItem(null);
      fetchData();
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
      fetchData();
    }
  };

  // =========================================================================
  // GESTION DE MESAS (SALON) LOGIC
  // =========================================================================

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 2;
    
    try {
      await supabase.from('tables').insert({ name, capacity, status: 'Libre' });
      (e.target as HTMLFormElement).reset();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al crear la mesa");
    } finally {
      setLoading(false);
    }
  };

  const saveEditedTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const capacity = parseInt(formData.get("capacity") as string) || 2;
      
      await supabase.from('tables').update({ name, capacity }).eq('id', editingTable.id);
      setEditingTable(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la mesa");
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (id: string, newStatus: string) => {
    await supabase.from('tables').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const deleteTable = async (id: string) => {
    if (confirm("¿Borrar esta mesa? Se perderá su código QR.")) {
      await supabase.from('tables').delete().eq('id', id);
      fetchData();
    }
  };

  // =========================================================================
  // BILLING / CAJA LOGIC
  // =========================================================================
  
  const handleAddCustomCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingTable || !customChargeName || !customChargePrice) return;
    setLoading(true);
    
    const price = parseFloat(customChargePrice);
    const itemJson = [{ id: 'custom-' + Date.now(), name: customChargeName, quantity: 1, price: price }];
    
    await supabase.from('orders').insert({
      table_number: billingTable.name,
      items: itemJson,
      total: price,
      status: 'Entregado' // Ya entregado, no pasa por cocina
    });
    
    setCustomChargeName("");
    setCustomChargePrice("");
    fetchData();
    setLoading(false);
  };

  const handleCheckout = async () => {
    if (!billingTable) return;
    if (!confirm(`¿Cerrar la mesa ${billingTable.name} y marcar todo como Pagado?`)) return;
    setLoading(true);
    
    // 1. Mark orders as Pagado
    const tableOrders = orders.filter(o => o.table_number === billingTable.name && o.status !== 'Pagado');
    for (const order of tableOrders) {
      await supabase.from('orders').update({ status: 'Pagado' }).eq('id', order.id);
    }
    
    // 2. Clear table requests
    const tableRequests = requests.filter(r => r.table_number === billingTable.name && r.status !== 'Resuelto');
    for (const req of tableRequests) {
      await supabase.from('service_requests').update({ status: 'Resuelto' }).eq('id', req.id);
    }
    
    // 3. Set table to Libre
    await supabase.from('tables').update({ status: 'Libre' }).eq('id', billingTable.id);
    
    setBillingTable(null);
    fetchData();
    setLoading(false);
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
          {authError && <p className="text-red-500 text-xs mb-4">{authError}</p>}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-500 transition-all mb-4 outline-none text-center tracking-widest text-sm" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-500 transition-all mb-4 outline-none text-center tracking-widest text-sm" />
          <button type="submit" disabled={loading} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-sans text-xs tracking-widest uppercase transition-all disabled:opacity-50">
            {loading ? "Autenticando..." : "Ingresar"}
          </button>
        </form>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'Pendiente');
  const paidOrders = orders.filter(o => o.status === 'Pagado');
  const pendingRequests = requests.filter(r => r.status === 'Pendiente');
  const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category || "Destacados")));
  
  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchTable.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      
      {/* Header Admin */}
      <header className="bg-zinc-900 text-white p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-light tracking-[0.2em] uppercase">L'Atelier</h1>
            <p className="text-zinc-400 text-[10px] tracking-widest uppercase mt-1">Terminal de Administración</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-xs tracking-widest uppercase transition-colors">Ver Menú</Link>
            <button onClick={handleLogout} className="px-4 py-2 border border-red-900/30 text-red-400 hover:bg-red-900/20 text-xs tracking-widest uppercase transition-colors">Salir</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-zinc-200 mb-8 sticky top-[88px] z-30">
        <div className="max-w-6xl mx-auto flex overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab("cocina")} className={`px-6 md:px-8 py-4 text-[10px] md:text-xs tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${activeTab === 'cocina' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            Cocina y Salón
            {(pendingOrders.length > 0 || pendingRequests.length > 0) && (
              <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                {pendingOrders.length + pendingRequests.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("salon")} className={`px-6 md:px-8 py-4 text-[10px] md:text-xs tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${activeTab === 'salon' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            Gestión de Mesas
          </button>
          <button onClick={() => setActiveTab("menu")} className={`px-6 md:px-8 py-4 text-[10px] md:text-xs tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${activeTab === 'menu' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            Gestión de Platos
          </button>
          <button onClick={() => setActiveTab("caja")} className={`px-6 md:px-8 py-4 text-[10px] md:text-xs tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${activeTab === 'caja' ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            Caja e Historial
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* ========================================================================= */}
        {/* TAB 1: COCINA Y SALON */}
        {/* ========================================================================= */}
        {activeTab === "cocina" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ALERTAS */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-4">Alertas de Mesas</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-zinc-400 text-sm italic">No hay llamados pendientes.</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className={`p-5 border-l-4 bg-white shadow-sm flex justify-between items-center ${req.request_type === 'cuenta' ? 'border-green-500' : 'border-red-500'}`}>
                    <div>
                      <p className="text-2xl font-light">{req.table_number}</p>
                      <p className="text-sm font-medium uppercase tracking-wider mt-1">{req.request_type === 'cuenta' ? '🧾 Pide la cuenta' : '🛎️ Llama al mozo'}</p>
                      <p className="text-xs text-zinc-400 mt-2">{new Date(req.created_at).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={() => resolveRequest(req.id)} className="w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">✓</button>
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
                            <span className="bg-zinc-900 text-white text-xs px-2 py-1 tracking-widest uppercase">{order.table_number}</span>
                            <p className="text-xs text-zinc-400 mt-2">{new Date(order.created_at).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500 tracking-widest uppercase">Total</p>
                            <p className="text-lg font-medium">${order.total}</p>
                          </div>
                        </div>
                        <div className="flex-grow space-y-3 mb-6">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col text-sm border-b border-zinc-50 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                              <div className="flex justify-between">
                                <span><span className="font-medium mr-2">{item.quantity}x</span> {item.name}</span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-red-600 mt-1 italic pl-6 flex items-start gap-1">
                                  <span>⚠️</span> {item.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingOrder(order)} className="w-1/3 py-3 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs tracking-widest uppercase transition-colors">✏️ Editar</button>
                          <button onClick={() => updateOrderStatus(order.id, 'Entregado')} className="w-2/3 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-colors">Marcar Servido</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Editar Pedido */}
            {editingOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingOrder(null)}></div>
                <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h2 className="font-light text-xl tracking-wide uppercase">Editar {editingOrder.table_number}</h2>
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
                    <button onClick={saveEditedOrder} className="w-full py-4 bg-zinc-900 text-white font-sans text-xs tracking-widest uppercase hover:bg-zinc-800 transition-colors">Guardar Cambios</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GESTION DE MESAS (SALON) */}
        {/* ========================================================================= */}
        {activeTab === "salon" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Formulario Nueva Mesa */}
              <div className="md:col-span-1 bg-white p-6 border border-zinc-200 shadow-sm self-start sticky top-[160px]">
                <h2 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-6">Agregar Mesa</h2>
                <form onSubmit={handleAddTable} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Nombre / Número</label>
                    <input name="name" type="text" placeholder="Ej: Mesa 1, Barra 3..." required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Capacidad (Personas)</label>
                    <input name="capacity" type="number" defaultValue="2" min="1" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none text-sm" />
                  </div>
                  <p className="text-[10px] text-zinc-400">Si necesitas juntar dos mesas (ej. 1 y 2), simplemente agrega una mesa llamada "Mesa 1+2" y ponle capacidad doble.</p>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-colors">
                    {loading ? "..." : "Crear Mesa"}
                  </button>
                </form>
              </div>

              {/* Lista de Mesas */}
              <div className="md:col-span-2 space-y-6">
                <input 
                  type="text" 
                  placeholder="🔍 Buscar mesa..." 
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-zinc-200 focus:border-zinc-900 outline-none shadow-sm text-sm"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTables.map(table => (
                    <div key={table.id} className={`bg-white border-l-4 p-5 shadow-sm ${
                      table.status === 'Libre' ? 'border-green-500' : 
                      table.status === 'Ocupada' ? 'border-red-500' : 
                      'border-yellow-500'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-light">{table.name}</h3>
                          <p className="text-xs text-zinc-500 tracking-widest uppercase mt-1">Capacidad: {table.capacity}</p>
                        </div>
                        <select 
                          value={table.status}
                          onChange={(e) => updateTableStatus(table.id, e.target.value)}
                          className={`px-3 py-1 text-xs tracking-widest uppercase font-medium rounded-full transition-colors outline-none cursor-pointer appearance-none text-center ${
                            table.status === 'Libre' ? 'bg-green-100 text-green-700' : 
                            table.status === 'Ocupada' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          <option value="Libre">Libre</option>
                          <option value="Ocupada">Ocupada</option>
                          <option value="Reservada">Reservada</option>
                        </select>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
                        {table.status !== 'Libre' && (
                          <button onClick={() => setBillingTable(table)} className="flex-1 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs tracking-widest uppercase transition-colors">💳 Cuenta</button>
                        )}
                        <button onClick={() => setPrintingTable(table)} className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs tracking-widest uppercase transition-colors">🖨️ QR</button>
                        <button onClick={() => setEditingTable(table)} className="w-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 transition-colors">✏️</button>
                        <button onClick={() => deleteTable(table.id)} className="w-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {filteredTables.length === 0 && <p className="text-zinc-500 italic col-span-2">No se encontraron mesas.</p>}
                </div>
              </div>

            </div>

            {/* Modal Imprimir QR */}
            {printingTable && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-100">
                <div className="bg-white p-10 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
                  <h2 className="text-2xl font-light tracking-wide uppercase mb-2">Escanea para ordenar</h2>
                  <p className="text-sm font-medium tracking-widest uppercase text-zinc-500 mb-8 border-b border-zinc-200 pb-4 w-full">
                    {printingTable.name}
                  </p>
                  
                  <div className="bg-white p-4 border border-zinc-200 mb-8" id="qr-print-area">
                    <QRCodeSVG 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?mesa=${encodeURIComponent(printingTable.name)}`}
                      size={200}
                      level={"H"}
                    />
                  </div>

                  <div className="flex gap-4 w-full">
                    <button onClick={() => setPrintingTable(null)} className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-xs tracking-widest uppercase">Volver</button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase">🖨️ Imprimir</button>
                  </div>
                  
                  <style jsx global>{`
                    @media print {
                      body * { visibility: hidden; }
                      #qr-print-area, #qr-print-area *, h2, p { visibility: visible; }
                      #qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border: none; }
                      h2 { position: absolute; left: 0; right: 0; text-align: center; top: 10%; }
                      p { position: absolute; left: 0; right: 0; text-align: center; top: 18%; }
                    }
                  `}</style>
                </div>
              </div>
            )}

            {/* Modal Editar Mesa */}
            {editingTable && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingTable(null)}></div>
                <div className="relative bg-white w-full max-w-sm shadow-2xl p-6">
                  <h2 className="font-light text-xl tracking-wide uppercase mb-6">Editar Mesa</h2>
                  <form onSubmit={saveEditedTable} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Nombre / Número</label>
                      <input name="name" defaultValue={editingTable.name} required type="text" className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Capacidad</label>
                      <input name="capacity" defaultValue={editingTable.capacity} required type="number" min="1" className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setEditingTable(null)} className="flex-1 py-3 border border-zinc-200 text-xs tracking-widest uppercase">Cancelar</button>
                      <button type="submit" disabled={loading} className="flex-1 py-3 bg-zinc-900 text-white text-xs tracking-widest uppercase">Guardar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Facturación (Ver Cuenta) */}
            {billingTable && (() => {
              const tableOrders = orders.filter(o => o.table_number === billingTable.name && o.status !== 'Pagado');
              const allItems = tableOrders.flatMap(o => o.items);
              const totalAmount = tableOrders.reduce((sum, o) => sum + Number(o.total), 0);

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBillingTable(null)}></div>
                  <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                      <div>
                        <h2 className="font-light text-xl tracking-wide uppercase">Cuenta</h2>
                        <p className="text-xs text-zinc-500 tracking-widest uppercase mt-1">{billingTable.name}</p>
                      </div>
                      <button onClick={() => setBillingTable(null)} className="text-zinc-400 hover:text-zinc-900 text-2xl font-light">&times;</button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-grow">
                      {allItems.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">No hay consumos registrados para esta mesa.</p>
                      ) : (
                        <div className="space-y-4">
                          {allItems.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm border-b border-zinc-50 pb-2">
                              <div>
                                <span className="font-medium mr-2">{item.quantity}x</span>
                                <span>{item.name}</span>
                              </div>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Formulario de Cargo Extra */}
                      <form onSubmit={handleAddCustomCharge} className="mt-8 pt-6 border-t border-zinc-200">
                        <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-4">Agregar Cargo Extra</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Ej: Servicio de Mesa" 
                            value={customChargeName}
                            onChange={(e) => setCustomChargeName(e.target.value)}
                            className="flex-grow px-3 py-2 border border-zinc-200 text-sm outline-none focus:border-zinc-400"
                          />
                          <input 
                            type="number" 
                            placeholder="$ 0.00" 
                            step="0.01"
                            value={customChargePrice}
                            onChange={(e) => setCustomChargePrice(e.target.value)}
                            className="w-24 px-3 py-2 border border-zinc-200 text-sm outline-none focus:border-zinc-400"
                          />
                          <button type="submit" disabled={!customChargeName || !customChargePrice || loading} className="px-4 bg-zinc-100 hover:bg-zinc-200 text-xs tracking-widest uppercase transition-colors disabled:opacity-50">
                            Añadir
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="p-6 border-t border-zinc-100 bg-zinc-50">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium uppercase tracking-widest text-zinc-500">Total a Pagar</span>
                        <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={handleCheckout} 
                        disabled={loading || totalAmount === 0}
                        className="w-full py-4 bg-zinc-900 text-white font-sans text-xs tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50 flex justify-center items-center h-[52px]"
                      >
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Cobrar y Liberar Mesa"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GESTION DE MENU */}
        {/* ========================================================================= */}
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
                  <input name="category" list="category-list" required placeholder="Ej. Destacados, Entradas, Pizzas..." className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-white" />
                  <datalist id="category-list">
                    {uniqueCategories.map(cat => <option key={cat as string} value={cat as string} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Descripción</label>
                  <textarea name="description" required rows={3} className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none transition-colors resize-none"></textarea>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-100">
                  <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-900 mb-4">Fotos y Modelos 3D</h3>
                  <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 border-dashed">
                    <label className="block text-xs font-medium text-zinc-700 mb-2">Fotos Normales (Varias)</label>
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
                <button type="submit" disabled={loading} className="w-full py-4 mt-8 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-all disabled:opacity-50">
                  {loading ? "Subiendo..." : "Publicar Plato"}
                </button>
              </form>
            </div>

            {/* LISTA DE PLATOS */}
            <div className="space-y-8">
              {uniqueCategories.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">No hay platos en el menú.</p>
              ) : (
                uniqueCategories.map(cat => (
                  <div key={cat as string} className="bg-white border border-zinc-200 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-2">
                      <h3 className="text-lg font-light tracking-widest uppercase">{cat as string}</h3>
                      <button onClick={() => renameCategory(cat as string)} className="text-xs text-blue-600 hover:underline tracking-widest uppercase">✏️ Renombrar</button>
                    </div>
                    <div className="space-y-4">
                      {menuItems.filter(item => (item.category || "Destacados") === cat).map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-100">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-zinc-500">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingMenuItem(item)} className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-100" title="Editar">✏️</button>
                            <button onClick={() => deleteMenuItem(item.id)} className="w-8 h-8 flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-50" title="Eliminar">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Editar Plato */}
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
                        <input name="name" defaultValue={editingMenuItem.name} type="text" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Precio ($)</label>
                        <input name="price" defaultValue={editingMenuItem.price} type="number" step="0.01" required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Categoría</label>
                      <input name="category" list="edit-category-list" defaultValue={editingMenuItem.category || "Destacados"} required className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none bg-white" />
                      <datalist id="edit-category-list">
                        {uniqueCategories.map(cat => <option key={cat as string} value={cat as string} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">Descripción</label>
                      <textarea name="description" defaultValue={editingMenuItem.description} required rows={3} className="w-full px-4 py-3 border border-zinc-200 focus:border-zinc-900 outline-none resize-none"></textarea>
                    </div>
                    <p className="text-xs text-zinc-400 italic">Nota: Para cambiar foto/modelo 3D, borra el plato y créalo de nuevo.</p>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs tracking-widest uppercase transition-all disabled:opacity-50">
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CAJA E HISTORIAL */}
        {/* ========================================================================= */}
        {activeTab === "caja" && (
          <div className="space-y-8">
            <div className="bg-zinc-900 text-white p-8 flex justify-between items-center shadow-lg">
              <div>
                <h2 className="text-sm tracking-widest uppercase font-medium opacity-80 mb-1">Total Ingresos</h2>
                <p className="text-4xl font-light">
                  ${paidOrders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm tracking-widest uppercase font-medium opacity-80 mb-1">Órdenes Pagadas</p>
                <p className="text-2xl font-light">{paidOrders.length}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm tracking-widest uppercase font-medium border-b border-zinc-200 pb-2 mb-6">Historial de Ventas</h3>
              {paidOrders.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">No hay ventas registradas.</p>
              ) : (
                <div className="space-y-4">
                  {paidOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(order => (
                    <div key={order.id} className="bg-white border border-zinc-200 p-6 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 tracking-widest uppercase font-medium">Pagado</span>
                          <span className="text-sm font-medium">{order.table_number}</span>
                          <span className="text-xs text-zinc-400">{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-zinc-600">
                          {order.items.map((item: any, i: number) => (
                            <span key={i}>
                              {item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-1">Total Cobrado</p>
                        <p className="text-xl font-medium">${Number(order.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
