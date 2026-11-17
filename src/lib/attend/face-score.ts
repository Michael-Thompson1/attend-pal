import { decode as decodeJpeg } from "jpeg-js";
import path from "path";
import { createRequire } from "module";

/**
 * Likeness uses the roster photo and the SSD face model.
 * 50% or higher is marked present.
 * 40–49% is sent to the lecturer.
 * Under 40% is rejected.
 */
export const LIVENESS_PASS = 0.15;
export const MATCH_PASS = 0.5;
export const MATCH_REVIEW = 0.4;

export type FaceDecision = "verified" | "review" | "reject" | "unscored";

export type FaceScore = {
  decision: FaceDecision;
  liveness: number;
  match: number | null;
  evidence: Buffer | null;
  reason: "ok" | "no_reference" | "no_face" | "low_liveness" | "low_match" | "mismatch";
};

type Landmarks = { getLeftEye: () => Point[]; getRightEye: () => Point[] };
type Point = { x: number; y: number };
type FaceHit = { descriptor: Float32Array; landmarks: Landmarks; detection: { box: { width: number; height: number } } };

let models: Promise<{
  detect: (tensor: unknown) => Promise<FaceHit[]>;
  tensor: (data: Uint8Array, shape: [number, number, number]) => { dispose: () => void; shape: number[] };
  resize: (tensor: { dispose: () => void; shape: number[] }, size: [number, number]) => { dispose: () => void; shape: number[] };
}> | null = null;

type FaceRuntime = {
  tf: {
    getBackend: () => string;
    setBackend: (name: string) => Promise<boolean>;
    ready: () => Promise<void>;
    tensor3d: (
      data: Uint8Array,
      shape: [number, number, number],
      dtype: string,
    ) => { dispose: () => void; shape: number[] };
    image: {
      resizeBilinear: (
        tensor: { dispose: () => void; shape: number[] },
        size: [number, number],
        alignCorners: boolean,
      ) => { dispose: () => void; shape: number[] };
    };
  };
  env: {
    createFileSystem: (fs: {
      readFile: (path: string, callback: (error: Error | null, data: Buffer) => void) => void;
    }) => { readFile: (path: string) => Promise<Buffer> };
    monkeyPatch: (patch: { readFile: (path: string) => Promise<Buffer> }) => void;
  };
  nets: {
    ssdMobilenetv1: { loadFromDisk: (dir: string) => Promise<void> };
    faceLandmark68Net: { loadFromDisk: (dir: string) => Promise<void> };
    faceRecognitionNet: { loadFromDisk: (dir: string) => Promise<void> };
  };
  SsdMobilenetv1Options: new (options?: { minConfidence?: number; maxResults?: number }) => unknown;
  detectAllFaces: (
    tensor: unknown,
    options: unknown,
  ) => { withFaceLandmarks: () => { withFaceDescriptors: () => Promise<FaceHit[]> } };
};

function loadModels() {
  if (!models) {
    models = (async () => {
      const host = globalThis as { window?: { document: object } };
      const hadWindow = host.window !== undefined;
      if (!hadWindow) host.window = { document: {} };
      let faceapi: FaceRuntime;
      try {
        faceapi = (await import("@vladmandic/face-api/dist/face-api.esm.js")) as unknown as FaceRuntime;
      } finally {
        if (!hadWindow) delete host.window;
      }
      const fs = await import("node:fs");
      faceapi.env.monkeyPatch({ readFile: faceapi.env.createFileSystem(fs).readFile });
      const tf = faceapi.tf;
      if (tf.getBackend() !== "cpu") await tf.setBackend("cpu");
      await tf.ready();
      const require = createRequire(path.join(process.cwd(), "package.json"));
      const modelDir = path.join(path.dirname(require.resolve("@vladmandic/face-api/package.json")), "model");
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25, maxResults: 2 });
      return {
        detect: (tensor: unknown) =>
          faceapi.detectAllFaces(tensor, options).withFaceLandmarks().withFaceDescriptors(),
        tensor: (data: Uint8Array, shape: [number, number, number]) => tf.tensor3d(data, shape, "int32"),
        resize: (tensor: { dispose: () => void; shape: number[] }, size: [number, number]) =>
          tf.image.resizeBilinear(tensor, size, false),
      };
    })().catch((error) => {
      models = null;
      throw error;
    });
  }
  return models;
}

function eyeAspect(eye: Point[]) {
  const span = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const width = span(eye[0], eye[3]);
  if (width === 0) return 0;
  return (span(eye[1], eye[5]) + span(eye[2], eye[4])) / (2 * width);
}

function largest(faces: FaceHit[]) {
  return faces.reduce((best, face) => {
    const area = face.detection.box.width * face.detection.box.height;
    const bestArea = best.detection.box.width * best.detection.box.height;
    return area > bestArea ? face : best;
  });
}

function similarity(distance: number) {
  return Math.max(0, Math.min(1, 1 - distance / 1.2));
}

function descriptorDistance(left: Float32Array, right: Float32Array) {
  let sum = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

function jpegOrientation(bytes: Buffer) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) return 1;
    const size = bytes.readUInt16BE(offset + 2);
    if (marker === 0xe1 && size > 14 && bytes.toString("ascii", offset + 4, offset + 8) === "Exif") {
      return tiffOrientation(bytes.subarray(offset + 10, offset + 2 + size));
    }
    offset += 2 + size;
  }
  return 1;
}

function tiffOrientation(tiff: Buffer) {
  if (tiff.length < 8) return 1;
  const little = tiff.toString("ascii", 0, 2) === "II";
  const read16 = (at: number) => (little ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at));
  const read32 = (at: number) => (little ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at));
  if (read16(2) !== 42) return 1;
  let offset = read32(4);
  if (offset + 2 > tiff.length) return 1;
  const count = read16(offset);
  offset += 2;
  for (let index = 0; index < count; index += 1) {
    const entry = offset + index * 12;
    if (entry + 8 > tiff.length) return 1;
    if (read16(entry) === 0x0112) {
      const value = read16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

function orientedRgba(data: Uint8Array, width: number, height: number, orientation: number) {
  if (orientation === 1) return { data, width, height };
  const swap = orientation >= 5;
  const outWidth = swap ? height : width;
  const outHeight = swap ? width : height;
  const out = new Uint8Array(outWidth * outHeight * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let nextX = x;
      let nextY = y;
      if (orientation === 2) nextX = width - 1 - x;
      else if (orientation === 3) {
        nextX = width - 1 - x;
        nextY = height - 1 - y;
      } else if (orientation === 4) nextY = height - 1 - y;
      else if (orientation === 5) {
        nextX = y;
        nextY = x;
      } else if (orientation === 6) {
        nextX = height - 1 - y;
        nextY = x;
      } else if (orientation === 7) {
        nextX = height - 1 - y;
        nextY = width - 1 - x;
      } else if (orientation === 8) {
        nextX = y;
        nextY = width - 1 - x;
      }
      const from = (y * width + x) * 4;
      const to = (nextY * outWidth + nextX) * 4;
      out[to] = data[from];
      out[to + 1] = data[from + 1];
      out[to + 2] = data[from + 2];
      out[to + 3] = data[from + 3];
    }
  }
  return { data: out, width: outWidth, height: outHeight };
}

async function readFace(bytes: Buffer, engine: Awaited<ReturnType<typeof loadModels>>) {
  const decoded = decodeJpeg(bytes, { useTArray: true, formatAsRGBA: true });
  const upright = orientedRgba(decoded.data, decoded.width, decoded.height, jpegOrientation(bytes));
  const rgb = new Uint8Array(upright.width * upright.height * 3);
  for (let source = 0, target = 0; source < upright.data.length; source += 4) {
    rgb[target] = upright.data[source];
    rgb[target + 1] = upright.data[source + 1];
    rgb[target + 2] = upright.data[source + 2];
    target += 3;
  }
  let tensor = engine.tensor(rgb, [upright.height, upright.width, 3]);
  const longest = Math.max(upright.width, upright.height);
  if (longest > 800) {
    const scale = 800 / longest;
    const resized = engine.resize(tensor, [Math.round(upright.height * scale), Math.round(upright.width * scale)]);
    tensor.dispose();
    tensor = resized;
  }
  try {
    const faces = await engine.detect(tensor);
    if (faces.length === 0) return null;
    const face = largest(faces);
    const aspect = (eyeAspect(face.landmarks.getLeftEye()) + eyeAspect(face.landmarks.getRightEye())) / 2;
    return { aspect, descriptor: face.descriptor };
  } finally {
    tensor.dispose();
  }
}

export async function scoreCheckInFaces(frames: Buffer[], reference: Buffer | null): Promise<FaceScore> {
  const engine = await loadModels();
  const sample = frames.length > 3 ? [frames[0], frames[Math.floor(frames.length / 2)], frames[frames.length - 1]] : frames;
  const seen: Array<{ aspect: number; descriptor: Float32Array; bytes: Buffer }> = [];
  for (const frame of sample) {
    const face = await readFace(frame, engine);
    if (face) seen.push({ ...face, bytes: frame });
  }
  if (seen.length === 0) {
    return { decision: "reject", liveness: 0, match: null, evidence: frames[0] ?? null, reason: "no_face" };
  }

  const open = Math.max(...seen.map((face) => face.aspect));
  const closed = Math.min(...seen.map((face) => face.aspect));
  const liveness = seen.length < 2 ? 0 : Math.max(0, Math.min(1, (open - closed) / 0.14));
  const clearest = seen.reduce((best, face) => (face.aspect > best.aspect ? face : best));

  if (!reference) {
    return { decision: "review", liveness, match: null, evidence: clearest.bytes, reason: "no_reference" };
  }

  const roster = await readFace(reference, engine);
  if (!roster) {
    return { decision: "review", liveness, match: null, evidence: clearest.bytes, reason: "no_reference" };
  }

  const match = Math.max(...seen.map((face) => similarity(descriptorDistance(face.descriptor, roster.descriptor))));

  if (match >= MATCH_PASS) {
    return { decision: "verified", liveness, match, evidence: null, reason: "ok" };
  }
  if (match >= MATCH_REVIEW) {
    return { decision: "review", liveness, match, evidence: clearest.bytes, reason: "low_match" };
  }
  return {
    decision: "reject",
    liveness,
    match,
    evidence: clearest.bytes,
    reason: "mismatch",
  };
}
