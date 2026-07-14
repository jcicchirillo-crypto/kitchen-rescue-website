import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Phone, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

function toDateKey(value) {
  if (!value) return null;
  try {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return format(startOfDay(d), "yyyy-MM-dd");
  } catch {
    return null;
  }
}

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `£${num.toFixed(0)}`;
}

function isOpenStatus(status) {
  return !["won", "lost", "closed"].includes(String(status || "open").toLowerCase());
}

/**
 * Week calendar + to-do list for quote follow-ups.
 * Incomplete past-due items roll to today and show in red.
 */
export function QuoteFollowUpCalendar({ quotes, onSave, savingId }) {
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [localQuotes, setLocalQuotes] = useState(quotes);
  const rolloverDone = useRef(false);

  useEffect(() => {
    setLocalQuotes(quotes);
  }, [quotes]);

  const openQuotes = useMemo(
    () => localQuotes.filter((q) => isOpenStatus(q.follow_up_status)),
    [localQuotes]
  );

  // Roll incomplete past follow-ups forward to today (once per day per browser)
  useEffect(() => {
    if (rolloverDone.current) return;
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const last = localStorage.getItem("quote-followup-last-rollover");
    if (last === todayKey) {
      rolloverDone.current = true;
      return;
    }

    const pastDue = openQuotes.filter((q) => {
      const key = toDateKey(q.follow_up_at);
      return key && key < todayKey;
    });

    if (pastDue.length === 0) {
      rolloverDone.current = true;
      localStorage.setItem("quote-followup-last-rollover", todayKey);
      return;
    }

    rolloverDone.current = true;
    localStorage.setItem("quote-followup-last-rollover", todayKey);
    const rolledKey = `quote-followup-rolled-${todayKey}`;
    const rolledIds = new Set(JSON.parse(localStorage.getItem(rolledKey) || "[]"));

    const todayIso = new Date(`${todayKey}T09:00:00`).toISOString();
    (async () => {
      for (const quote of pastDue) {
        rolledIds.add(quote.id);
        const updated = {
          ...quote,
          follow_up_at: todayIso,
          _rolledOver: true,
        };
        setLocalQuotes((prev) => prev.map((q) => (q.id === quote.id ? updated : q)));
        await onSave?.(quote, {
          followUpAt: todayIso,
          followUpStatus: quote.follow_up_status || "open",
          notes: quote.notes || "",
          followUpReminderSentAt: null,
          silent: true,
        });
      }
      localStorage.setItem(rolledKey, JSON.stringify([...rolledIds]));
    })();
  }, [openQuotes, onSave]);

  // Restore rolled-over styling after refresh
  useEffect(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const rolledIds = new Set(
      JSON.parse(localStorage.getItem(`quote-followup-rolled-${todayKey}`) || "[]")
    );
    if (rolledIds.size === 0) return;
    setLocalQuotes((prev) =>
      prev.map((q) => (rolledIds.has(q.id) ? { ...q, _rolledOver: true } : q))
    );
  }, [quotes]);

  const days = eachDayOfInterval({
    start: startOfWeek(week, { weekStartsOn: 1 }),
    end: endOfWeek(week, { weekStartsOn: 1 }),
  });

  const unscheduled = openQuotes.filter((q) => !toDateKey(q.follow_up_at));
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const quotesForDay = (day) =>
    openQuotes.filter((q) => {
      const key = toDateKey(q.follow_up_at);
      return key && isSameDay(parseISO(key), day);
    });

  const scheduleOn = async (quote, dateKey) => {
    const iso = new Date(`${dateKey}T09:00:00`).toISOString();
    setLocalQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id ? { ...q, follow_up_at: iso, _rolledOver: dateKey > todayKey ? false : q._rolledOver } : q
      )
    );
    await onSave?.(quote, {
      followUpAt: iso,
      followUpStatus: quote.follow_up_status || "open",
      notes: quote.notes || "",
      followUpReminderSentAt: null,
    });
  };

  const setStatus = async (quote, followUpStatus) => {
    setLocalQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, follow_up_status: followUpStatus } : q))
    );
    await onSave?.(quote, {
      followUpAt: quote.follow_up_at || null,
      followUpStatus,
      notes: quote.notes || "",
    });
  };

  const isOverdueCard = (quote) => {
    if (quote._rolledOver) return true;
    const key = toDateKey(quote.follow_up_at);
    if (!key) return false;
    return key < todayKey;
  };

  const FollowUpCard = ({ quote }) => {
    const overdue = isOverdueCard(quote);
    const busy = savingId === quote.id;
    return (
      <div
        className={`rounded-lg border p-2 text-xs space-y-1.5 ${
          overdue
            ? "border-red-400 bg-red-50 text-red-900"
            : "border-slate-200 bg-white text-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="font-semibold truncate">{quote.name || "—"}</div>
            <div className="text-[10px] opacity-70 truncate">{quote.email || quote.id}</div>
          </div>
          {overdue && (
            <Badge className="bg-red-600 text-white hover:bg-red-600 text-[9px] px-1.5 py-0">
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px]">
          <span>{money(quote.totalCost ?? quote.total_cost)}</span>
          <span className="capitalize">{quote.follow_up_status || "open"}</span>
        </div>
        {quote.phone ? (
          <a href={`tel:${quote.phone}`} className="inline-flex items-center gap-1 text-[10px] text-red-700 hover:underline">
            <Phone className="h-3 w-3" />
            {quote.phone}
          </a>
        ) : null}
        <div className="flex flex-wrap gap-1 pt-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px]"
            disabled={busy}
            onClick={() => scheduleOn(quote, todayKey)}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px]"
            disabled={busy}
            onClick={() => scheduleOn(quote, format(addDays(new Date(), 1), "yyyy-MM-dd"))}
          >
            Tomorrow
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px]"
            disabled={busy}
            onClick={() => setStatus(quote, "called")}
          >
            Called
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-6 px-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={busy}
            onClick={() => setStatus(quote, "won")}
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Won
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-[10px] text-slate-500"
            disabled={busy}
            onClick={() => setStatus(quote, "lost")}
          >
            Lost
          </Button>
        </div>
        <Input
          type="datetime-local"
          className="h-7 text-[10px]"
          value={
            quote.follow_up_at
              ? format(new Date(quote.follow_up_at), "yyyy-MM-dd'T'HH:mm")
              : ""
          }
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const iso = new Date(v).toISOString();
            setLocalQuotes((prev) =>
              prev.map((q) => (q.id === quote.id ? { ...q, follow_up_at: iso, _rolledOver: false } : q))
            );
          }}
          onBlur={(e) => {
            const v = e.target.value;
            if (!v) return;
            onSave?.(quote, {
              followUpAt: new Date(v).toISOString(),
              followUpStatus: quote.follow_up_status || "open",
              notes: quote.notes || "",
              followUpReminderSentAt: null,
            });
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => setWeek((w) => subWeeks(w, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium min-w-[180px] text-center">
          {format(days[0], "d MMM")} – {format(days[6], "d MMM yyyy")}
        </div>
        <Button type="button" variant="outline" size="icon" onClick={() => setWeek((w) => addWeeks(w, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        >
          This week
        </Button>
        <p className="text-xs text-slate-500 ml-auto">
          Missed follow-ups roll to today in red until Done / Won / Lost.
        </p>
      </div>

      {unscheduled.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="text-xs font-semibold text-amber-900 mb-2">
            Needs a follow-up date ({unscheduled.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((q) => (
              <FollowUpCard key={q.id} quote={q} />
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-7 gap-2 min-w-[900px]">
          {days.map((day) => {
            const dayQuotes = quotesForDay(day);
            const today = isToday(day);
            const past = isBefore(startOfDay(day), startOfDay(new Date())) && !today;
            return (
              <div
                key={+day}
                className={`rounded-xl border p-2 min-h-[180px] ${
                  today ? "border-red-400 bg-red-50/40" : past ? "border-slate-200 bg-slate-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <div className={`text-xs font-semibold mb-2 ${today ? "text-red-700" : "text-slate-600"}`}>
                  {format(day, "EEE d")}
                  {today ? " · Today" : ""}
                </div>
                <div className="space-y-2">
                  {dayQuotes.length === 0 ? (
                    <p className="text-[10px] text-slate-400">Nothing scheduled</p>
                  ) : (
                    dayQuotes.map((q) => <FollowUpCard key={q.id} quote={q} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
