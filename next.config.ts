import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-hot-toast': path.resolve(__dirname, 'node_modules/react-hot-toast'),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/sportsdb/:path*',
        destination: 'https://www.thesportsdb.com/api/v1/json/3/:path*',
      },
    ];
  },
};

export default nextConfig;
