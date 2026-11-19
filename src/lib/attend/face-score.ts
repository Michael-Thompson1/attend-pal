import { decode as decodeJpeg } from "jpeg-js";
import { existsSync } from "node:fs";
import path from "path";

/**
 * Likeness uses the roster photo and the SSD face model.
 * 50% or higher is marked present.
 * 40–49% is sent to the lecturer.
 * Under 40% is rejected.
 * Liveness needs a visible blink across the frames, so a still photo or a
 * picture on another screen cannot pass when the session requires it.
 * Every frame must show the same person.
 */
export const LIVENESS_PASS = 0.15;
export const MATCH_PASS = 0.5;
export const MATCH_REVIEW = 0.4;
/** Two frames further apart than this are treated as different people. */
export const SAME_PERSON_DISTANCE = 0.6;
/** A reference face narrower than this (in pixels) is too small to match reliably. */
export const MIN_REFERENCE_FACE_PX = 100;

export type FaceDecision = "verified" | "review" | "reject" | "unscored";

export type FaceScore = {
  decision: FaceDecision;
  liveness: number;
  match: number | null;
  livenessPassed: boolean;
  evidence: Buffer | null;
  reason: "ok" | "no_reference" | "no_face" | "low_liveness" | "low_match" | "mismatch";
};

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };
type Tensor = { dispose: () => void; shape: number[] };
type Landmarks = {
  getLeftEye: () => Point[];
  getRightEye: () => Point[];
  shiftBy: (x: number, y: number) => Landmarks;
  align: (detection: null, options: { useDlibAlignment: boolean }) => Box;
};
type FaceHit = { descriptor: Float32Array; landmarks: Landmarks; detection: { box: Box } };

let models: Promise<{
  detect: (tensor: unknown) => Promise<FaceHit[]>;
  readAt: (tensor: Tensor, box: Box) => Promise<{ landmarks: Landmarks; descriptor: Float32Array }>;
  tensor: (data: Uint8Array, shape: [number, number, number]) => Tensor;
  resize: (tensor: Tensor, size: [number, number]) => Tensor;
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
    faceLandmark68Net: {
      loadFromDisk: (dir: string) => Promise<void>;
      detectLandmarks: (face: Tensor) => Promise<Landmarks>;
    };
    faceRecognitionNet: {
      loadFromDisk: (dir: string) => Promise<void>;
      computeFaceDescriptor: (face: Tensor) => Promise<Float32Array>;
    };
  };
  extractFaceTensors: (image: Tensor, boxes: Box[]) => Promise<Tensor[]>;
  SsdMobilenetv1Options: new (options?: { minConfidence?: number; maxResults?: number }) => unknown;
  detectAllFaces: (
    tensor: unknown,
    options: unknown,
  ) => { withFaceLandmarks: () => { withFaceDescriptors: () => Promise<FaceHit[]> } };
};

/** File that must exist in a directory before it can be used as the model folder. */
const MODEL_MARKER = "ssd_mobilenetv1_model-weights_manifest.json";

/**
 * The model weights live in the package's `model` folder. Check the usual
 * locations under the working directory and the Lambda task root, walking up a
 * few levels, and let the loader below decide which one actually works.
 */
function modelDirCandidates(): string[] {
  const dirs: string[] = [];
  const override = process.env.FACE_MODEL_DIR?.trim();
  if (override) dirs.push(override);

  const roots = new Set<string>([process.cwd()]);
  const taskRoot = process.env.LAMBDA_TASK_ROOT?.trim();
  if (taskRoot) roots.add(taskRoot);

  for (const root of roots) {
    let current = root;
    for (let depth = 0; depth < 4; depth += 1) {
      dirs.push(path.join(current, "node_modules", "@vladmandic", "face-api", "model"));
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return [...new Set(dirs)];
}

/** What the face model looked for, so a failed check can say why. */
export function faceModelDiagnostics() {
  return {
    cwd: process.cwd(),
    candidates: modelDirCandidates().map((dir) => ({
      dir,
      hasWeights: existsSync(path.join(dir, MODEL_MARKER)),
    })),
  };
}

async function loadModelsFrom(faceapi: FaceRuntime, dir: string) {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(dir);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(dir);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(dir);
}

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
      const tried: string[] = [];
      for (const dir of modelDirCandidates()) {
        try {
          await loadModelsFrom(faceapi, dir);
          console.info("Face models loaded from", dir);
          return finishModels(faceapi);
        } catch (error) {
          tried.push(`${dir} (${error instanceof Error ? error.message : String(error)})`);
        }
      }
      throw new Error(`Face model weights could not be loaded. Tried: ${tried.join(" | ")}`);
    })().catch((error) => {
      // Let the next check-in retry instead of caching a broken loader.
      models = null;
      throw error;
    });
  }
  return models;
}

function finishModels(faceapi: FaceRuntime) {
  const tf = faceapi.tf;
  const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25, maxResults: 2 });
  return {
    detect: (tensor: unknown) =>
      faceapi.detectAllFaces(tensor, options).withFaceLandmarks().withFaceDescriptors(),
    // Same steps as withFaceLandmarks().withFaceDescriptors(), but on a face box
    // that is already known, so the slow face search is skipped.
    readAt: async (tensor: Tensor, box: Box) => {
      const [face] = await faceapi.extractFaceTensors(tensor, [box]);
      let landmarks: Landmarks;
      try {
        landmarks = (await faceapi.nets.faceLandmark68Net.detectLandmarks(face)).shiftBy(box.x, box.y);
      } finally {
        face.dispose();
      }
      const [aligned] = await faceapi.extractFaceTensors(tensor, [
        landmarks.align(null, { useDlibAlignment: true }),
      ]);
      try {
        return { landmarks, descriptor: await faceapi.nets.faceRecognitionNet.computeFaceDescriptor(aligned) };
      } finally {
        aligned.dispose();
      }
    },
    tensor: (data: Uint8Array, shape: [number, number, number]) => tf.tensor3d(data, shape, "int32"),
    resize: (tensor: { dispose: () => void; shape: number[] }, size: [number, number]) =>
      tf.image.resizeBilinear(tensor, size, false),
  };
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

type FaceRead = { aspect: number; descriptor: Float32Array; box: Box; width: number; height: number; faces: number };

/**
 * Reads one face from a JPEG. Without `at`, it runs the full (slow) face search.
 * With `at`, it reuses a face box found on another frame of the same capture,
 * which skips the search and costs a small fraction of the time.
 */
async function readFace(
  bytes: Buffer,
  engine: Awaited<ReturnType<typeof loadModels>>,
  at?: FaceRead,
): Promise<FaceRead | null> {
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
  const [height, width] = tensor.shape;
  const aspectOf = (landmarks: Landmarks) =>
    (eyeAspect(landmarks.getLeftEye()) + eyeAspect(landmarks.getRightEye())) / 2;
  try {
    if (at) {
      if (at.width !== width || at.height !== height) return null;
      const face = await engine.readAt(tensor, at.box);
      return { aspect: aspectOf(face.landmarks), descriptor: face.descriptor, box: at.box, width, height, faces: 1 };
    }
    const faces = await engine.detect(tensor);
    if (faces.length === 0) return null;
    const face = largest(faces);
    return {
      aspect: aspectOf(face.landmarks),
      descriptor: face.descriptor,
      box: face.detection.box,
      width,
      height,
      faces: faces.length,
    };
  } catch {
    return null;
  } finally {
    tensor.dispose();
  }
}

export type ReferenceFingerprint = {
  /** 128-number face fingerprint, or null when no face was found. */
  descriptor: number[] | null;
  /** Width of the face box in pixels, after large photos are scaled to 800 px. */
  faceWidth: number;
  /** How many faces the photo contains (up to 2 are counted). */
  faces: number;
};

/** Reads the face fingerprint of a roster (reference) photo. */
export async function referenceFingerprint(photo: Buffer): Promise<ReferenceFingerprint> {
  const engine = await loadModels();
  const face = await readFace(photo, engine);
  if (!face) return { descriptor: null, faceWidth: 0, faces: 0 };
  return { descriptor: Array.from(face.descriptor), faceWidth: Math.round(face.box.width), faces: face.faces };
}

/**
 * Scores the check-in frames. `reference` is the roster photo's saved face
 * fingerprint (see reference-face.ts), or null when there is none.
 */
export async function scoreCheckInFaces(
  frames: Buffer[],
  reference: Float32Array | null,
  requireLiveness = true,
): Promise<FaceScore> {
  const engine = await loadModels();
  // The face search is the slow step (seconds per frame on the server CPU), so
  // it runs on one anchor frame, trying at most two. The face barely moves in
  // the ~1 s capture, so every other frame reuses the anchor's face box. Every
  // frame is still read: a blink is short, and dropping frames can miss it.
  const order = [Math.floor(frames.length / 2), 0].filter((index, at, all) => all.indexOf(index) === at);
  let anchor: FaceRead | null = null;
  let anchorIndex = -1;
  for (const index of order) {
    anchor = await readFace(frames[index], engine);
    if (anchor) {
      anchorIndex = index;
      break;
    }
  }
  const seen: Array<{ aspect: number; descriptor: Float32Array; bytes: Buffer }> = [];
  if (anchor) {
    for (let index = 0; index < frames.length; index += 1) {
      const face = index === anchorIndex ? anchor : await readFace(frames[index], engine, anchor);
      if (face) seen.push({ aspect: face.aspect, descriptor: face.descriptor, bytes: frames[index] });
    }
  }
  if (seen.length === 0) {
    return {
      decision: "reject",
      liveness: 0,
      match: null,
      livenessPassed: false,
      evidence: frames[0] ?? null,
      reason: "no_face",
    };
  }

  const open = Math.max(...seen.map((face) => face.aspect));
  const closed = Math.min(...seen.map((face) => face.aspect));
  const liveness = seen.length < 2 ? 0 : Math.max(0, Math.min(1, (open - closed) / 0.14));
  const livenessPassed = liveness >= LIVENESS_PASS;
  const clearest = seen.reduce((best, face) => (face.aspect > best.aspect ? face : best));

  // Every frame must show the same person, so one good frame of the student
  // cannot carry frames of somebody else.
  for (let left = 0; left < seen.length; left += 1) {
    for (let right = left + 1; right < seen.length; right += 1) {
      if (descriptorDistance(seen[left].descriptor, seen[right].descriptor) > SAME_PERSON_DISTANCE) {
        return { decision: "reject", liveness, match: null, livenessPassed, evidence: clearest.bytes, reason: "mismatch" };
      }
    }
  }

  // A still photo, or a picture shown on another screen, never blinks.
  if (requireLiveness && !livenessPassed) {
    return { decision: "reject", liveness, match: null, livenessPassed, evidence: clearest.bytes, reason: "low_liveness" };
  }

  if (!reference) {
    return { decision: "review", liveness, match: null, livenessPassed, evidence: clearest.bytes, reason: "no_reference" };
  }

  const roster = { descriptor: reference };
  if (roster.descriptor.length !== 128) {
    return { decision: "review", liveness, match: null, livenessPassed, evidence: clearest.bytes, reason: "no_reference" };
  }

  // Safe to take the best frame: every frame was checked to be the same person.
  const match = Math.max(...seen.map((face) => similarity(descriptorDistance(face.descriptor, roster.descriptor))));

  if (match >= MATCH_PASS) {
    return { decision: "verified", liveness, match, livenessPassed, evidence: null, reason: "ok" };
  }
  if (match >= MATCH_REVIEW) {
    return { decision: "review", liveness, match, livenessPassed, evidence: clearest.bytes, reason: "low_match" };
  }
  return {
    decision: "reject",
    liveness,
    match,
    livenessPassed,
    evidence: clearest.bytes,
    reason: "mismatch",
  };
}
