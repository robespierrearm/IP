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
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      'framer-motion',
      'sonner',
      'date-fns'
    ],
  },
  
  // Webpack оптимизации
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Оптимизация bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk для больших библиотек
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Отдельный chunk для framer-motion
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30
            },
            // Отдельный chunk для supabase
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 30
            },
            // Общий chunk для компонентов
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    return config;
  },
  
  // Отключаем генерацию source maps в production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
