import { useMemo, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  LEAD_FIELDS,
  parseCSV,
  guessColumnMapping,
  applyMapping,
  buildPreviewRows,
} from "../lib/csvImport";

const STATUS_STYLES = {
  ready: "bg-emerald-50 text-emerald-700",
  duplicate: "bg-amber-50 text-amber-700",
  invalid: "bg-rose-50 text-rose-700",
};

export function LeadsImportTab({ leads, onImported, onMessage }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    created_at: "",
    notes: "",
  });
  const [defaultSource, setDefaultSource] = useState("paid");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const existingEmails = useMemo(
    () => new Set((leads || []).map((l) => (l.email || "").trim().toLowerCase()).filter(Boolean)),
    [leads]
  );
  const existingPhones = useMemo(() => {
    const set = new Set();
    for (const l of leads || []) {
      const digits = String(l.phone || "").replace(/\D/g, "");
      if (digits.length >= 10) set.add(digits.slice(-10));
      else if (digits) set.add(digits);
    }
    return set;
  }, [leads]);

  const mappedRows = useMemo(() => applyMapping(rawRows, mapping), [rawRows, mapping]);
  const previewRows = useMemo(
    () => buildPreviewRows(mappedRows, existingEmails, defaultSource, existingPhones),
    [mappedRows, existingEmails, existingPhones, defaultSource]
  );

  const readyCount = previewRows.filter((r) => r.status === "ready").length;
  const duplicateCount = previewRows.filter((r) => r.status === "duplicate").length;
  const invalidCount = previewRows.filter((r) => r.status === "invalid").length;

  const handleFile = async (file) => {
    if (!file) return;
    setImportResult(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCSV(text);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setMapping(guessColumnMapping(parsed.headers));
  };

  const setMapField = (field, header) => {
    setMapping((prev) => ({ ...prev, [field]: header }));
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!mapping.email) {
      onMessage?.({ type: "error", text: "Map the Email column before importing." });
      return;
    }
    if (readyCount === 0) {
      onMessage?.({ type: "error", text: "No valid new leads to import." });
      return;
    }

    const token = localStorage.getItem("adminToken");
    setImporting(true);
    setImportResult(null);
    try {
      const rowsToImport = mappedRows.filter((_, idx) => previewRows[idx]?.status === "ready");
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rows: rowsToImport,
          skipDuplicates,
          defaultSource: defaultSource.trim() || "meta",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      onMessage?.({
        type: "success",
        text: `Imported ${data.inserted} lead${data.inserted === 1 ? "" : "s"}${data.skipped ? `, skipped ${data.skipped} duplicate${data.skipped === 1 ? "" : "s"}` : ""}${data.failed ? `, ${data.failed} failed` : ""}.`,
      });
      onImported?.();
    } catch (err) {
      onMessage?.({ type: "error", text: err.message || "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Upload className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Import leads from CSV</h3>
            <p className="text-sm text-slate-500 mt-1">
              Upload a CSV export from Meta, your CRM, or a spreadsheet. Map the columns, preview the rows, then import.
            </p>
          </div>
          <div>
            <Label htmlFor="csv-upload" className="sr-only">Upload CSV</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              className="max-w-xs"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>
        {fileName && (
          <p className="text-sm text-slate-600 mt-4 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {fileName} · {rawRows.length} row{rawRows.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {headers.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEAD_FIELDS.filter((f) => f.key).map((field) => (
              <div key={field.key}>
                <Label htmlFor={`map-${field.key}`}>{field.label}{field.key === "email" ? " *" : ""}</Label>
                <select
                  id={`map-${field.key}`}
                  value={mapping[field.key] || ""}
                  onChange={(e) => setMapField(field.key, e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">— Select column —</option>
                  {headers.map((header) => (
                    <option key={`${field.key}-${header}`} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-source">These are uploaded as</Label>
              <select
                id="default-source"
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="paid">Paid / Meta ads</option>
                <option value="meta">Meta</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Skip / merge duplicates (same email or phone)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">{readyCount} ready</span>
            <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1">{duplicateCount} duplicates</span>
            <span className="rounded-full bg-rose-50 text-rose-700 px-3 py-1">{invalidCount} invalid</span>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.slice(0, 25).map((row) => (
                  <TableRow key={row.index}>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                      {row.reason && <div className="text-xs text-slate-400 mt-1">{row.reason}</div>}
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email || "—"}</TableCell>
                    <TableCell>{row.phone || "—"}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">{row.created_at || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {previewRows.length > 25 && (
              <p className="text-xs text-slate-500 px-4 py-3 border-t">Showing first 25 of {previewRows.length} rows.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={importing || readyCount === 0}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {readyCount} lead{readyCount === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>

          {importResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Import complete: {importResult.inserted} inserted, {importResult.skipped} skipped, {importResult.failed} failed.
              </div>
            </div>
          )}
        </>
      )}

      {headers.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-slate-800">Expected CSV columns</p>
            <p className="mt-1">Name, Email, Phone, Created, Source — or similar headers. We&apos;ll try to auto-detect them after upload.</p>
          </div>
        </div>
      )}
    </div>
  );
}
