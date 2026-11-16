import { decode as decodeJpeg } from "jpeg-js";
import path from "path";
import { createRequire } from "module";

/**
 * Liveness is how clearly the eyes closed and opened again.
 * 65% is the line that qualifies. A still photo scores near 0%.
 *
 * Face similarity uses the roster photo:
 * 70% or higher can be marked present,
 * 50–69% is sent to the lecturer,
 * under 50% is rejected.
 * Those bands are the ones already written on the alerts table.
 */
export const LIVENESS_PASS = 0.65;
export const MATCH_PASS = 0.7;
export const MATCH_REVIEW = 0.5;

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
    tinyFaceDetector: { loadFromDisk: (dir: string) => Promise<void> };
    faceLandmark68Net: { loadFromDisk: (dir: string) => Promise<void> };
    faceRecognitionNet: { loadFromDisk: (dir: string) => Promise<void> };
  };
  TinyFaceDetectorOptions: new (options: { inputSize: number; scoreThreshold: number }) => unknown;
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
      await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });
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

async function readFace(bytes: Buffer, engine: Awaited<ReturnType<typeof loadModels>>) {
  const decoded = decodeJpeg(bytes, { useTArray: true, formatAsRGBA: true });
  const rgb = new Uint8Array(decoded.width * decoded.height * 3);
  for (let source = 0, target = 0; source < decoded.data.length; source += 4) {
    rgb[target] = decoded.data[source];
    rgb[target + 1] = decoded.data[source + 1];
    rgb[target + 2] = decoded.data[source + 2];
    target += 3;
  }
  let tensor = engine.tensor(rgb, [decoded.height, decoded.width, 3]);
  const longest = Math.max(decoded.width, decoded.height);
  if (longest > 640) {
    const scale = 640 / longest;
    const resized = engine.resize(tensor, [Math.round(decoded.height * scale), Math.round(decoded.width * scale)]);
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
  const seen: Array<{ aspect: number; descriptor: Float32Array; bytes: Buffer }> = [];
  for (const frame of frames) {
    const face = await readFace(frame, engine);
    if (face) seen.push({ ...face, bytes: frame });
  }
  if (seen.length === 0) {
    return { decision: "reject", liveness: 0, match: null, evidence: frames[0] ?? null, reason: "no_face" };
  }
  if (seen.length < 2) {
    const only = seen[0];
    return { decision: "reject", liveness: 0, match: null, evidence: only ? only.bytes : null, reason: "low_liveness" };
  }

  const open = Math.max(...seen.map((face) => face.aspect));
  const closed = Math.min(...seen.map((face) => face.aspect));
  const liveness = Math.max(0, Math.min(1, (open - closed) / 0.14));
  const clearest = seen.reduce((best, face) => (face.aspect > best.aspect ? face : best));

  if (!reference) {
    return { decision: "review", liveness, match: null, evidence: clearest.bytes, reason: "no_reference" };
  }

  const roster = await readFace(reference, engine);
  if (!roster) {
    return { decision: "review", liveness, match: null, evidence: clearest.bytes, reason: "no_reference" };
  }

  const match = similarity(descriptorDistance(clearest.descriptor, roster.descriptor));
  const blinkQualifies = liveness >= LIVENESS_PASS;
  const faceQualifies = match >= MATCH_PASS;
  const canReview = liveness >= 0.5 && match >= MATCH_REVIEW;

  if (blinkQualifies && faceQualifies) {
    return { decision: "verified", liveness, match, evidence: null, reason: "ok" };
  }
  if (canReview) {
    return {
      decision: "review",
      liveness,
      match,
      evidence: clearest.bytes,
      reason: blinkQualifies ? "low_match" : "low_liveness",
    };
  }
  return {
    decision: "reject",
    liveness,
    match,
    evidence: clearest.bytes,
    reason: match < MATCH_REVIEW ? "mismatch" : "low_liveness",
  };
}
