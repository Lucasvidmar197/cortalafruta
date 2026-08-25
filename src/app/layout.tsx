import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Corta la Fruta | Frutería & Bar Saludable - Quilmes",
  description: "Lo fresco, lo rico y lo simple, en un solo lugar. Vasos de fruta, ensaladas 100% naturales, yogur con granola y oats en Quilmes. Pedí directo por WhatsApp.",
  keywords: ["fruta fresca", "quilmes", "corta la fruta", "ensalada de frutas", "bar saludable", "delicias naturales"],
  authors: [{ name: "Vidrro Engineering" }],
  openGraph: {
    title: "Corta la Fruta | Frutería & Bar Saludable - Quilmes",
    description: "Lo fresco, lo rico y lo simple, en un solo lugar.",
    siteName: "Corta la Fruta",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <Script 
          type="module" 
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans bg-[#FAF9F6] text-zinc-900 min-h-screen selection:bg-rose-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
