/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Support for subdomains - handled by middleware instead
  skipTrailingSlashRedirect: true,
  
  // Headers configuration for both development and production
  headers: async () => {
    const headers = [];

    // Development: disable caching
    if (process.env.NODE_ENV === 'development') {
      headers.push({
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      });
    }

    // Production: security headers (migrated from Vercel)
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      });
    }

    return headers;
  },

  // Redirects (migrated from Vercel)
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
  ],
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\/__tests__\//,
      })
    );

    // Handle Turnkey and other web3 modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Handle problematic modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        "@turnkey/http": "commonjs @turnkey/http",
        "@turnkey/solana": "commonjs @turnkey/solana",
        "@turnkey/viem": "commonjs @turnkey/viem",
      });
    }

    // Handle Solana dependencies
    config.externals["@solana/web3.js"] = "commonjs @solana/web3.js";
    config.externals["@solana/spl-token"] = "commonjs @solana/spl-token";

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
