/**
 * Student-facing status messages.
 * These are the ONLY messages students should ever see — plain language, no jargon.
 * Keep in sync with GEMINI.md "Messages students see" section.
 */
export const STUDENT_MESSAGES = {
  verified: {
    heading: "You're checked in!",
    body: "Your attendance has been recorded.",
  },
  out_of_bounds: {
    heading: "You're not in the right place",
    body: "You need to be in the lecture room to check in. Move closer and try again.",
  },
  poor_accuracy: {
    heading: "Couldn't get a precise location",
    body: "Your phone's location isn't accurate enough. Move to an open area and tap Retry.",
  },
  session_closed: {
    heading: "Check-in isn't open",
    body: "This session is not currently accepting check-ins. Ask your lecturer for help.",
  },
  identity_failed: {
    heading: "Identity check failed",
    body: "We couldn't match your face to our records. Make sure you're in good lighting, looking straight at the camera, and try again.",
  },
  flagged: {
    heading: "Sent to your lecturer for review",
    body: "We couldn't confirm your identity automatically. Your lecturer will review and approve or reject your check-in.",
  },
  already_checked_in: {
    heading: "You've already checked in",
    body: "Your attendance for this session has already been recorded.",
  },
  link_inactive: {
    heading: "This link is no longer active",
    body: "The QR code or session link you opened is expired, invalid, or has been revoked by the instructor.",
  },
  not_on_roster: {
    heading: "Index number not found",
    body: "Your index number isn't on the class list. Double-check and try again, or contact your lecturer.",
  },
  rate_limited: {
    heading: "Too many attempts",
    body: "Please wait a moment before trying again.",
  },
} as const;

export type StudentMessageKey = keyof typeof STUDENT_MESSAGES;
