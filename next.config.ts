import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [],
  allowedDevOrigins: ["192.168.1.40", "localhost:3000", "loca.lt", "*.loca.lt"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/corta-la-fruta',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*.glb',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          }
        ],
      },
    ]
  },
};

export default nextConfig;
