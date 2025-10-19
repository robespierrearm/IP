import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel оптимизации
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Оптимизации
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Оптимизация компилятора
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
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
