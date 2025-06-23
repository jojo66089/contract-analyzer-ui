/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },
  
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }
    
    // Configure pdfjs-dist for server-side usage
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false, // Disable canvas for server-side
        '@napi-rs/canvas': false, // Disable napi-rs canvas for server-side
      }
      
      // Configure externals for server-side PDF processing
      config.externals = config.externals || []
      config.externals.push({
        'canvas': 'canvas',
        '@napi-rs/canvas': '@napi-rs/canvas',
        'pdfjs-dist/build/pdf.worker.js': 'commonjs pdfjs-dist/build/pdf.worker.js'
      })
      
      // Ignore canvas-related warnings in server-side builds
      config.ignoreWarnings = [
        /Cannot find module '@napi-rs\/canvas'/,
        /Cannot polyfill `DOMMatrix`/,
        /Cannot polyfill `ImageData`/,
        /Cannot polyfill `Path2D`/,
      ]
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        radix: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'radix',
          chunks: 'all',
        },
      }
    }
    
    return config
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
    HF_MODEL_ID: process.env.HF_MODEL_ID,
    USE_GRADIO_SPACE: process.env.USE_GRADIO_SPACE,
    GRADIO_SPACE_URL: process.env.GRADIO_SPACE_URL,
  },
}

module.exports = nextConfig 