/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['canvas', 'pdf2pic'],
  experimental: {
    // Add any other experimental features here if needed
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('canvas')
    }
    return config
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Remove standalone output for Vercel compatibility
  // Ensure proper API route handling
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig 