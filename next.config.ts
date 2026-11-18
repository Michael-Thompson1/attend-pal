import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    cpus: 1,
  },
  // The face check loads its model weights from disk at runtime, which the file
  // tracer cannot see. Without this, Vercel deploys /api/attend without the
  // models and every face check fails.
  outputFileTracingIncludes: {
    "/api/attend": [
      "./node_modules/@vladmandic/face-api/model/ssd_mobilenetv1_model*",
      "./node_modules/@vladmandic/face-api/model/face_landmark_68_model*",
      "./node_modules/@vladmandic/face-api/model/face_recognition_model*",
    ],
    "/api/classes/check-photos": [
      "./node_modules/@vladmandic/face-api/model/ssd_mobilenetv1_model*",
      "./node_modules/@vladmandic/face-api/model/face_landmark_68_model*",
      "./node_modules/@vladmandic/face-api/model/face_recognition_model*",
    ],
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
