import React, { useMemo, useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfDay, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, Users, Mail, Loader2, Plus, Search, Settings, LogOut, Truck, Wallet, Calendar as CalendarIcon, ListTodo, RefreshCw, Sparkles, Trash2, X, Phone, MessageSquare, ClipboardCheck, Copy, Pencil, Archive } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import Planner from "./Planner";
import ContentCreator from "./ContentCreator";
import Availability from "./pages/Availability";
import AccessibilityPage from "./pages/Accessibility";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import RefundsPage from "./pages/Refunds";
import { Footer } from "./components/Footer";
import { AnalyticsGate } from "./components/AnalyticsGate";
import { CookieBanner } from "./components/CookieBanner";
import { BUSINESS } from "./config/business";
import { SendCustomQuoteModal } from "./components/SendCustomQuoteModal";
import { CreateBookingModal } from "./components/CreateBookingModal";
import { EditBookingModal } from "./components/EditBookingModal";
import "./App.css";

const STATUS_MAP = {
  Confirmed: { color: "bg-emerald-100 text-emerald-700" },
  "Awaiting deposit": { color: "bg-amber-100 text-amber-700" },
  Cancelled: { color: "bg-rose-100 text-rose-700" },
};
const HIRE_TURNAROUND_DAYS_AFTER = 1;

async function sendBookingConfirmation(bookingId, token) {
  const res = await fetch("/api/booking/send-confirmation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to send");
  return data;
}

// Get yyyy-MM-dd from various date formats (ISO string, date-only, or Date)
function toDateOnly(val) {
  if (!val) return null;
  if (typeof val === "string") return val.slice(0, 10);
  try {
    const d = val instanceof Date ? val : parseISO(val);
    return isNaN(d.getTime()) ? null : format(startOfDay(d), "yyyy-MM-dd");
  } catch (_) {
    return null;
  }
}

function isoAddDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return format(d, "yyyy-MM-dd");
}

function toDateTimeLocalValue(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getQuoteTotal(quote) {
  const direct = quote?.totalCost ?? quote?.total_cost;
  if (direct != null && direct !== "" && !Number.isNaN(Number(direct))) {
    return Number(direct);
  }
  const daily = Number(quote?.dailyCost ?? quote?.daily_cost ?? 0);
  const delivery = Number(quote?.deliveryCost ?? quote?.delivery_cost ?? 0);
  const collection = Number(quote?.collectionCost ?? quote?.collection_cost ?? 0);
  const computed = daily + delivery + collection;
  return computed > 0 ? computed : null;
}

function MonthCalendar({
  month,
  bookings,
  onSelectBooking,
}) {
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);

  // Resolve start/end date strings (yyyy-MM-dd) for a confirmed booking so calendar can show hire plus cleaning buffer.
  const getBookingRange = (b) => {
    let startStr = toDateOnly(b.startDate);
    let endStr = toDateOnly(b.endDate);
    if (Array.isArray(b.selectedDates) && b.selectedDates.length > 0) {
      const first = b.selectedDates[0];
      const last = b.selectedDates[b.selectedDates.length - 1];
      if (first) startStr = startStr || (typeof first === "string" ? first.slice(0, 10) : toDateOnly(first));
      if (last) endStr = endStr || (typeof last === "string" ? last.slice(0, 10) : toDateOnly(last));
    }
    // Fallback: compute end from start + days (e.g. when backend only has delivery_date + hire_length)
    if ((!startStr || !endStr) && (b.delivery_date || b.deliveryDate)) {
      const deliveryStr = toDateOnly(b.delivery_date || b.deliveryDate);
      if (deliveryStr) startStr = startStr || deliveryStr;
    }
    const daysCount = Number(b.days ?? b.hire_length ?? b.hireLength ?? 0);
    if (startStr && !endStr && daysCount > 0) {
      const endDate = new Date(startStr + "T12:00:00");
      endDate.setDate(endDate.getDate() + daysCount - 1);
      endStr = format(endDate, "yyyy-MM-dd");
    }
    return {
      startStr: startStr || null,
      endStr: endStr || null,
      blockedEndStr: endStr ? isoAddDays(endStr, HIRE_TURNAROUND_DAYS_AFTER) : null,
    };
  };

  const isConfirmedStatus = (s) => {
    const v = (s || "").toLowerCase();
    return v === "confirmed" || v === "deposit paid";
  };
  const bookingInRange = (b, day) => {
    if (!isConfirmedStatus(b.status)) return false;
    const { startStr, blockedEndStr } = getBookingRange(b);
    if (!startStr || !blockedEndStr) return false;
    const dayStr = format(startOfDay(day), "yyyy-MM-dd");
    return dayStr >= startStr && dayStr <= blockedEndStr;
  };
  const isCleaningDay = (b, day) => {
    const { endStr, blockedEndStr } = getBookingRange(b);
    if (!endStr || !blockedEndStr) return false;
    const dayStr = format(startOfDay(day), "yyyy-MM-dd");
    return dayStr > endStr && dayStr <= blockedEndStr;
  };

  const firstDay = startOfMonth(month);
  const leadBlanks = (firstDay.getDay() + 6) % 7;

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
        <div key={d} className="text-xs font-medium text-slate-500 text-center">{d}</div>
      ))}
      {Array.from({ length: leadBlanks }, (_, i) => <div key={`blank-${i}`} />)}
      {days.map((day) => (
        <div key={+day} className={`min-h-[90px] rounded-xl border p-2 relative ${isToday(day) ? "border-red-600" : "border-slate-200"}`}>
          <div className="text-xs font-semibold">{format(day, "d")}</div>
          <div className="mt-1 space-y-1">
            {bookings
              .filter((b) => bookingInRange(b, day))
              .map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBooking(b.id)}
                  className={`w-full text-left text-[11px] px-2 py-1 rounded-md truncate ${isCleaningDay(b, day) ? "bg-orange-100 text-orange-700" : (STATUS_MAP[b.status]?.color || "bg-slate-100 text-slate-700")}`}
                  title={`${b.id} • ${b.name}`}
                >
                  {isCleaningDay(b, day) ? "Clean/prep" : b.pod} — {b.name.split(" ")[0]}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      onLogin();
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kitchen Rescue Admin</CardTitle>
          <CardDescription>Sign in to manage bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <Button className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function KitchenRescueAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showCustomQuote, setShowCustomQuote] = useState(false);
  const [customQuoteLead, setCustomQuoteLead] = useState(null);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [sendingConfirmationId, setSendingConfirmationId] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadNotesDraft, setLeadNotesDraft] = useState({});
  const [savingLeadId, setSavingLeadId] = useState(null);
  const [leadsTab, setLeadsTab] = useState("new");
  const [followUpTab, setFollowUpTab] = useState("open");
  const [quoteFollowUpDrafts, setQuoteFollowUpDrafts] = useState({});
  const [savingQuoteId, setSavingQuoteId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleDelete = (id) => {
    setSelectedToDelete((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const deleteSelected = async () => {
    if (selectedToDelete.length === 0) return;
    const token = localStorage.getItem("adminToken");
    setDeletingIds(selectedToDelete.slice());
    for (const id of selectedToDelete) {
      try {
        await fetch(`/api/bookings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      } catch (_) {}
    }
    setSelectedToDelete([]);
    setDeletingIds([]);
    setConfirmationMessage({ type: "success", text: `Deleted ${selectedToDelete.length} item(s)` });
    fetchBookings();
  };

  const selectedBooking = useMemo(() => (selectedId ? bookings.find((b) => b.id === selectedId) : null), [selectedId, bookings]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsLoggedIn(true);
      fetchBookings();
      fetchLeads();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!confirmationMessage) return;
    const t = setTimeout(() => setConfirmationMessage(null), 5000);
    return () => clearTimeout(t);
  }, [confirmationMessage]);

  useEffect(() => {
    setQuoteFollowUpDrafts((prev) => {
      const next = { ...prev };
      for (const booking of bookings) {
        if (booking.source !== "quote" && booking.source !== "admin-custom-quote") continue;
        if (!next[booking.id]) {
          next[booking.id] = {
            followUpAt: toDateTimeLocalValue(booking.follow_up_at),
            followUpStatus: booking.follow_up_status || "open",
            notes: booking.notes || "",
          };
        }
      }
      return next;
    });
  }, [bookings]);

  const fetchLeads = async () => {
    const res = await fetch("/api/leads", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLeads(data);
      setLeadNotesDraft((prev) => {
        const next = { ...prev };
        for (const lead of data) {
          if (next[lead.id] === undefined) next[lead.id] = lead.notes || "";
        }
        return next;
      });
    } else {
      setLeads([]);
    }
  };

  const saveLeadUpdate = async (id, updates) => {
    const token = localStorage.getItem("adminToken");
    setSavingLeadId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      return updated;
    } catch (err) {
      setConfirmationMessage({ type: "error", text: err.message || "Failed to save lead update" });
      return null;
    } finally {
      setSavingLeadId(null);
    }
  };

  const toggleLeadFollowedUp = async (lead) => {
    const next = !lead.followed_up;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, followed_up: next } : l)));
    const result = await saveLeadUpdate(lead.id, { followed_up: next });
    if (!result) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, followed_up: lead.followed_up } : l)));
      return;
    }
    if (next) {
      setConfirmationMessage({ type: "success", text: `${lead.name || "Enquiry"} moved to archive` });
    }
  };

  const saveLeadNotes = async (lead) => {
    const notes = leadNotesDraft[lead.id] ?? "";
    if (notes === (lead.notes || "")) return;
    const result = await saveLeadUpdate(lead.id, { notes });
    if (result) {
      setLeadNotesDraft((prev) => ({ ...prev, [lead.id]: result.notes || "" }));
    }
  };

  const activeLeads = useMemo(() => leads.filter((l) => !l.followed_up), [leads]);
  const archivedLeads = useMemo(() => leads.filter((l) => l.followed_up), [leads]);
  const quoteBookings = useMemo(
    () => bookings.filter((b) => b.source === "quote" || b.source === "admin-custom-quote"),
    [bookings]
  );
  const openQuoteBookings = useMemo(
    () => quoteBookings.filter((b) => !["won", "lost", "closed"].includes((b.follow_up_status || "open").toLowerCase())),
    [quoteBookings]
  );
  const closedQuoteBookings = useMemo(
    () => quoteBookings.filter((b) => ["won", "lost", "closed"].includes((b.follow_up_status || "").toLowerCase())),
    [quoteBookings]
  );

  const openCustomQuoteForLead = (lead) => {
    setCustomQuoteLead({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      postcode: lead.postcode || "",
      notes: lead.notes || "",
    });
    setShowCustomQuote(true);
  };

  const saveQuoteFollowUp = async (quote) => {
    const draft = quoteFollowUpDrafts[quote.id];
    if (!draft) return;
    const token = localStorage.getItem("adminToken");
    setSavingQuoteId(quote.id);
    try {
      const followUpAt = draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null;
      const followUpChanged = (quote.follow_up_at || null) !== followUpAt;
      const payload = {
        followUpAt,
        followUpStatus: draft.followUpStatus || "open",
        notes: draft.notes || "",
      };
      if (followUpChanged) payload.followUpReminderSentAt = null;
      const res = await fetch(`/api/bookings/${quote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save follow-up");
      setConfirmationMessage({ type: "success", text: `Follow-up saved for ${quote.name || quote.id}` });
      fetchBookings();
    } catch (err) {
      setConfirmationMessage({ type: "error", text: err.message || "Failed to save follow-up" });
    } finally {
      setSavingQuoteId(null);
    }
  };

  const renderQuoteRows = (items) =>
    items.map((quote) => {
      const draft = quoteFollowUpDrafts[quote.id] || {
        followUpAt: "",
        followUpStatus: "open",
        notes: quote.notes || "",
      };
      const due = quote.follow_up_at && new Date(quote.follow_up_at) <= new Date() && (quote.follow_up_status || "open") === "open";
      return (
        <TableRow key={quote.id}>
          <TableCell className="font-medium">
            <div>{quote.name || "—"}</div>
            <div className="text-xs text-slate-400">{quote.id}</div>
          </TableCell>
          <TableCell>
            {quote.email ? (
              <a href={`mailto:${quote.email}`} className="text-red-600 hover:underline">{quote.email}</a>
            ) : "—"}
          </TableCell>
          <TableCell className="text-sm text-slate-500 whitespace-nowrap">
            {quote.quote_sent_at || quote.createdAt || quote.timestamp
              ? format(new Date(quote.quote_sent_at || quote.createdAt || quote.timestamp), "d MMM yyyy HH:mm")
              : "—"}
          </TableCell>
          <TableCell className="whitespace-nowrap font-medium">
            {(() => {
              const total = getQuoteTotal(quote);
              return total != null ? `£${total.toFixed(2)}` : "—";
            })()}
          </TableCell>
          <TableCell>
            <Input
              type="datetime-local"
              value={draft.followUpAt}
              onChange={(e) =>
                setQuoteFollowUpDrafts((prev) => ({
                  ...prev,
                  [quote.id]: { ...draft, followUpAt: e.target.value },
                }))
              }
            />
            {due ? <p className="text-xs text-rose-600 mt-1">Follow-up due now</p> : null}
          </TableCell>
          <TableCell>
            <select
              value={draft.followUpStatus}
              onChange={(e) =>
                setQuoteFollowUpDrafts((prev) => ({
                  ...prev,
                  [quote.id]: { ...draft, followUpStatus: e.target.value },
                }))
              }
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              <option value="open">Open</option>
              <option value="called">Called</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="closed">Closed</option>
            </select>
          </TableCell>
          <TableCell>
            <Textarea
              value={draft.notes}
              onChange={(e) =>
                setQuoteFollowUpDrafts((prev) => ({
                  ...prev,
                  [quote.id]: { ...draft, notes: e.target.value },
                }))
              }
              placeholder="Follow-up notes…"
              className="min-h-[60px] text-xs resize-y"
            />
          </TableCell>
          <TableCell className="text-right">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              title="Save follow-up date, status and notes for this quote"
              onClick={() => saveQuoteFollowUp(quote)}
              disabled={savingQuoteId === quote.id}
            >
              {savingQuoteId === quote.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Save follow-up
            </Button>
          </TableCell>
        </TableRow>
      );
    });

  const renderLeadRows = (items) =>
    items.map((l) => (
      <TableRow key={l.id}>
        <TableCell className="text-center">
          <label className="inline-flex items-center justify-center gap-2 cursor-pointer" title={l.followed_up ? "Uncheck to restore to new enquiries" : "Mark as followed up and archive"}>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={!!l.followed_up}
              disabled={savingLeadId === l.id}
              onChange={() => toggleLeadFollowedUp(l)}
              aria-label={l.followed_up ? `Restore ${l.name || "lead"} to new enquiries` : `Mark ${l.name || "lead"} as followed up`}
            />
            {savingLeadId === l.id ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" /> : null}
          </label>
        </TableCell>
        <TableCell className="font-medium">{l.name || "—"}</TableCell>
        <TableCell>
          {l.email ? (
            <a href={`mailto:${l.email}`} className="text-red-600 hover:underline flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {l.email}
            </a>
          ) : "—"}
        </TableCell>
        <TableCell>
          {l.phone ? (
            <a href={`tel:${l.phone}`} className="text-slate-700 hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {l.phone}
            </a>
          ) : "—"}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {l.source || "website"}
          </Badge>
        </TableCell>
        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
          {l.created_at ? format(new Date(l.created_at), "d MMM yyyy HH:mm") : "—"}
        </TableCell>
        <TableCell>
          <Textarea
            value={leadNotesDraft[l.id] ?? l.notes ?? ""}
            onChange={(e) => setLeadNotesDraft((prev) => ({ ...prev, [l.id]: e.target.value }))}
            onBlur={() => saveLeadNotes(l)}
            placeholder="Add follow-up notes…"
            className="min-h-[60px] text-xs resize-y"
            disabled={savingLeadId === l.id}
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-red-700 border-red-300 hover:bg-red-50"
              onClick={() => openCustomQuoteForLead(l)}
            >
              <Mail className="h-3 w-3" />
              Custom quote
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setShowCreateBooking(true)}
            >
              <Plus className="h-3 w-3" />
              Convert to booking
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));

  const leadsTableHeader = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-24 text-center">Followed up</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Source</TableHead>
        <TableHead>Created</TableHead>
        <TableHead className="min-w-[220px]">Notes</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    if (res.ok) {
      const data = await res.json();
      console.log('📥 Admin received bookings:', data.length);
      
      // Count trade pack requests
      const tradePackRequests = data.filter(b => 
        b.status === 'Trade Pack Request' || 
        b.source === 'trade-landing' || 
        b.source === 'trade-quote' ||
        b.source === 'trade-quote-calculated'
      );
      console.log('📦 Trade pack requests in response:', tradePackRequests.length);
      
      // Count December 2024
      const december2024 = data.filter(b => {
        if (!b.createdAt && !b.timestamp) return false;
        const date = new Date(b.createdAt || b.timestamp);
        return date.getMonth() === 11 && date.getFullYear() === 2024;
      });
      console.log('📅 December 2024 bookings in response:', december2024.length);
      
      if (data.length > 0) {
        console.log('Sample booking:', data[0]);
      }
      if (tradePackRequests.length > 0) {
        console.log('Sample trade pack request:', tradePackRequests[0]);
      }
      if (december2024.length > 0) {
        console.log('Sample December booking:', december2024[0]);
      }
      
      // Data is already mapped from Supabase schema in bookings-storage.js
      const mappedBookings = data.map(b => ({
        ...b,
        startDate: b.startDate || b.delivery_date || b.selectedDates?.[0] || new Date().toISOString(),
        endDate: b.endDate || b.selectedDates?.[b.selectedDates?.length - 1] || new Date().toISOString(),
      }));
      console.log('📊 Mapped bookings:', mappedBookings.length);
      
      // Log all trade pack requests after mapping
      const mappedTradePack = mappedBookings.filter(b => 
        b.status === 'Trade Pack Request' || 
        b.source === 'trade-landing' || 
        b.source === 'trade-quote' ||
        b.source === 'trade-quote-calculated'
      );
      console.log('📦 Trade pack requests after mapping:', mappedTradePack.length);
      if (mappedTradePack.length > 0) {
        console.log('All trade pack requests:', mappedTradePack.map(b => ({
          id: b.id,
          name: b.name,
          email: b.email,
          status: b.status,
          source: b.source,
          createdAt: b.createdAt || b.timestamp
        })));
      }
      
      setBookings(mappedBookings);
    } else {
      console.error('❌ Failed to fetch bookings:', res.status, res.statusText);
    }
  };

  const filtered = useMemo(() => {
    if (!query?.trim()) return bookings;
    const q = query.toLowerCase();
    return bookings.filter((b) =>
      [b.id, b.name, b.email, b.postcode, b.pod, b.status].join(" ").toLowerCase().includes(q)
    );
  }, [bookings, query]);

  if (!isLoggedIn) return <LoginForm onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <span className="font-semibold">Kitchen Rescue — Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateBooking(true)}
            >
              <Plus className="h-4 w-4" />
              Create Booking
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setCustomQuoteLead(null);
                setShowCustomQuote(true);
              }}
            >
              <Mail className="h-4 w-4" />
              Send Custom Quote
            </Button>
            <Link to="/planner">
              <Button variant="outline" size="sm" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Task Planner
              </Button>
            </Link>
            <Link to="/content-creator">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Content Creator
              </Button>
            </Link>
            <Button variant="ghost" size="icon"><Settings className="h-4 w-4"/></Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              localStorage.removeItem("adminToken");
              setIsLoggedIn(false);
            }}><LogOut className="h-4 w-4"/>Log out</Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat icon={CalendarIcon} label="Pod on hire" value={bookings.filter(b=>b.status==="Confirmed").length} />
          <Stat icon={CreditCard} label="Deposits pending" value={bookings.filter(b=>b.status!=="Confirmed" && b.status!=="Quote Calculated" && b.status!=="Trade Quote Request" && b.status!=="Cancelled").length} />
          <Stat icon={Users} label="Customers" value={new Set(bookings.map(b=>b.email)).size} />
          <Stat icon={Wallet} label="This month revenue" value={`£${bookings.filter(b=>b.status==="Confirmed").reduce((s,b)=> s + (b.totalCost||0),0).toFixed(0)}`} />
        </div>

        <Card className={`mb-4 ${
          leadsTab === "new"
            ? "border-amber-200 bg-amber-50/50"
            : leadsTab === "follow-up"
              ? "border-red-200 bg-red-50/40"
              : "border-slate-200 bg-slate-50/80"
        }`}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 -mt-2 mb-3">
              <button
                type="button"
                onClick={() => setLeadsTab("new")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${leadsTab === "new" ? "border-amber-500 text-amber-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                <MessageSquare className="h-4 w-4" />
                New Enquiries
                <Badge className={`${leadsTab === "new" ? "bg-amber-200 text-amber-900 hover:bg-amber-200" : "bg-slate-200 text-slate-700 hover:bg-slate-200"}`}>
                  {activeLeads.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setLeadsTab("follow-up")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${leadsTab === "follow-up" ? "border-red-500 text-red-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                <Mail className="h-4 w-4" />
                Follow Up
                <Badge className={`${leadsTab === "follow-up" ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-slate-200 text-slate-700 hover:bg-slate-200"}`}>
                  {openQuoteBookings.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setLeadsTab("archived")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${leadsTab === "archived" ? "border-slate-500 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                <Archive className="h-4 w-4" />
                Archive
                <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
                  {archivedLeads.length}
                </Badge>
              </button>
            </div>
            {leadsTab === "follow-up" && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFollowUpTab("open")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${followUpTab === "open" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Open ({openQuoteBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpTab("closed")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${followUpTab === "closed" ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Closed ({closedQuoteBookings.length})
                </button>
              </div>
            )}
            <CardDescription>
              {leadsTab === "new"
                ? 'Tick "Followed up" when your colleague has contacted them — they\'ll move to the Archive tab. Add notes before archiving if needed.'
                : leadsTab === "follow-up"
                  ? "Sent custom quotes. Set a follow-up date/time and status, then click Save follow-up on each row. We'll email you when it's due. Quotes also stay in Customers."
                  : "Followed-up leads. Uncheck to move them back to New Enquiries."}
            </CardDescription>
            {confirmationMessage && (
              <p className={`text-sm mt-2 px-3 py-2 rounded-md ${confirmationMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                {confirmationMessage.text}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {leadsTab === "new" ? (
              activeLeads.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">
                  {leads.length === 0
                    ? "No enquiries yet. Click Refresh to check for new leads."
                    : "No enquiries awaiting follow-up. All caught up!"}
                </p>
              ) : (
                <Table>
                  {leadsTableHeader}
                  <TableBody>{renderLeadRows(activeLeads)}</TableBody>
                </Table>
              )
            ) : leadsTab === "follow-up" ? (
              followUpTab === "open" ? (
                openQuoteBookings.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No open quote follow-ups right now.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Quote sent</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Next follow-up</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="min-w-[220px]">Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderQuoteRows(openQuoteBookings)}</TableBody>
                  </Table>
                )
              ) : closedQuoteBookings.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No closed quote follow-ups yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quote sent</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Next follow-up</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-[220px]">Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderQuoteRows(closedQuoteBookings)}</TableBody>
                </Table>
              )
            ) : archivedLeads.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No archived enquiries yet.</p>
            ) : (
              <Table>
                {leadsTableHeader}
                <TableBody>{renderLeadRows(archivedLeads)}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
            <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search bookings..." className="pl-8"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchBookings(); fetchLeads(); }} className="gap-2">
              <RefreshCw className="h-4 w-4"/>
              Refresh
            </Button>
            <Button variant="outline" size="icon" onClick={()=>setMonth(subMonths(month,1))}><ChevronLeft className="h-4 w-4"/></Button>
            <div className="px-2 text-sm font-medium w-44 text-center">{format(month, "MMMM yyyy")}</div>
            <Button variant="outline" size="icon" onClick={()=>setMonth(addMonths(month,1))}><ChevronRight className="h-4 w-4"/></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5"/> Calendar</CardTitle>
              <CardDescription>Month view of bookings. Click a booking to view details.</CardDescription>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[140px] text-center font-medium text-slate-700">{format(month, "MMMM yyyy")}</span>
                <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MonthCalendar month={month} bookings={filtered} onSelectBooking={setSelectedId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payments</CardTitle>
              <CardDescription>Recent deposits. Click Confirm after payment received to send confirmation email.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Confirm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.slice(0, 5).map((b) => (
                    <TableRow key={b.id} onClick={()=>setSelectedId(b.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_MAP[b.status]?.color}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">£{b.totalCost?.toFixed(0) || 0}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {b.email ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            disabled={sendingConfirmationId === b.id}
                            onClick={async () => {
                              setSendingConfirmationId(b.id);
                              setConfirmationMessage(null);
                              try {
                                const token = localStorage.getItem("adminToken");
                                await sendBookingConfirmation(b.id, token);
                                setConfirmationMessage({ type: "success", text: `Confirmation email sent to ${b.email}` });
                                fetchBookings();
                              } catch (e) {
                                setConfirmationMessage({ type: "error", text: e.message || "Failed to send" });
                              } finally {
                                setSendingConfirmationId(null);
                              }
                            }}
                          >
                            {sendingConfirmationId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            {sendingConfirmationId === b.id ? "Sending…" : "Confirm"}
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Customers</CardTitle>
            <CardDescription>All bookings and contact details. Use &quot;Send confirmation&quot; after payment is received to email the customer and mark as Confirmed.</CardDescription>
            {confirmationMessage && (
              <p className={`text-sm mt-2 px-3 py-2 rounded-md ${confirmationMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                {confirmationMessage.text}
              </p>
            )}
            {selectedToDelete.length > 0 && (
              <Button size="sm" variant="destructive" className="gap-2 mt-2" onClick={deleteSelected} disabled={deletingIds.length > 0}>
                {deletingIds.length > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete {selectedToDelete.length} selected
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(b.id)}>
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300" checked={selectedToDelete.includes(b.id)} onChange={() => toggleDelete(b.id)} aria-label={`Select ${b.id} to delete`} />
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1"><Mail className="h-3 w-3"/>{b.email}</TableCell>
                    <TableCell className="text-xs">{b.phone}</TableCell>
                    <TableCell className="text-xs">{b.postcode}</TableCell>
                    <TableCell className="text-xs">{b.pod || 'N/A'}<div className="text-slate-400">{b.startDate ? format(new Date(b.startDate), "d MMM") : 'N/A'} – {b.endDate ? format(new Date(b.endDate), "d MMM") : 'N/A'}</div></TableCell>
                    <TableCell>
                      {(b.source === 'booking' || (b.source === 'quote' && b.status === 'Confirmed')) && <Badge className="bg-emerald-100 text-emerald-700">Booking</Badge>}
                      {b.source === 'quote' && b.status !== 'Confirmed' && <Badge className="bg-blue-100 text-blue-700">Quote Request</Badge>}
                      {b.source === 'trade-quote' && <Badge className="bg-purple-100 text-purple-700">Trade Quote</Badge>}
                      {b.source === 'trade-quote-calculated' && <Badge className="bg-orange-100 text-orange-700">Quote Calculated</Badge>}
                      {b.source === 'trade-landing' && <Badge className="bg-green-100 text-green-700">Trade Pack</Badge>}
                      {b.status === 'Trade Pack Request' && <Badge className="bg-green-100 text-green-700">Trade Pack</Badge>}
                      {!b.source && b.status !== 'Trade Pack Request' && <Badge className="bg-gray-100 text-gray-700">Direct</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[b.status]?.color}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {b.createdAt || b.timestamp ? format(new Date(b.createdAt || b.timestamp), "d MMM yyyy") : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setEditingBooking(b)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        {b.email ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          disabled={sendingConfirmationId === b.id}
                          onClick={async () => {
                            setSendingConfirmationId(b.id);
                            setConfirmationMessage(null);
                            try {
                              const token = localStorage.getItem("adminToken");
                              await sendBookingConfirmation(b.id, token);
                              setConfirmationMessage({ type: "success", text: `Confirmation email sent to ${b.email}` });
                              fetchBookings();
                            } catch (e) {
                              setConfirmationMessage({ type: "error", text: e.message || "Failed to send" });
                            } finally {
                              setSendingConfirmationId(null);
                            }
                          }}
                        >
                          {sendingConfirmationId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                          {sendingConfirmationId === b.id ? "Sending…" : "Confirm"}
                        </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <CreateBookingModal
          open={showCreateBooking}
          onClose={() => setShowCreateBooking(false)}
          onCreated={() => {
            fetchBookings();
            setConfirmationMessage({ type: "success", text: "Booking created successfully" });
          }}
        />
        <EditBookingModal
          open={!!editingBooking}
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onUpdated={() => {
            fetchBookings();
            setConfirmationMessage({ type: "success", text: "Booking updated successfully" });
          }}
        />
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedId(null)}>
            <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-lg">Booking details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto pt-4 space-y-3">
                <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-500">Reference</span><span className="font-medium">{selectedBooking.id}</span>
                  <span className="text-slate-500">Customer</span><span>{selectedBooking.name}</span>
                  <span className="text-slate-500">Email</span><span><a href={`mailto:${selectedBooking.email}`} className="text-red-600 hover:underline">{selectedBooking.email}</a></span>
                  <span className="text-slate-500">Phone</span><span>{selectedBooking.phone || '—'}</span>
                  <span className="text-slate-500">Postcode</span><span>{selectedBooking.postcode || '—'}</span>
                  <span className="text-slate-500">Address</span><span className="break-words">{selectedBooking.deliveryAddress || '—'}</span>
                  <span className="text-slate-500">Pod</span><span>{selectedBooking.pod || '—'}</span>
                  <span className="text-slate-500">Delivery</span><span>{selectedBooking.startDate ? format(new Date(selectedBooking.startDate), "d MMM yyyy") : '—'}</span>
                  <span className="text-slate-500">Collection</span><span>{selectedBooking.endDate ? format(new Date(selectedBooking.endDate), "d MMM yyyy") : '—'}</span>
                  <span className="text-slate-500">Clean/prep blocked</span><span>{selectedBooking.endDate ? format(new Date(isoAddDays(toDateOnly(selectedBooking.endDate), HIRE_TURNAROUND_DAYS_AFTER) + "T12:00:00"), "d MMM yyyy") : '—'}</span>
                  <span className="text-slate-500">Hire length</span><span>{selectedBooking.days ?? selectedBooking.hireLength ?? '—'} days</span>
                  <span className="text-slate-500">Daily cost</span><span>£{selectedBooking.dailyCost != null ? Number(selectedBooking.dailyCost).toFixed(2) : '—'}</span>
                  <span className="text-slate-500">Delivery cost</span><span>£{selectedBooking.deliveryCost != null ? Number(selectedBooking.deliveryCost).toFixed(2) : '—'}</span>
                  <span className="text-slate-500">Collection cost</span><span>£{selectedBooking.collectionCost != null ? Number(selectedBooking.collectionCost).toFixed(2) : '—'}</span>
                  <span className="text-slate-500">Total cost</span><span className="font-semibold">£{selectedBooking.totalCost != null ? Number(selectedBooking.totalCost).toFixed(2) : '—'}</span>
                  <span className="text-slate-500">Status</span><span><Badge className={STATUS_MAP[selectedBooking.status]?.color}>{selectedBooking.status}</Badge></span>
                  <span className="text-slate-500">Source</span><span>{(selectedBooking.source === 'booking' || (selectedBooking.source === 'quote' && selectedBooking.status === 'Confirmed')) ? 'Booking' : selectedBooking.source || '—'}</span>
                  <span className="text-slate-500">Created</span><span>{selectedBooking.createdAt || selectedBooking.timestamp ? format(new Date(selectedBooking.createdAt || selectedBooking.timestamp), "d MMM yyyy HH:mm") : '—'}</span>
                  {selectedBooking.notes && (<><span className="text-slate-500">Notes</span><span className="break-words">{selectedBooking.notes}</span></>)}
                </div>
                <div className="pt-3 border-t flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(selectedBooking)}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit booking
                  </button>
                  <a
                    href={`/delivery-check?name=${encodeURIComponent(selectedBooking.name || '')}&address=${encodeURIComponent(selectedBooking.deliveryAddress || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Open delivery checklist
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      const url = `${window.location.origin}/delivery-check?name=${encodeURIComponent(selectedBooking.name || '')}&address=${encodeURIComponent(selectedBooking.deliveryAddress || '')}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch {}
                    }}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    {linkCopied ? 'Copied!' : 'Copy link for WhatsApp'}
                  </button>
                  <p className="text-xs text-slate-500 w-full">Share with driver – opens in new tab or paste in WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />

      <SendCustomQuoteModal
        open={showCustomQuote}
        initialValues={customQuoteLead}
        onSent={() => {
          fetchBookings();
          setLeadsTab("follow-up");
          setFollowUpTab("open");
        }}
        onClose={() => {
          setShowCustomQuote(false);
          setCustomQuoteLead(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* Cookie Consent Banner */}
      <CookieBanner />
      
      {/* Analytics - only loads if consent is "all" */}
      <AnalyticsGate />
      
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow focus:outline focus:outline-2 focus:outline-red-600 focus:outline-offset-2"
      >
        Skip to content
      </a>
      
      <Routes>
        <Route path="/" element={<KitchenRescueAdmin />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/content-creator" element={<ContentCreator />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
      </Routes>
    </Router>
  );
}
