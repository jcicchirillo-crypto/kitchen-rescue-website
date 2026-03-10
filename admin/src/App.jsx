import React, { useMemo, useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfDay, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, Users, Mail, Loader2, Plus, Search, Settings, LogOut, Truck, Wallet, Calendar as CalendarIcon, ListTodo, RefreshCw, Sparkles, Trash2, X, Phone, MessageSquare, ClipboardCheck, Copy } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
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
import "./App.css";

const STATUS_MAP = {
  Confirmed: { color: "bg-emerald-100 text-emerald-700" },
  "Awaiting deposit": { color: "bg-amber-100 text-amber-700" },
  Cancelled: { color: "bg-rose-100 text-rose-700" },
};

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

function MonthCalendar({
  month,
  bookings,
  onSelectBooking,
}) {
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);

  // Resolve start/end date strings (yyyy-MM-dd) for a confirmed booking so calendar can show it
  const getBookingRange = (b) => {
    let startStr = toDateOnly(b.startDate);
    let endStr = toDateOnly(b.endDate);
    if (startStr && endStr) return { startStr, endStr };
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
    return { startStr: startStr || null, endStr: endStr || null };
  };

  const isConfirmedStatus = (s) => {
    const v = (s || "").toLowerCase();
    return v === "confirmed" || v === "deposit paid";
  };
  const bookingInRange = (b, day) => {
    if (!isConfirmedStatus(b.status)) return false;
    const { startStr, endStr } = getBookingRange(b);
    if (!startStr || !endStr) return false;
    const dayStr = format(startOfDay(day), "yyyy-MM-dd");
    return dayStr >= startStr && dayStr <= endStr;
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
                  className={`w-full text-left text-[11px] px-2 py-1 rounded-md truncate ${STATUS_MAP[b.status]?.color || "bg-slate-100 text-slate-700"}`}
                  title={`${b.id} • ${b.name}`}
                >
                  {b.pod} — {b.name.split(" ")[0]}
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
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [sendingConfirmationId, setSendingConfirmationId] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [leads, setLeads] = useState([]);
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

  const fetchLeads = async () => {
    const res = await fetch("/api/leads", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLeads(data);
    } else {
      setLeads([]);
    }
  };

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
              onClick={() => setShowCustomQuote(true)}
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

        <Card className="mb-4 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <MessageSquare className="h-5 w-5" />
              New Enquiries ({leads.length})
            </CardTitle>
            <CardDescription>Leads from availability gate, trade quotes, etc. Follow up to convert to bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No enquiries yet. Click Refresh to check for new leads.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name || '—'}</TableCell>
                      <TableCell>
                        {l.email ? (
                          <a href={`mailto:${l.email}`} className="text-red-600 hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {l.email}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {l.phone ? (
                          <a href={`tel:${l.phone}`} className="text-slate-700 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {l.phone}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {l.source || 'website'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {l.created_at ? format(new Date(l.created_at), "d MMM yyyy HH:mm") : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => {
                            setShowCreateBooking(true);
                            // Could prefill from lead in future
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Convert to booking
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
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
        onClose={() => setShowCustomQuote(false)}
      />
      <CreateBookingModal
        open={showCreateBooking}
        onClose={() => setShowCreateBooking(false)}
        onSuccess={() => {
          setShowCreateBooking(false);
          fetchBookings();
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
