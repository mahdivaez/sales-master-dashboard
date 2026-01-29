import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('aws4');
    }
    return config;
  },
  // In Next.js 16, Turbopack is enabled by default.
  // To silence the error when using a custom webpack config, 
  // we must provide an empty turbopack config object.
  // The key is 'experimental.turbopack' in Next.js 16.
  experimental: {
    turbopack: {}
  }
};

export default nextConfig;
