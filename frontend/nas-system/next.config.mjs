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
  // Adjust optimization settings with correct types
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
}

export default nextConfig
