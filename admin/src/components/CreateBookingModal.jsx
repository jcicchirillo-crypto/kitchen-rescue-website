import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Loader2 } from "lucide-react";

function isoAddDays(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  startDate: "",
  days: 14,
  status: "Awaiting deposit",
  notes: "",
};

export function CreateBookingModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [error, setError] = useState("");
  const days = Number(form.days) || 14;
  const collectionDate = form.startDate ? isoAddDays(form.startDate, Math.max(days, 1) - 1) : "";
  const cleaningDate = collectionDate ? isoAddDays(collectionDate, 1) : "";

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStatus("idle");
      setError("");
    }
  }, [open]);

  const set = (key) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: key === "days" ? (v ? parseInt(v, 10) : "") : v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }
    if (days < 1) {
      setError("Days must be at least 1.");
      return;
    }
    const endDate = isoAddDays(form.startDate, days - 1);
    const selectedDates = [];
    let cur = form.startDate;
    for (let i = 0; i < days; i++) {
      selectedDates.push(cur);
      cur = isoAddDays(cur, 1);
    }
    setStatus("saving");
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || "",
          postcode: form.postcode?.trim() || null,
          startDate: form.startDate,
          endDate,
          days,
          selectedDates,
          status: form.status || "Awaiting deposit",
          notes: form.notes?.trim() || null,
          source: "admin",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.id || data.booking_reference)) {
        setStatus("success");
        onCreated?.();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(data.error || data.message || "Failed to save. Check server logs and Supabase.");
        setStatus("idle");
      }
    } catch (err) {
      setError(err.message || "Network error. Please try again.");
      setStatus("idle");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create booking</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-sm">{error}</div>
          )}
          {status === "success" && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">Booking saved successfully.</div>
          )}
          <div>
            <Label htmlFor="cb-name">Name *</Label>
            <Input id="cb-name" value={form.name} onChange={set("name")} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cb-email">Email *</Label>
            <Input id="cb-email" type="email" value={form.email} onChange={set("email")} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cb-phone">Phone</Label>
            <Input id="cb-phone" value={form.phone} onChange={set("phone")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cb-postcode">Postcode</Label>
            <Input id="cb-postcode" value={form.postcode} onChange={set("postcode")} className="mt-1" placeholder="e.g. EN10 7EU" />
          </div>
          <div>
            <Label htmlFor="cb-startDate">Start date *</Label>
            <Input id="cb-startDate" type="date" value={form.startDate} onChange={set("startDate")} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cb-days">Days</Label>
            <Input id="cb-days" type="number" min={1} value={form.days} onChange={set("days")} className="mt-1" />
          </div>
          {form.startDate && (
            <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
              Collection: <strong>{collectionDate}</strong>. Clean/prep day blocked: <strong>{cleaningDate}</strong>.
            </div>
          )}
          <div>
            <Label htmlFor="cb-status">Status</Label>
            <select
              id="cb-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Awaiting deposit">Awaiting deposit</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cb-notes">Notes</Label>
            <textarea id="cb-notes" value={form.notes} onChange={set("notes")} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={status === "saving"} className="flex-1 gap-2">
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {status === "saving" ? "Saving…" : "Save booking"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
