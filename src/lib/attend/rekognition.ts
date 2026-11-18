import { CompareFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";

/**
 * Optional AWS Rekognition face comparison. It is used only when all three
 * variables are set (Vercel reserves the AWS_* names, hence REKOGNITION_*).
 * Without them, or when AWS fails, the built-in face model is used instead.
 */
const region = process.env.REKOGNITION_REGION;
const accessKeyId = process.env.REKOGNITION_ACCESS_KEY_ID;
const secretAccessKey = process.env.REKOGNITION_SECRET_ACCESS_KEY;

/** Rekognition similarity (0-1) at or above this is marked present. */
export const REKOGNITION_PASS = 0.9;
/** Rekognition similarity (0-1) at or above this goes to the lecturer for review. */
export const REKOGNITION_REVIEW = 0.7;

let client: RekognitionClient | null = null;

export function rekognitionConfigured() {
  return Boolean(region && accessKeyId && secretAccessKey);
}

/**
 * Compares the selfie with the roster photo. Returns the similarity (0-1) of
 * the best-matching face, 0 when no face in the roster photo matches, or null
 * when Rekognition is not set up or could not answer.
 */
export async function compareWithRekognition(selfie: Buffer, reference: Buffer): Promise<number | null> {
  if (!rekognitionConfigured()) return null;
  client ??= new RekognitionClient({
    region,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    maxAttempts: 2,
  });
  try {
    const result = await client.send(
      new CompareFacesCommand({
        SourceImage: { Bytes: selfie },
        TargetImage: { Bytes: reference },
        SimilarityThreshold: 0,
      }),
      { abortSignal: AbortSignal.timeout(8000) },
    );
    const best = Math.max(0, ...(result.FaceMatches ?? []).map((match) => match.Similarity ?? 0));
    return best / 100;
  } catch (error) {
    console.error("Rekognition compare failed; using the built-in face model", error);
    return null;
  }
}
