/**
 * Haversine distance — returns distance in metres between two lat/lon pairs.
 * Runs on the SERVER only. Never trust coordinates from the client for access decisions.
 */
export function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Returns true when a student's location passes the check.
 *
 * Rules (from GEMINI.md security rule 6):
 * - If browser-reported accuracy > 100 m → RETRY (not a bounds failure)
 * - Otherwise distance must be ≤ sessionRadiusMetres + min(accuracy, 50)
 */
export type LocationCheckResult =
  | { pass: true }
  | { pass: false; reason: "out_of_bounds" | "poor_accuracy" };

export function checkLocation(opts: {
  studentLat: number;
  studentLon: number;
  studentAccuracyMetres: number;
  sessionLat: number;
  sessionLon: number;
  sessionRadiusMetres: number;
}): LocationCheckResult {
  const { studentLat, studentLon, studentAccuracyMetres, sessionLat, sessionLon, sessionRadiusMetres } = opts;

  if (studentAccuracyMetres > 100) {
    return { pass: false, reason: "poor_accuracy" };
  }

  const distance = haversineMetres(studentLat, studentLon, sessionLat, sessionLon);
  const allowance = Math.min(studentAccuracyMetres, 50);

  if (distance <= sessionRadiusMetres + allowance) {
    return { pass: true };
  }

  return { pass: false, reason: "out_of_bounds" };
}
