"use client";

import { AttendMark } from "@/components/brand/attend-mark";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import {
  AlertCircle,
  Fingerprint,
  Headset,
  Info,
  Link2Off,
  MapPin,
  Monitor,
  ScanQrCode,
  School,
  X,
} from "lucide-react";

function tokenFromScan(value: string) {
  const fromLink = value.match(/\/attend\/([A-Za-z0-9]{20,80})/);
  if (fromLink) return fromLink[1];
  const raw = value.trim();
  return /^[A-Za-z0-9]{20,80}$/.test(raw) ? raw : null;
}

export default function LinkInactiveView({
  venue,
  course,
  sessionId,
  kioskName,
  detectedTime,
  detectedZone,
}: {
  venue: string;
  course: string;
  sessionId: string;
  kioskName: string;
  detectedTime: string;
  detectedZone: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const place = venue.trim();
  const courseLabel = course.trim() || "—";
  const sessionLabel = sessionId.trim() || "—";
  const kiosk = kioskName.trim() || "Campus Verification Kiosk";

  useEffect(() => {
    if (!scanning) return;
    let stopped = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    async function start() {
      if (!video || !canvas || !navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser cannot open a camera. Ask your lecturer for the session link.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        const tick = () => {
          if (stopped) return;
          if (video.readyState >= 2 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const image = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
              const token = code ? tokenFromScan(code.data) : null;
              if (token) {
                stopped = true;
                stream?.getTracks().forEach((track) => track.stop());
                router.push(`/attend/${token}`);
                return;
              }
            }
          }
          frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
      } catch {
        if (!stopped) setCameraError("Allow the camera to scan the code on the classroom screen.");
      }
    }

    void start();
    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning, router]);

  function scanAgain() {
    if (scanning) return;
    setCameraError(null);
    setScanning(true);
  }

  return (
    <div className="flex flex-col pb-8">
      <header className="flex h-16 items-center justify-between px-4 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <AttendMark className="h-9 w-9 rounded-xl" />
          <div>
            <p className="font-title-md text-title-md leading-none tracking-tight">Attend Pal</p>
            <p className="mt-0.5 font-caption text-caption leading-tight text-secondary">Campus Verification Kiosk</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-container" />
          <span className="font-caption text-caption font-medium text-secondary">Online</span>
        </div>
      </header>

      <div className="px-4">
        <div className="my-2 flex items-center justify-between rounded-xl bg-surface-container px-4 py-2">
          <span className="inline-flex min-w-0 items-center gap-2 font-caption text-caption font-medium text-secondary">
            <MapPin className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{place || "Classroom"}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-high px-2 py-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
            <span className="font-caption text-caption font-medium text-error">Session Closed</span>
          </span>
        </div>

        <section className="mt-1 flex flex-col items-center rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm">
          <div className="relative mt-2 mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-low text-secondary">
              <Link2Off className="h-11 w-11" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-error-container text-on-error-container shadow-sm">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>

          <h1 className="mb-2 text-[26px] leading-[34px] font-bold tracking-tight">This link is no longer active</h1>
          <p className="mb-6 max-w-xs font-body-md text-body-md leading-relaxed text-secondary">
            The QR code or session link you opened is expired, invalid, or has been revoked by the instructor.
          </p>

          <div className="mb-2 flex w-full items-start gap-2 rounded-xl bg-surface-container-low p-4 text-left">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 font-label-md text-label-md font-semibold">Verification Tip</p>
              <p className="font-caption text-caption leading-snug text-on-surface-variant">
                Make sure you scanned the live QR code currently projected on the classroom screen, not a forwarded
                screenshot or an old session link.
              </p>
            </div>
          </div>

          <div className="my-2 w-full rounded-xl bg-surface-container p-4 text-left">
            <div className="flex items-center justify-between py-1">
              <span className="font-caption text-caption text-secondary">Course Code</span>
              <span className="font-label-md text-label-md font-medium">{courseLabel}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-caption text-caption text-secondary">Session ID</span>
              <span className="font-mono font-caption text-caption tracking-wider text-secondary">{sessionLabel}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-caption text-caption text-secondary">Detected At</span>
              <span className="text-right font-caption text-caption font-medium">
                {detectedTime}
                <span className="mt-0.5 block font-normal text-secondary">{detectedZone}</span>
              </span>
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <School className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-label-md text-label-md font-medium">
              <span className="truncate">{kiosk}</span>
              <Monitor className="h-4 w-4 shrink-0 text-secondary" />
            </p>
            <p className="truncate font-caption text-caption text-secondary">
              Dynamic attendance rotation active every 15s
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={scanAgain}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary shadow-md active:scale-[0.98]"
          >
            <ScanQrCode className={`h-[22px] w-[22px] ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Opening Scanner..." : "Scan new QR code"}
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl font-label-md text-label-md text-secondary active:scale-[0.98]"
          >
            <Headset className="h-[18px] w-[18px]" />
            Ask your lecturer for help
          </button>
        </div>
      </div>

      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col bg-inverse-surface text-surface">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-label-lg text-label-lg">Scan new QR code</p>
            <button
              type="button"
              aria-label="Close scanner"
              onClick={() => setScanning(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mx-4 flex-1 overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/80 p-6 text-center">
                <p className="font-body-md text-body-md">{cameraError}</p>
              </div>
            )}
          </div>
          <p className="px-6 py-4 text-center font-caption text-caption">
            Point the camera at the QR code on the classroom screen.
          </p>
        </div>
      )}

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
        >
          <div className="flex w-full max-w-lg flex-col rounded-t-2xl bg-surface-container-lowest p-6 shadow-xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-variant" />
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                <School className="h-[22px] w-[22px]" />
              </div>
              <div>
                <h2 className="font-title-md text-title-md">Instructor Assistance</h2>
                <p className="font-caption text-caption text-secondary">Manual Override Options</p>
              </div>
            </div>
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              If your device cannot scan the rotating podium QR code, present your physical Student ID card to the
              teaching assistant at the front podium for manual roster check-in.
            </p>
            <div className="mb-6 flex items-center justify-between rounded-xl bg-surface-container-low p-4">
              <div>
                <span className="block font-caption text-caption text-secondary">Terminal Token</span>
                <span className="font-mono font-label-md text-label-md font-semibold">{sessionLabel}</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-secondary">
                <Fingerprint className="h-[18px] w-[18px]" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="h-12 w-full rounded-xl bg-surface-container font-label-lg text-label-lg"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
