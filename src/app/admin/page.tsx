"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Agregar Plato</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Volver al menú
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Plato</label>
            <input 
              name="name" 
              type="text" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Ej. Hamburguesa Doble"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea 
              name="description" 
              required 
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Breve descripción del plato..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio ($)</label>
            <input 
              name="price" 
              type="number" 
              step="0.01"
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="12.99"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escala 3D (Ej: 0.1 para achicar, 1 para original)</label>
            <input 
              name="scale" 
              type="number" 
              step="0.01"
              defaultValue="1"
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modelo 3D (Android/Web - .glb)</label>
              <input 
                name="glb" 
                type="file" 
                accept=".glb"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modelo 3D (iOS - .usdz) [Opcional]</label>
              <input 
                name="usdz" 
                type="file" 
                accept=".usdz"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-blue-300"
          >
            {loading ? "Guardando..." : "Guardar Plato"}
          </button>
        </form>
      </div>
    </div>
  );
}
