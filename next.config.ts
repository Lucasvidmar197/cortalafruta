import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [],
  allowedDevOrigins: ["192.168.1.40", "localhost:3000", "loca.lt", "*.loca.lt"],
};

export default nextConfig;
