import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function isoAddDays(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function toDateInput(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toFormValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getInitialDays(booking) {
  const fromBooking = Number(booking?.days ?? booking?.hireLength ?? booking?.hire_length);
  if (Number.isFinite(fromBooking) && fromBooking > 0) return fromBooking;
  if (Array.isArray(booking?.selectedDates) && booking.selectedDates.length > 0) {
    return booking.selectedDates.length;
  }
  return 14;
}

export function EditBookingModal({ booking, open, onClose, onUpdated }) {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !booking) return;
    setForm({
      name: toFormValue(booking.name),
      email: toFormValue(booking.email),
      phone: toFormValue(booking.phone),
      postcode: toFormValue(booking.postcode),
      deliveryAddress: toFormValue(booking.deliveryAddress),
      startDate: toDateInput(booking.startDate || booking.delivery_date || booking.selectedDates?.[0]),
      days: getInitialDays(booking),
      status: booking.status || "Awaiting deposit",
      dailyCost: toFormValue(booking.dailyCost),
      deliveryCost: toFormValue(booking.deliveryCost),
      collectionCost: toFormValue(booking.collectionCost),
      totalCost: toFormValue(booking.totalCost),
      notes: toFormValue(booking.notes),
    });
    setStatus("idle");
    setError("");
  }, [booking, open]);

  const endDate = useMemo(() => {
    if (!form?.startDate) return "";
    const days = Number(form.days) || 1;
    return isoAddDays(form.startDate, Math.max(days, 1) - 1);
  }, [form?.startDate, form?.days]);
  const cleaningDate = endDate ? isoAddDays(endDate, 1) : "";

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: key === "days" ? (value ? parseInt(value, 10) : "") : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking || !form) return;
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }
    const days = Number(form.days) || 1;
    if (days < 1) {
      setError("Days must be at least 1.");
      return;
    }

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
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          postcode: form.postcode.trim() || null,
          deliveryAddress: form.deliveryAddress.trim() || null,
          startDate: form.startDate,
          endDate,
          days,
          selectedDates,
          status: form.status,
          dailyCost: numberOrNull(form.dailyCost),
          deliveryCost: numberOrNull(form.deliveryCost),
          collectionCost: numberOrNull(form.collectionCost),
          totalCost: numberOrNull(form.totalCost),
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update booking.");
      setStatus("success");
      onUpdated?.(data);
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(err.message || "Failed to update booking.");
      setStatus("idle");
    }
  };

  if (!open || !booking || !form) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-lg font-semibold">Edit booking</h2>
            <p className="text-xs text-slate-500">{booking.id}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-sm">{error}</div>}
          {status === "success" && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">Booking updated successfully.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="eb-name">Name *</Label>
              <Input id="eb-name" value={form.name} onChange={set("name")} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-email">Email *</Label>
              <Input id="eb-email" type="email" value={form.email} onChange={set("email")} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-phone">Phone</Label>
              <Input id="eb-phone" value={form.phone} onChange={set("phone")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-postcode">Postcode</Label>
              <Input id="eb-postcode" value={form.postcode} onChange={set("postcode")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-status">Status</Label>
              <select
                id="eb-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Awaiting deposit">Awaiting deposit</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Quote Calculated">Quote Calculated</option>
                <option value="Trade Quote Request">Trade Quote Request</option>
                <option value="Trade Pack Request">Trade Pack Request</option>
              </select>
            </div>
            <div>
              <Label htmlFor="eb-startDate">Start date *</Label>
              <Input id="eb-startDate" type="date" value={form.startDate} onChange={set("startDate")} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-days">Hire length days *</Label>
              <Input id="eb-days" type="number" min={1} value={form.days} onChange={set("days")} required className="mt-1" />
            </div>
            <div className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Collection date will be <span className="font-medium text-slate-900">{endDate || "set after start date"}</span>.
            </div>
            {cleaningDate && (
              <div className="sm:col-span-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
                Clean/prep day blocked: <span className="font-medium">{cleaningDate}</span>. This is not charged as hire, but it prevents another booking starting that day.
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="eb-address">Delivery address</Label>
              <Input id="eb-address" value={form.deliveryAddress} onChange={set("deliveryAddress")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-dailyCost">Daily cost</Label>
              <Input id="eb-dailyCost" type="number" step="0.01" min="0" value={form.dailyCost} onChange={set("dailyCost")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-totalCost">Total cost</Label>
              <Input id="eb-totalCost" type="number" step="0.01" min="0" value={form.totalCost} onChange={set("totalCost")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-deliveryCost">Delivery cost</Label>
              <Input id="eb-deliveryCost" type="number" step="0.01" min="0" value={form.deliveryCost} onChange={set("deliveryCost")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="eb-collectionCost">Collection cost</Label>
              <Input id="eb-collectionCost" type="number" step="0.01" min="0" value={form.collectionCost} onChange={set("collectionCost")} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="eb-notes">Notes</Label>
              <textarea
                id="eb-notes"
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={status === "saving"} className="flex-1 gap-2">
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {status === "saving" ? "Saving..." : "Save changes"}
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
