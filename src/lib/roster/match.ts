export type RosterRow = {
  indexNumber: string;
  fullName: string;
  email: string | null;
  programme: string | null;
  level: string | null;
  key: string;
};

export type RosterPhoto = {
  filename: string;
  key: string;
  bytes: Uint8Array;
};

export type SkippedRow = {
  indexNumber: string;
  reason: string;
};

/** Letters and digits only, so AH/BMS/24/0000 and AH-BMS-24-0000.jpg share one key. */
export function indexKey(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function parseRosterCsv(text: string): {
  rows: RosterRow[];
  duplicates: number;
  skipped: SkippedRow[];
} {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length === 0) return { rows: [], duplicates: 0, skipped: [] };

  const header = table[0].map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const indexAt = findHeader(header, ["indexnumber", "index", "studentindex", "studentid", "indexno"]);
  const nameAt = findHeader(header, ["fullname", "name", "studentname"]);
  const hasHeader = indexAt >= 0 && nameAt >= 0;
  const data = hasHeader ? table.slice(1) : table;
  const columns = hasHeader
    ? {
        index: indexAt,
        name: nameAt,
        email: findHeader(header, ["email", "emailaddress"]),
        programme: findHeader(header, ["programme", "program"]),
        level: findHeader(header, ["level"]),
      }
    : { index: 0, name: 1, email: 2, programme: 3, level: 4 };

  const rows: RosterRow[] = [];
  const seen = new Set<string>();
  const skipped: SkippedRow[] = [];
  let duplicates = 0;

  for (const record of data) {
    const indexNumber = cell(record, columns.index).replace(/\s+/g, "").toUpperCase();
    const fullName = cell(record, columns.name);
    const key = indexKey(indexNumber);
    if (!key || !fullName) {
      skipped.push({
        indexNumber: indexNumber || "Blank row",
        reason: !key ? "Index number is missing" : "Full name is missing",
      });
      continue;
    }
    if (seen.has(key)) {
      duplicates += 1;
      skipped.push({ indexNumber, reason: "Duplicate index in this file" });
      continue;
    }
    seen.add(key);
    rows.push({
      indexNumber,
      fullName,
      email: emptyToNull(cell(record, columns.email)),
      programme: emptyToNull(cell(record, columns.programme)),
      level: emptyToNull(cell(record, columns.level)),
      key,
    });
  }

  return { rows, duplicates, skipped };
}

export function pairPhotos(rows: RosterRow[], photos: RosterPhoto[]) {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const matched = new Map<string, RosterPhoto>();
  const unmatchedPhotos: string[] = [];
  let duplicatePhotos = 0;

  for (const photo of photos) {
    if (!byKey.has(photo.key)) {
      unmatchedPhotos.push(photo.filename);
      continue;
    }
    if (matched.has(photo.key)) {
      duplicatePhotos += 1;
      continue;
    }
    matched.set(photo.key, photo);
  }

  return {
    matched,
    missingPhoto: rows.filter((row) => !matched.has(row.key)),
    unmatchedPhotos,
    duplicatePhotos,
  };
}

function findHeader(header: string[], names: string[]) {
  return header.findIndex((cell) => names.includes(cell));
}

function cell(record: string[], index: number) {
  if (index < 0) return "";
  return (record[index] ?? "").trim();
}

function emptyToNull(value: string) {
  return value ? value : null;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  const source = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }
    if (char === "\n") {
      row.push(value);
      value = "";
      if (row.some((item) => item.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some((item) => item.trim().length > 0)) rows.push(row);
  return rows;
}
