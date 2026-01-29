import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('aws4');
    }
    return config;
  },
  // Next.js 15 uses 'turbo' property in the root of NextConfig, not in experimental
  // However, to force webpack and avoid the Turbopack error in Vercel (which might be defaulting to it)
  // we can also try to ensure we aren't using any turbo-only flags.
  // The error suggests passing --webpack or setting turbopack: {}
  // @ts-ignore - turbopack property exists in NextConfig for Next.js 15
  turbo: {}
};

export default nextConfig;
