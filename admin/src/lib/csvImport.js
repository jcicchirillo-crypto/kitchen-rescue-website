export const LEAD_FIELDS = [
  { key: "", label: "— Skip —" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source" },
  { key: "created_at", label: "Created date" },
  { key: "notes", label: "Notes" },
];

const HEADER_ALIASES = {
  name: ["name", "full name", "customer", "lead name", "contact name"],
  email: ["email", "e-mail", "email address", "mail"],
  phone: ["phone", "telephone", "mobile", "phone number", "tel", "contact number"],
  source: ["source", "channel", "form", "campaign", "lead source"],
  created_at: ["created", "created at", "created date", "date", "submitted", "timestamp"],
  notes: ["notes", "comments", "labels", "message", "description"],
};

function parseCSVLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCSV(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cells = parseCSVLine(line).map((c) => c.replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

export function guessColumnMapping(headers) {
  const mapping = {
    name: "",
    email: "",
    phone: "",
    source: "",
    created_at: "",
    notes: "",
  };

  for (const header of headers) {
    const norm = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (mapping[field]) continue;
      if (aliases.some((alias) => norm === alias || norm.includes(alias))) {
        mapping[field] = header;
      }
    }
  }
  return mapping;
}

export function applyMapping(rows, mapping) {
  return rows.map((row) => {
    const mapped = {};
    for (const [field, header] of Object.entries(mapping)) {
      if (!header) continue;
      mapped[field] = row[header] ?? "";
    }
    return mapped;
  });
}

export function buildPreviewRows(mappedRows, existingEmails, defaultSource) {
  const seen = new Set();
  return mappedRows.map((row, index) => {
    const email = String(row.email || "").trim().toLowerCase();
    const name = String(row.name || "").trim() || "—";
    const phone = String(row.phone || "").trim();
    const source = String(row.source || defaultSource || "csv-import").trim() || defaultSource || "csv-import";
    const created_at = String(row.created_at || "").trim();
    const notes = String(row.notes || "").trim();

    let status = "ready";
    let reason = "";
    if (!email || !email.includes("@")) {
      status = "invalid";
      reason = "Missing or invalid email";
    } else if (existingEmails.has(email) || seen.has(email)) {
      status = "duplicate";
      reason = "Already in leads";
    } else {
      seen.add(email);
    }

    return {
      index,
      status,
      reason,
      name,
      email,
      phone,
      source,
      created_at,
      notes,
    };
  });
}
