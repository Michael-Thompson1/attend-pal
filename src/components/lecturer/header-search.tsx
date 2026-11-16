"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchPortalAction, type SearchHit } from "@/app/(lecturer)/search-actions";

export default function HeaderSearch({ variant = "portal" }: { variant?: "portal" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }
      const next = await searchPortalAction(query);
      setHits(next);
      setOpen(true);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const width = variant === "compact" ? "relative w-full max-w-md" : "relative w-72 sm:w-96";
  const field =
    variant === "compact"
      ? "h-10 w-full rounded-xl bg-surface-container-low pr-4 pl-10 font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
      : "h-10 w-full rounded-xl border-0 bg-surface-container-low pr-4 pl-10 font-body-md text-label-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none";

  return (
    <div ref={box} className={width}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-outline" />
      <input
        type="search"
        value={query}
        placeholder="Search students, courses, or sessions..."
        className={field}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-lg">
          {hits.length === 0 ? (
            <p className="px-4 py-3 font-label-md text-label-md text-secondary">No matches</p>
          ) : (
            hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.href}-${hit.label}`}
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-container-low"
                onClick={() => {
                  setOpen(false);
                  router.push(hit.href);
                }}
              >
                <span className="mt-0.5 rounded-md bg-surface-container px-1.5 py-0.5 font-caption text-caption text-secondary">
                  {hit.kind}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">
                    {hit.label}
                  </span>
                  {hit.detail && (
                    <span className="block truncate font-caption text-caption text-secondary">{hit.detail}</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
