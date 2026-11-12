/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    outputFileTracingIncludes: {
      '/api/**': ['./prisma/dev.db'],
      '/**': ['./prisma/dev.db'],
    },
  },
};

export default nextConfig;
