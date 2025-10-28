import React, { useMemo, useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, Users, Mail, Loader2, Plus, Search, Settings, LogOut, Truck, Wallet, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import "./App.css";

const STATUS_MAP = {
  Confirmed: { color: "bg-emerald-100 text-emerald-700" },
  "Awaiting deposit": { color: "bg-amber-100 text-amber-700" },
  Cancelled: { color: "bg-rose-100 text-rose-700" },
};

function MonthCalendar({
  month,
  bookings,
  onSelectBooking,
}) {
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);
  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
        <div key={d} className="text-xs font-medium text-slate-500 text-center">{d}</div>
      ))}
      {days.map((day) => (
        <div key={+day} className={`min-h-[90px] rounded-xl border p-2 relative ${isToday(day) ? "border-red-600" : "border-slate-200"}`}>
          <div className="text-xs font-semibold">{format(day, "d")}</div>
          <div className="mt-1 space-y-1">
            {bookings
              .filter((b) => day >= startOfMonth(month) && day <= endOfMonth(month) && day >= new Date(b.startDate) && day <= new Date(b.endDate))
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

export default function KitchenRescueAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsLoggedIn(true);
      fetchBookings();
    }
  }, [isLoggedIn]);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    if (res.ok) {
      const data = await res.json();
      setBookings(data.map(b => ({
        ...b,
        startDate: b.startDate || b.selectedDates?.[0] || new Date().toISOString(),
        endDate: b.endDate || b.selectedDates?.[b.selectedDates?.length - 1] || new Date().toISOString(),
      })));
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
            <Button variant="ghost" size="icon"><Settings className="h-4 w-4"/></Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              localStorage.removeItem("adminToken");
              setIsLoggedIn(false);
            }}><LogOut className="h-4 w-4"/>Log out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat icon={CalendarIcon} label="Pods on hire" value={bookings.length} />
          <Stat icon={CreditCard} label="Deposits pending" value={bookings.filter(b=>b.status!=="Confirmed").length} />
          <Stat icon={Users} label="Customers" value={new Set(bookings.map(b=>b.email)).size} />
          <Stat icon={Wallet} label="This month revenue" value={`£${bookings.reduce((s,b)=> s + (b.totalCost||0),0).toFixed(0)}`} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
            <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search bookings..." className="pl-8"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
            </CardHeader>
            <CardContent>
              <MonthCalendar month={month} bookings={filtered} onSelectBooking={setSelectedId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payments</CardTitle>
              <CardDescription>Recent deposits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
            <CardDescription>All bookings and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className=" repertoire">{{b.name}}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1"><Mail className="h-3 w-3"/>{b.email}</TableCell>
                    <TableCell className="text-xs">{b.phone}</TableCell>
                    <TableCell className="text-xs">{b.postcode}</TableCell>
                    <TableCell className="text-xs">{b.pod}<div className="text-slate-400">{format(new Date(b.startDate), "d MMM")} – {format(new Date(b.endDate), "d MMM")}</div></TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[b.status]?.color}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
