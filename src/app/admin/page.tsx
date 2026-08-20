"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta. (Usa: admin123)");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    
    const uploadData = new FormData();
    const glb = formData.get("glb") as File;
    const usdz = formData.get("usdz") as File;
    
    if (glb && glb.size > 0) uploadData.append("glb", glb);
    if (usdz && usdz.size > 0) uploadData.append("usdz", usdz);

    try {
      let uploadedFiles: { glb?: string; usdz?: string } = {};

      if ((glb && glb.size > 0) || (usdz && usdz.size > 0)) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
        uploadedFiles = await uploadRes.json();
      }

      const menuRes = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          scale: parseFloat(formData.get("scale") as string) || 1,
          glbUrl: uploadedFiles.glb || "",
          usdzUrl: uploadedFiles.usdz || "",
        }),
      });

      if (!menuRes.ok) throw new Error("Failed to save menu item");

      alert("Plato agregado exitosamente");
      (e.target as HTMLFormElement).reset();
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el plato.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-slate-100">
          <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Panel de Control</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa para administrar el menú</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all mb-4 outline-none"
          />
          <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
            Ingresar
          </button>
          <p className="text-xs text-slate-400 mt-4">Demo password: admin123</p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Agregar Plato Nuevo</h1>
            <p className="text-slate-500 text-sm mt-1">Completa los detalles para publicarlo en el menú AR.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-full transition-colors">
            Ver menú público
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Plato</label>
              <input 
                name="name" 
                type="text" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                placeholder="Ej. Hamburguesa Doble"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Precio ($)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01"
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                placeholder="12.99"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
            <textarea 
              name="description" 
              required 
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
              placeholder="Describe los ingredientes principales..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Escala 3D en AR</label>
            <div className="flex gap-4 items-center">
              <input 
                name="scale" 
                type="number" 
                step="0.01"
                defaultValue="1"
                required 
                className="w-32 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
              <span className="text-sm text-slate-500">Usa 0.1 para reducirlo al 10%, o 1 para tamaño original.</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Archivos 3D (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <label className="block text-sm font-bold text-slate-700 mb-3">Formato Web/Android (.glb)</label>
                <input 
                  name="glb" 
                  type="file" 
                  accept=".glb"
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-orange-100 file:text-orange-600 hover:file:bg-orange-200 transition-all cursor-pointer"
                />
              </div>
              
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <label className="block text-sm font-bold text-slate-700 mb-3">Formato iOS (.usdz)</label>
                <input 
                  name="usdz" 
                  type="file" 
                  accept=".usdz"
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando Plato...
              </span>
            ) : "Publicar Plato en el Menú"}
          </button>
        </form>
      </div>
    </div>
  );
}
