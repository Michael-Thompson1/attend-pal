"use client";

import { createContext, useContext, type ReactNode } from "react";
import { User } from "lucide-react";

const LecturerProfileContext = createContext<{ photoUrl: string | null; name: string }>({
  photoUrl: null,
  name: "",
});

export function useLecturerProfile() {
  return useContext(LecturerProfileContext);
}

export function LecturerProfileProvider({
  photoUrl,
  name,
  children,
}: {
  photoUrl: string | null;
  name: string;
  children: ReactNode;
}) {
  return <LecturerProfileContext.Provider value={{ photoUrl, name }}>{children}</LecturerProfileContext.Provider>;
}

export function ProfilePhoto({
  variant,
  initial,
}: {
  variant: "icon" | "initial";
  initial?: string;
}) {
  const { photoUrl, name } = useContext(LecturerProfileContext);
  const letter = (initial || name.charAt(0) || "L").toUpperCase();
  const tone = variant === "icon" ? "bg-primary text-on-primary shadow-sm" : "bg-primary-container text-on-primary";

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full font-caption font-bold ${photoUrl ? "" : tone}`}
    >
      {photoUrl ? (
        // Signed photo URLs expire and are not a fixed image host.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : variant === "icon" ? (
        <User className="h-4 w-4" />
      ) : (
        letter
      )}
    </div>
  );
}
