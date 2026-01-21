import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de bundle
  experimental: {
    // Optimizar imports de paquetes grandes
    optimizePackageImports: ['lucide-react', 'date-fns', 'react-datepicker'],
  },
  
  // Comprimir respuestas
  compress: true,
  
  // Optimizar imágenes automáticamente
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
