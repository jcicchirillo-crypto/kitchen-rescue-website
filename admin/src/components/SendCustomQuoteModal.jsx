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

const COMPARE_WEEK_OPTIONS = [3, 4, 5, 6];
const SINGLE_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  startDate: "",
  endDate: "",
  hireWeeks: "",
  dailyRate: 70,
  deliveryCost: 100,
  collectionCost: 100,
  notes: "",
  quoteMode: "single",
  compareWeeks: [3, 4, 5, 6],
};

function buildDurationOption(startDate, weeks, deliveryCost, collectionCost) {
  const days = weeks * 7;
  const endDate = isoAddDays(startDate, days - 1);
  const dates = buildDateRange(startDate, endDate);
  const dailyRate = getDailyRateForDays(days);
  const dailyCost = days * dailyRate;
  const deliv = Number(deliveryCost) || 0;
  const coll = Number(collectionCost) || 0;
  return {
    weeks,
    days,
    startDate,
    endDate,
    selectedDates: dates,
    dailyRate,
    dailyCost,
    deliveryCost: deliv,
    collectionCost: coll,
    totalCost: dailyCost + deliv + coll,
  };
}

export function SendCustomQuoteModal({ open, onClose, onSent, initialValues = null }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [error, setError] = useState("");
  const [deliveryCalculating, setDeliveryCalculating] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null); // { miles, overLimit, note }

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        ...(initialValues || {}),
      });
      setStatus("idle");
      setError("");
      setDeliveryInfo(null);
    }
  }, [open, initialValues]);

  // Auto-apply tiered rate when dates change (single quote mode)
  useEffect(() => {
    if (form.quoteMode !== "single" || !form.startDate || !form.endDate) return;
    const dates = buildDateRange(form.startDate, form.endDate);
    if (dates.length >= 7) {
      const tiered = getDailyRateForDays(dates.length);
      setForm((f) => ({ ...f, dailyRate: tiered }));
    }
  }, [form.startDate, form.endDate, form.quoteMode]);

  // When weeks + start date are set, fill the end date automatically
  const applyWeeks = (weeks, startDate = form.startDate) => {
    const w = Number(weeks);
    if (!w || w < 1 || !startDate) {
      setForm((f) => ({ ...f, hireWeeks: weeks === "" ? "" : String(weeks) }));
      return;
    }
    const days = w * 7;
    const endDate = isoAddDays(startDate, days - 1);
    const tiered = getDailyRateForDays(days);
    setForm((f) => ({
      ...f,
      hireWeeks: String(w),
      startDate,
      endDate,
      dailyRate: tiered,
    }));
  };

  const onStartDateChange = (e) => {
    const startDate = e.target.value;
    if (form.hireWeeks && Number(form.hireWeeks) >= 1 && startDate) {
      applyWeeks(form.hireWeeks, startDate);
      return;
    }
    setForm((f) => ({ ...f, startDate }));
  };

  const onEndDateChange = (e) => {
    const endDate = e.target.value;
    // Clear weeks shortcut if they type a custom end date that isn't an exact week block
    setForm((f) => {
      if (!f.startDate || !endDate) return { ...f, endDate, hireWeeks: "" };
      const len = buildDateRange(f.startDate, endDate).length;
      const exactWeeks = len % 7 === 0 ? len / 7 : null;
      return {
        ...f,
        endDate,
        hireWeeks: exactWeeks ? String(exactWeeks) : "",
      };
    });
  };

  // Auto-calculate delivery cost from postcode when postcode changes
  useEffect(() => {
    const pc = (form.postcode || "").trim().toUpperCase();
    if (pc.length < 4) {
      setDeliveryInfo(null);
      return;
    }
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
          setDeliveryInfo({
            miles: data.miles,
            overLimit: !!data.overLimit,
            note: data.note || null,
          });
        } else {
          setDeliveryInfo({
            miles: null,
            overLimit: false,
            note: data.error || "Could not calculate delivery — enter costs manually.",
          });
        }
      } catch {
        setDeliveryInfo({
          miles: null,
          overLimit: false,
          note: "Could not calculate delivery — enter costs manually.",
        });
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
  const isCompareMode = form.quoteMode === "compare";
  const selectedCompareWeeks = (form.compareWeeks || []).slice().sort((a, b) => a - b);
  const durationOptions = isCompareMode && form.startDate
    ? selectedCompareWeeks.map((weeks) => buildDurationOption(form.startDate, weeks, delivCost, collCost))
    : [];
  const availabilityDates = isCompareMode
    ? (durationOptions[durationOptions.length - 1]?.selectedDates || [])
    : dates;

  const toggleCompareWeek = (weeks) => {
    setForm((f) => {
      const current = new Set(f.compareWeeks || []);
      if (current.has(weeks)) current.delete(weeks);
      else current.add(weeks);
      return { ...f, compareWeeks: COMPARE_WEEK_OPTIONS.filter((w) => current.has(w)) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.startDate) {
      setError("Please fill in name, email and start date.");
      return;
    }
    if (isCompareMode) {
      if (selectedCompareWeeks.length === 0) {
        setError("Select at least one duration to compare.");
        return;
      }
    } else if (!form.endDate) {
      setError("Please fill in name, email, start date and end date.");
      return;
    }
    if (!isCompareMode && days < 7) {
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
      const overlaps = availabilityDates.some((d) =>
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
      const primaryOption = isCompareMode ? durationOptions[0] : null;
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: (form.phone || "").trim(),
        notes: (form.notes || "").trim(),
        postcode: (form.postcode || "").toUpperCase().trim(),
        source: "admin-custom-quote",
        leadId: initialValues?.leadId || undefined,
        quoteMode: form.quoteMode,
        ...(isCompareMode
          ? {
              durationOptions,
              selectedDates: durationOptions[durationOptions.length - 1]?.selectedDates || [],
              startDate: form.startDate,
              endDate: primaryOption?.endDate,
              days: primaryOption?.days,
              dailyRate: primaryOption?.dailyRate,
              dailyCost: primaryOption?.dailyCost,
              deliveryCost: delivCost,
              collectionCost: collCost,
              totalCost: primaryOption?.totalCost,
            }
          : {
              selectedDates: dates,
              startDate: form.startDate,
              endDate: form.endDate,
              days,
              dailyRate: effectiveRate,
              dailyCost,
              deliveryCost: delivCost,
              collectionCost: collCost,
              totalCost,
            }),
      };
      if (!payload.selectedDates?.length) {
        setError("Please choose a valid hire period before sending.");
        setStatus("idle");
        return;
      }
      const res = await fetch("/send-quote-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("success");
        onSent?.();
      } else {
        setError(data.error || data.details || "Failed to send — please try again.");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, quoteMode: "single" }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${!isCompareMode ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Single duration
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, quoteMode: "compare" }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isCompareMode ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Compare 3–6 weeks
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={isCompareMode ? "col-span-2" : ""}>
                  <Label htmlFor="cq-start">Start date *</Label>
                  <Input
                    id="cq-start"
                    type="date"
                    value={form.startDate}
                    onChange={onStartDateChange}
                    className="mt-1"
                    required
                  />
                </div>
                {!isCompareMode && (
                  <div>
                    <Label htmlFor="cq-end">End date *</Label>
                    <Input
                      id="cq-end"
                      type="date"
                      value={form.endDate}
                      min={form.startDate}
                      onChange={onEndDateChange}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </div>
              {!isCompareMode && (
                <div className="mt-4">
                  <Label>Or pick weeks required</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SINGLE_WEEK_OPTIONS.map((weeks) => {
                      const selected = String(form.hireWeeks) === String(weeks);
                      return (
                        <button
                          key={weeks}
                          type="button"
                          onClick={() => {
                            if (!form.startDate) {
                              setForm((f) => ({ ...f, hireWeeks: String(weeks) }));
                              setError("Pick a start date first, then choose weeks.");
                              return;
                            }
                            setError("");
                            applyWeeks(weeks);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${selected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {weeks} week{weeks !== 1 ? "s" : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-end gap-2 max-w-xs">
                    <div className="flex-1">
                      <Label htmlFor="cq-weeks">Custom weeks</Label>
                      <Input
                        id="cq-weeks"
                        type="number"
                        min="1"
                        max="52"
                        step="1"
                        placeholder="e.g. 7"
                        value={form.hireWeeks}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) {
                            setForm((f) => ({ ...f, hireWeeks: "" }));
                            return;
                          }
                          if (form.startDate) applyWeeks(v);
                          else setForm((f) => ({ ...f, hireWeeks: v }));
                        }}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mb-0.5"
                      disabled={!form.startDate || !Number(form.hireWeeks)}
                      onClick={() => applyWeeks(form.hireWeeks)}
                    >
                      Set end date
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Example: start Monday + 6 weeks → end date filled for 42 days. You can still edit the end date manually.
                  </p>
                </div>
              )}
              {isCompareMode ? (
                <div className="mt-4">
                  <Label>Durations to include</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COMPARE_WEEK_OPTIONS.map((weeks) => {
                      const selected = selectedCompareWeeks.includes(weeks);
                      return (
                        <button
                          key={weeks}
                          type="button"
                          onClick={() => toggleCompareWeek(weeks)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${selected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {weeks} weeks
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    The customer will see all selected options in one quotation email.
                  </p>
                </div>
              ) : days > 0 ? (
                <div className="mt-2 text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700">{days} day{days !== 1 ? "s" : ""}</span>
                  {form.hireWeeks ? (
                    <span className="text-slate-600">({form.hireWeeks} week{Number(form.hireWeeks) !== 1 ? "s" : ""})</span>
                  ) : null}
                  {days < 7 && (
                    <span className="text-amber-600 font-medium">⚠ Minimum is 7 days</span>
                  )}
                </div>
              ) : null}
            </section>

            <hr className="border-slate-100" />

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Pricing
              </p>
              <div className={`grid gap-3 ${isCompareMode ? "grid-cols-2" : "grid-cols-3"}`}>
                {!isCompareMode && (
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
                )}
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
                  <p className="text-xs text-slate-400 mt-1">
                    {deliveryCalculating
                      ? "Calculating from postcode…"
                      : "£2/mile one-way, min £100 each. Editable."}
                  </p>
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
                  <p className="text-xs text-slate-400 mt-1">Same as delivery by default (editable)</p>
                </div>
              </div>
              {deliveryInfo?.note && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${deliveryInfo.overLimit ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-slate-50 text-slate-600"}`}>
                  {deliveryInfo.miles != null ? `${deliveryInfo.miles} miles from base. ` : ""}
                  {deliveryInfo.note}
                  {deliveryInfo.overLimit && (
                    <span className="block mt-1 font-medium">
                      Suggested each way: £{Number(form.deliveryCost).toFixed(0)} (total delivery+collection £{(Number(form.deliveryCost) + Number(form.collectionCost)).toFixed(0)}). Adjust if you want a different long-distance rate.
                    </span>
                  )}
                </div>
              )}

              {/* Hire subtotal breakdown */}
              {isCompareMode && durationOptions.length > 0 ? (
                <div className="mt-3 bg-slate-50 rounded-lg px-4 py-3 text-sm space-y-2 text-slate-600">
                  {durationOptions.map((opt) => (
                    <div key={opt.weeks} className="flex justify-between gap-3">
                      <span>{opt.weeks} weeks ({opt.days} days × £{opt.dailyRate})</span>
                      <span className="font-medium whitespace-nowrap">
                        Hire £{opt.dailyCost.toFixed(0)} + del £{(opt.deliveryCost + opt.collectionCost).toFixed(0)} = £{opt.totalCost.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : days > 0 ? (
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
              ) : null}
            </section>

            {/* Total */}
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-red-800">
                  {isCompareMode ? "Comparison quote" : "Total (hire + delivery + collection)"}
                </div>
                <div className="text-xs text-red-400 mt-0.5">
                  {isCompareMode
                    ? `${durationOptions.length} option${durationOptions.length !== 1 ? "s" : ""} — hire is included below, not just delivery`
                    : days > 0
                      ? "What the customer will see"
                      : "Choose dates to see the full hire total"}
                </div>
              </div>
              <div className="text-right">
                {isCompareMode && durationOptions.length > 0 ? (
                  <>
                    <div className="text-sm text-red-700">From</div>
                    <div className="text-2xl font-bold text-red-600">
                      £{durationOptions[0].totalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-500">
                      to £{durationOptions[durationOptions.length - 1].totalCost.toFixed(2)}
                    </div>
                  </>
                ) : days > 0 ? (
                  <div className="text-2xl font-bold text-red-600">£{totalCost.toFixed(2)}</div>
                ) : (
                  <div className="text-lg font-medium text-red-400">—</div>
                )}
              </div>
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
