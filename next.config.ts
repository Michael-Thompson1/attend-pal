import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    cpus: 1,
  },
  serverExternalPackages: [
    "@tensorflow/tfjs",
    "@tensorflow/tfjs-backend-cpu",
    "@tensorflow/tfjs-core",
    "@vladmandic/face-api",
    "jpeg-js",
  ],
};

export default nextConfig;
