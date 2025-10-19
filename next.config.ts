import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel поддерживает серверные функции - убрали статический экспорт
  // Убрали basePath - будет свой домен на Vercel
  
  images: {
    unoptimized: true,
  },
  
  // Оптимизации
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Игнорируем TypeScript ошибки при сборке
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Игнорируем ESLint ошибки при сборке
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Оптимизация бандла
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  
  // Отключаем генерацию source maps в production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
