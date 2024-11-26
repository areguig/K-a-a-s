/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only run this on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        perf_hooks: false
      };
    }
    return config;
  },
  // Add CORS configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*'
      }
    ];
  },
  // Disable React strict mode for development
  reactStrictMode: false,
  // Configure compiler options
  compiler: {
    // Enable styled-components
    styledComponents: true,
  }
};

module.exports = nextConfig;
