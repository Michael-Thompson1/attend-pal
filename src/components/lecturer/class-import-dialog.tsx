"use client";

import { useState } from "react";
import { ArrowRight, Check, CloudUpload, Download, X } from "lucide-react";

type ImportResult = {
  imported: number;
  withPhoto: number;
  missingPhoto: number;
  duplicates: number;
  unmatchedPhotos: string[];
  rejectedPhotos: string[];
  photoErrors: string[];
  skipped: { indexNumber: string; reason: string }[];
};

export function ClassImportDialog({
  classId,
  classCode,
  onClose,
  onImported,
}: {
  classId: string;
  classCode: string;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}) {
  const [csv, setCsv] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit() {
    if (!csv) {
      setError("Choose the class CSV.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData();
    form.set("classId", classId);
    form.set("csv", csv);
    if (zip) form.set("zip", zip);
    try {
      const response = await fetch("/api/classes/import", { method: "POST", body: form });
      const data = (await response.json()) as ImportResult & { error?: string };
      if (!response.ok || data.error) {
        setError(data.error || "The class list could not be imported.");
        return;
      }
      setResult(data);
      await onImported();
    } catch {
      setError("The class list could not be imported.");
    } finally {
      setPending(false);
    }
  }

  function downloadTemplate() {
    const csvText = [
      "Index Number,Full Name,Email,Programme,Level",
      "AH/BMS/24/0000,Ama Asante,a.asante@stu.ucc.edu.gh,BSc Computer Science,Level 200",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csvText], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${classCode}-roster-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-container-high px-6 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary p-1.5 text-on-primary">
                <CloudUpload className="h-5 w-5" />
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Import {classCode}</h2>
            </div>
            <p className="mt-1 font-body-md text-caption text-secondary">
              The CSV keeps the official index. Each photo uses hyphens where the index has slashes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-outline hover:bg-surface-container-high hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 sm:px-8">
          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-semibold">Class CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setCsv(event.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="font-body-md text-body-md text-on-surface file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-surface-container file:px-3 file:font-label-md file:text-label-md file:font-semibold"
            />
            <span className="font-caption text-caption text-secondary">
              Columns: Index Number, Full Name, Email, Programme, Level. Example: AH/BMS/24/0000
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-semibold">Photo zip</span>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => {
                setZip(event.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="font-body-md text-body-md text-on-surface file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-surface-container file:px-3 file:font-label-md file:text-label-md file:font-semibold"
            />
            <span className="font-caption text-caption text-secondary">
              JPG files named AH-BMS-24-0000.jpg. A student with no photo is still added, and their check-in comes to you for review.
            </span>
          </label>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex w-fit items-center gap-1.5 font-label-md text-label-md font-semibold text-primary"
          >
            <Download className="h-4 w-4" />
            Download CSV template
          </button>

          {error && <p className="rounded-xl bg-error-container px-4 py-3 font-body-md text-body-md text-on-error-container">{error}</p>}

          {result && (
            <div className="grid gap-3 sm:grid-cols-3">
              <ResultCard label="Saved" value={result.imported} />
              <ResultCard label="Photos matched" value={result.withPhoto} />
              <ResultCard label="Missing photo" value={result.missingPhoto} />
              {(result.unmatchedPhotos.length > 0 || result.rejectedPhotos.length > 0 || result.skipped.length > 0) && (
                <div className="rounded-xl bg-surface-container-low p-4 sm:col-span-3">
                  {result.skipped.length > 0 && (
                    <p className="font-caption text-caption text-secondary">
                      Skipped: {result.skipped.map((row) => `${row.indexNumber} (${row.reason})`).join(", ")}
                    </p>
                  )}
                  {result.unmatchedPhotos.length > 0 && (
                    <p className="mt-1 font-caption text-caption text-secondary">
                      Photos with no CSV row: {result.unmatchedPhotos.join(", ")}
                    </p>
                  )}
                  {result.rejectedPhotos.length > 0 && (
                    <p className="mt-1 font-caption text-caption text-secondary">
                      Use JPG photos. These were left out: {result.rejectedPhotos.join(", ")}
                    </p>
                  )}
                  {result.photoErrors.length > 0 && (
                    <p className="mt-1 font-caption text-caption text-secondary">
                      These photos could not be stored: {result.photoErrors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-container-high bg-surface-container-low px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="font-label-md text-label-md text-secondary">
            {result ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !csv}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-lg text-label-md font-semibold text-on-primary disabled:opacity-50"
          >
            {pending ? "Saving..." : result ? "Import again" : "Import class list"}
            {result ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-4">
      <p className="font-title-lg text-title-lg font-bold text-on-surface">{value}</p>
      <p className="font-caption text-caption text-secondary">{label}</p>
    </div>
  );
}
