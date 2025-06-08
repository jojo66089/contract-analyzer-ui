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
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Ignore the log4js critical dependency warning
    config.ignoreWarnings = [
      { module: /node_modules\/log4js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];
    
    // Exclude canvas and other binary modules from webpack processing
    config.externals = [...(config.externals || []), { 
      canvas: 'canvas',
      'canvas.node': 'canvas.node',
      'pdfjs-dist': 'pdfjs-dist'
    }];
    
    return config;
  },
  serverExternalPackages: ['docx', 'canvas'],
  env: {
    HF_MODEL_ID: process.env.HF_MODEL_ID,
  },
}

export default nextConfig
