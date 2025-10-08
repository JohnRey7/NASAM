/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add this to hide development indicators
  // Adjust optimization settings with correct types
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
  async rewrites() {
    // Use environment variable for backend URL in production
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const baseUrl = backendUrl.replace('/api', '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`, // Dynamic proxy to backend
      },
    ]
  },
}

export default nextConfig