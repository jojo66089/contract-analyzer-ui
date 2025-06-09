/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle native modules like canvas and PDF workers
    if (isServer) {
      config.externals.push({
        'canvas': 'commonjs canvas',
        'pdf-parse': 'commonjs pdf-parse',
      });
    }

    // Handle PDF.js worker files
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.min.js',
    };

    // Add fallbacks for Node.js modules in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
    };

    // Ignore the log4js critical dependency warning
    config.ignoreWarnings = [
      { module: /node_modules\/log4js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];
    
    // Exclude canvas and other binary modules from webpack processing
    config.externals = [...(config.externals || []), { 
      canvas: 'canvas',
      'canvas.node': 'canvas.node',
      'pdfjs-dist': 'pdfjs-dist',
      'tesseract.js-core': 'tesseract.js-core'
    }];
    
    return config;
  },
  serverExternalPackages: ['canvas', 'pdf-parse', 'tesseract.js'],
  env: {
    HF_MODEL_ID: process.env.HF_MODEL_ID,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/pdf.worker.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
}

export default nextConfig
