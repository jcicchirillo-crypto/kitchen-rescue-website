import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Send } from "lucide-react";

function isoAddDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildDateRange(start, end) {
  if (!start || !end || end < start) return [];
  const dates = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = isoAddDays(cur, 1);
  }
  return dates;
}

function getDailyRateForDays(days) {
  if (days >= 28) return 45;
  if (days >= 21) return 50;
  if (days >= 14) return 60;
  return 70;
}

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  startDate: "",
  endDate: "",
  dailyRate: 70,
  deliveryCost: 75,
  collectionCost: 75,
  notes: "",
};

export function SendCustomQuoteModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [error, setError] = useState("");
  const [deliveryCalculating, setDeliveryCalculating] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStatus("idle");
      setError("");
    }
  }, [open]);

  // Auto-apply tiered rate when dates change
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;
    const dates = buildDateRange(form.startDate, form.endDate);
    if (dates.length >= 7) {
      const tiered = getDailyRateForDays(dates.length);
      setForm((f) => ({ ...f, dailyRate: tiered }));
    }
  }, [form.startDate, form.endDate]);

  // Auto-calculate delivery cost from postcode when postcode changes
  useEffect(() => {
    const pc = (form.postcode || "").trim().toUpperCase();
    if (pc.length < 4) return;
    const t = setTimeout(async () => {
      setDeliveryCalculating(true);
      try {
        const res = await fetch(`/api/delivery-cost?postcode=${encodeURIComponent(pc)}`);
        const data = await res.json();
        if (res.ok && data.deliveryCost != null && data.collectionCost != null) {
          setForm((f) => ({
            ...f,
            deliveryCost: data.deliveryCost,
            collectionCost: data.collectionCost,
          }));
        }
      } catch {
        // Keep existing values on error
      } finally {
        setDeliveryCalculating(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.postcode]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const dates = buildDateRange(form.startDate, form.endDate);
  const days = dates.length;
  const tieredRate = getDailyRateForDays(days);
  const effectiveRate = Number(form.dailyRate) || tieredRate;
  const dailyCost = days * effectiveRate;
  const delivCost = Number(form.deliveryCost || 0);
  const collCost = Number(form.collectionCost || 0);
  const totalCost = dailyCost + delivCost + collCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.startDate || !form.endDate) {
      setError("Please fill in name, email, start date and end date.");
      return;
    }
    if (days < 7) {
      setError("Minimum hire period is 7 days — please adjust the end date.");
      return;
    }
    try {
      const availRes = await fetch("/api/availability");
      if (!availRes.ok) {
        setError("Could not verify availability. Please try again or check the calendar before sending.");
        return;
      }
      const availData = await availRes.json();
      const ranges = availData.unavailable || [];
      const overlaps = dates.some((d) =>
        ranges.some((r) => d >= r.start && d <= r.end)
      );
      if (overlaps) {
        setError("These dates are already booked (confirmed). Please choose different dates or check the calendar.");
        return;
      }
    } catch {
      setError("Could not verify availability. Please try again or check the calendar before sending.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        postcode: form.postcode.toUpperCase().trim(),
        selectedDates: dates,
        startDate: form.startDate,
        endDate: form.endDate,
        days,
        dailyRate: effectiveRate,
        dailyCost,
        deliveryCost: delivCost,
        collectionCost: collCost,
        totalCost,
        source: "admin-custom-quote",
      };
      const res = await fetch("/send-quote-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setError("Failed to send — please try again.");
        setStatus("idle");
      }
    } catch {
      setError("Network error — please try again.");
      setStatus("idle");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Send Custom Quote</h2>
            <p className="text-sm text-slate-500">Email a tailored quote directly to a customer</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Success state */}
        {status === "success" ? (
          <div className="px-6 py-14 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Quote sent!</h3>
            <p className="text-sm text-slate-500 mb-2">
              {form.name} will receive the quote at
            </p>
            <p className="font-medium text-slate-700 mb-6">{form.email}</p>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* ── Customer details ─────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Customer Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="cq-name">Name *</Label>
                  <Input
                    id="cq-name"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Jane Smith"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cq-email">Email *</Label>
                  <Input
                    id="cq-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="jane@example.com"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cq-phone">Phone</Label>
                  <Input
                    id="cq-phone"
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="07700 000000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cq-postcode">Postcode</Label>
                  <Input
                    id="cq-postcode"
                    value={form.postcode}
                    onChange={set("postcode")}
                    placeholder="AL1 1AA"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Hire period ──────────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Hire Period
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cq-start">Start date *</Label>
                  <Input
                    id="cq-start"
                    type="date"
                    value={form.startDate}
                    onChange={set("startDate")}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cq-end">End date *</Label>
                  <Input
                    id="cq-end"
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={set("endDate")}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              {days > 0 && (
                <div className="mt-2 text-sm text-slate-500 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{days} day{days !== 1 ? "s" : ""}</span>
                  {days < 7 && (
                    <span className="text-amber-600 font-medium">⚠ Minimum is 7 days</span>
                  )}
                </div>
              )}
            </section>

            <hr className="border-slate-100" />

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Pricing
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="cq-rate">Daily rate (£)</Label>
                  <Input
                    id="cq-rate"
                    type="number"
                    min="0"
                    step="1"
                    value={form.dailyRate}
                    onChange={set("dailyRate")}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-400 mt-1">Tiered: 1wk £70, 2wk £60, 3wk £50, 4+wk £45</p>
                </div>
                <div>
                  <Label htmlFor="cq-delivery">Delivery (£)</Label>
                  <Input
                    id="cq-delivery"
                    type="number"
                    min="0"
                    step="1"
                    value={form.deliveryCost}
                    onChange={set("deliveryCost")}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-400 mt-1">Auto-calculated from postcode (min £75 each)</p>
                </div>
                <div>
                  <Label htmlFor="cq-collection">Collection (£)</Label>
                  <Input
                    id="cq-collection"
                    type="number"
                    min="0"
                    step="1"
                    value={form.collectionCost}
                    onChange={set("collectionCost")}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-400 mt-1">Same as delivery (editable)</p>
                </div>
              </div>

              {/* Hire subtotal breakdown */}
              {days > 0 && (
                <div className="mt-3 bg-slate-50 rounded-lg px-4 py-3 text-sm space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Hire ({days} days × £{Number(form.dailyRate).toFixed(0)})</span>
                    <span className="font-medium">£{dailyCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="font-medium">£{delivCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection</span>
                    <span className="font-medium">£{collCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Total */}
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-red-800">Total (ex VAT)</div>
                <div className="text-xs text-red-400 mt-0.5">What the customer will see</div>
              </div>
              <div className="text-2xl font-bold text-red-600">£{totalCost.toFixed(2)}</div>
            </div>

            <hr className="border-slate-100" />

            {/* ── Notes ────────────────────────────────────────────────────── */}
            <section>
              <Label htmlFor="cq-notes">Notes (optional)</Label>
              <textarea
                id="cq-notes"
                value={form.notes}
                onChange={set("notes")}
                placeholder="e.g. Reduced rate agreed due to referral. Delivery included in rate."
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </section>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pb-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={status === "sending"}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {status === "sending" ? (
                  <>
                    <span className="animate-spin inline-block">⟳</span> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Quote
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
