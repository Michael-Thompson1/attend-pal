import type { NextConfig } from "next";

// The face check loads its model weights from disk at runtime, which the file
// tracer cannot see. Without these globs, Vercel deploys the routes without the
// models and every face check fails.
const FACE_MODEL_WEIGHTS = [
  "./node_modules/@vladmandic/face-api/model/ssd_mobilenetv1_model*",
  "./node_modules/@vladmandic/face-api/model/face_landmark_68_model*",
  "./node_modules/@vladmandic/face-api/model/face_recognition_model*",
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    cpus: 1,
  },
  // Every route that reads a photo: live check-in, roster photo import, the
  // check-photos diagnostic, and the classes page server actions.
  outputFileTracingIncludes: {
    "/api/attend": FACE_MODEL_WEIGHTS,
    "/api/classes/check-photos": FACE_MODEL_WEIGHTS,
    "/api/classes/import": FACE_MODEL_WEIGHTS,
    "/classes": FACE_MODEL_WEIGHTS,
    "/api/face-selftest": FACE_MODEL_WEIGHTS,
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
