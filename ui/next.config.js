/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'export',
  experimental: {
    optimizePackageImports: ['@monaco-editor/react']
  },
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
