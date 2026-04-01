import { useState, useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  Calendar, MapPin, Clock, Plus, Users, Zap, Search,
  X, Check, Eye, Ticket, IndianRupee, AlertCircle,
  ChevronRight, Info, Phone, Mail, BookOpen, CreditCard,
  FileText, Star, Sparkles, QrCode, TrendingUp, Target,
  Trophy, Shield, Briefcase, BarChart3, Medal,
} from "lucide-react";

interface EventItem {
  id: string; title: string; description: string | null; date: string; type: string;
  venue: string | null; posterUrl: string | null; capacity: number | null;
  deadline: string | null; organizerName: string | null; xpReward: number;
  status: string; registrationOpen: boolean; tags: string | null; domain: string | null;
  registrationFee: number; requiresPayment: boolean;
  isTeamEvent: boolean; maxTeamSize: number | null;
  isRegistered: boolean; attended: boolean; registrationCount: number; createdAt: string | null;
}

interface Registration {
  id: string; studentName: string | null; studentUsn: string | null;
  email: string | null; phone: string | null; branch: string | null;
  semester: string | null; yearOfStudy: string | null;
  teamName: string | null; teamMembers: string | null;
  paymentMode: string | null; transactionId: string | null;
  paymentAmount: number | null; paymentStatus: string | null;
  attended: boolean; registeredAt: string; status: string; qrToken: string | null;
}

const EVENT_TYPES = ["technical", "cultural", "sports", "academic", "workshop", "hackathon", "other"];
const TYPE_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  cultural: "bg-purple-100 text-purple-700 border-purple-200",
  sports: "bg-green-100 text-green-700 border-green-200",
  academic: "bg-amber-100 text-amber-700 border-amber-200",
  workshop: "bg-teal-100 text-teal-700 border-teal-200",
  hackathon: "bg-rose-100 text-rose-700 border-rose-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};
const TYPE_EMOJI: Record<string, string> = {
  technical: "💻", cultural: "🎭", sports: "🏅", academic: "📚",
  workshop: "🔧", hackathon: "⚡", other: "📌",
};
const TYPE_GRADIENT: Record<string, string> = {
  technical: "from-blue-600 to-cyan-500",
  cultural: "from-purple-600 to-pink-500",
  sports: "from-green-600 to-emerald-500",
  academic: "from-amber-500 to-yellow-400",
  workshop: "from-teal-600 to-cyan-500",
  hackathon: "from-rose-600 to-orange-500",
  other: "from-gray-500 to-gray-400",
};
const PAYMENT_MODES = ["UPI", "Cash", "NEFT/RTGS", "Debit Card", "Credit Card", "Net Banking"];
const BRANCHES = ["CSE", "ECE", "EEE", "ME", "CE", "ISE", "AIML", "CS-DS", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDT(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function daysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `${days} days away`;
}

const emptyRegForm = {
  email: "", phone: "", branch: "", semester: "", yearOfStudy: "",
  teamName: "", teamMembers: ["", ""],
  paymentMode: "UPI", transactionId: "", paymentScreenshotUrl: "", additionalInfo: "",
};

function CapacityBar({ count, capacity }: { count: number; capacity: number | null }) {
  if (!capacity) return null;
  const pct = Math.min(100, (count / capacity) * 100);
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="mt-1">
      <div className="w-full bg-gray-100 rounded-full h-1">
        <div className={`${color} h-1 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">{count}/{capacity} seats filled</div>
    </div>
  );
}

export default function EventsHub() {
  const user = getUser();
  const qc = useQueryClient();
  const canManage = user?.role === "faculty" || user?.role === "admin";

  const { data: events = [], isLoading } = useApiGet<EventItem[]>("/events-hub");

  const [activeTab, setActiveTab] = useState<"all" | "mine" | "recommended">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({ ...emptyRegForm });
  const [regSaving, setRegSaving] = useState(false);
  const [regError, setRegError] = useState("");
  const [showQR, setShowQR] = useState(false);

  const [viewRegsEvent, setViewRegsEvent] = useState<EventItem | null>(null);
  const { data: registrations = [], isLoading: regsLoading } = useApiGet<Registration[]>(
    viewRegsEvent ? `/events-hub/${viewRegsEvent.id}/registrations` : null as any,
    { enabled: !!viewRegsEvent }
  );

  const [createForm, setCreateForm] = useState({
    title: "", description: "", date: "", type: "technical", venue: "",
    posterUrl: "", capacity: "", deadline: "", xpReward: "50", tags: "", domain: "",
    registrationFee: "0", requiresPayment: false, isTeamEvent: false, maxTeamSize: "",
  });
  const [saving, setSaving] = useState(false);

  const myEvents = events.filter(e => e.isRegistered);
  const attendedTypes = new Set(myEvents.map(e => e.type));

  const recommended = useMemo(() => {
    const upcoming = events.filter(e =>
      e.status !== "completed" && e.registrationOpen && !e.isRegistered
    );
    if (attendedTypes.size === 0) {
      return upcoming.filter(e => e.type === "hackathon" || e.type === "workshop" || e.xpReward >= 150).slice(0, 4);
    }
    const byType = upcoming.filter(e => attendedTypes.has(e.type));
    const others = upcoming.filter(e => !attendedTypes.has(e.type)).sort((a, b) => b.xpReward - a.xpReward);
    return [...byType, ...others].slice(0, 4);
  }, [events, attendedTypes]);

  const filtered = useMemo(() => {
    let base = activeTab === "mine" ? myEvents : activeTab === "recommended" ? recommended : events;
    const q = search.toLowerCase();
    return base.filter(e => {
      const matchSearch = !q || e.title.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q) || (e.tags ?? "").toLowerCase().includes(q);
      const matchType = !typeFilter || e.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [events, myEvents, recommended, activeTab, search, typeFilter]);

  const upcomingCount = events.filter(e => e.status === "upcoming").length;
  const totalXP = myEvents.filter(e => e.attended).reduce((s, e) => s + e.xpReward, 0);

  const openEvent = (event: EventItem) => {
    setSelectedEvent(event);
    setShowRegForm(false);
    setRegError("");
    setShowQR(false);
    setRegForm({ ...emptyRegForm });
  };

  const closeEvent = () => {
    setSelectedEvent(null);
    setShowRegForm(false);
    setRegError("");
    setShowQR(false);
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;
    if (!regForm.phone) { setRegError("Phone number is required"); return; }
    if (!regForm.branch) { setRegError("Branch is required"); return; }
    if (!regForm.yearOfStudy) { setRegError("Year of study is required"); return; }
    setRegError("");
    setRegSaving(true);
    try {
      await apiFetch(`/events-hub/${selectedEvent.id}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email, phone: regForm.phone, branch: regForm.branch,
          semester: regForm.semester, yearOfStudy: regForm.yearOfStudy,
          teamName: selectedEvent.isTeamEvent ? regForm.teamName : undefined,
          teamMembers: selectedEvent.isTeamEvent ? regForm.teamMembers.filter(m => m.trim()) : undefined,
          paymentMode: selectedEvent.requiresPayment ? regForm.paymentMode : undefined,
          transactionId: selectedEvent.requiresPayment ? regForm.transactionId : undefined,
          paymentScreenshotUrl: selectedEvent.requiresPayment ? regForm.paymentScreenshotUrl : undefined,
          additionalInfo: regForm.additionalInfo || undefined,
        }),
      });
      qc.invalidateQueries({ queryKey: ["/events-hub"] });
      setShowRegForm(false);
      setSelectedEvent({ ...selectedEvent, isRegistered: true, registrationCount: selectedEvent.registrationCount + 1 });
      setShowQR(true);
    } catch (e: any) {
      setRegError(e.message ?? "Failed to register. Please try again.");
    } finally {
      setRegSaving(false);
    }
  };

  const unregister = async (id: string) => {
    if (!confirm("Cancel your registration for this event?")) return;
    setLoading(id);
    try {
      await apiFetch(`/events-hub/${id}/register`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["/events-hub"] });
      if (selectedEvent?.id === id) {
        setSelectedEvent({ ...selectedEvent, isRegistered: false, registrationCount: selectedEvent.registrationCount - 1 });
      }
    } finally { setLoading(null); }
  };

  const markAttendance = async (eventId: string, regId: string) => {
    await apiFetch(`/events-hub/${eventId}/attendance/${regId}`, { method: "POST" });
    qc.invalidateQueries({ queryKey: [`/events-hub/${eventId}/registrations`] });
    qc.invalidateQueries({ queryKey: ["/events-hub"] });
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    await apiFetch(`/events-hub/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/events-hub"] });
    if (selectedEvent?.id === id) closeEvent();
  };

  const createEvent = async () => {
    if (!createForm.title || !createForm.date) { alert("Title and date required"); return; }
    setSaving(true);
    try {
      await apiFetch("/events-hub", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          capacity: createForm.capacity ? Number(createForm.capacity) : null,
          xpReward: Number(createForm.xpReward),
          registrationFee: Number(createForm.registrationFee),
          maxTeamSize: createForm.maxTeamSize ? Number(createForm.maxTeamSize) : null,
        }),
      });
      qc.invalidateQueries({ queryKey: ["/events-hub"] });
      setShowCreate(false);
      setCreateForm({ title: "", description: "", date: "", type: "technical", venue: "", posterUrl: "", capacity: "", deadline: "", xpReward: "50", tags: "", domain: "", registrationFee: "0", requiresPayment: false, isTeamEvent: false, maxTeamSize: "" });
    } catch (e: any) {
      alert(e.message);
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Campus Events Hub">
      <div className="space-y-5">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E8821A]/10 rounded-full translate-y-32 -translate-x-32" />
            <div className="absolute top-1/2 right-20 text-8xl opacity-5 select-none">🎪</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#E8821A] rounded-2xl flex items-center justify-center text-2xl shadow-lg">🎪</div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Campus Events Hub</h2>
                <p className="text-blue-200 text-xs mt-0.5">Discover · Register · Earn XP · Build your portfolio</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10">
                <div className="text-2xl font-extrabold">{upcomingCount}</div>
                <div className="text-xs text-blue-200 mt-0.5">Upcoming</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10">
                <div className="text-2xl font-extrabold">{myEvents.length}</div>
                <div className="text-xs text-blue-200 mt-0.5">Registered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10">
                <div className="text-2xl font-extrabold">{myEvents.filter(e => e.attended).length}</div>
                <div className="text-xs text-blue-200 mt-0.5">Attended</div>
              </div>
              <div className="bg-[#E8821A]/20 border border-[#E8821A]/30 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-extrabold text-[#E8821A] flex items-center justify-center gap-1">
                  <Zap className="w-5 h-5" />{totalXP}
                </div>
                <div className="text-xs text-orange-200 mt-0.5">XP Earned</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setActiveTab("all")}
                className="flex items-center gap-2 bg-white text-[#1a237e] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                <Target className="w-4 h-4" /> Explore Events
              </button>
              <Link href="/dashboard/achievements">
                <span className="flex items-center gap-2 bg-[#E8821A]/20 border border-[#E8821A]/40 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E8821A]/30 transition-all cursor-pointer">
                  <Trophy className="w-4 h-4 text-[#E8821A]" /> My Achievements
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section B — Problem Solution Visibility */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { icon: "🚫", text: "No more scattered WhatsApp groups" },
                { icon: "🗂️", text: "All events in one place" },
                { icon: "✅", text: "Verified participation tracking" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-emerald-800 font-semibold">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full shrink-0">
              🎓 JCET Smart Campus
            </span>
          </div>
        </div>

        {/* Section D + E + F + G — Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Gamification Panel */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                Level {Math.floor(totalXP / 100) + 1}
              </span>
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-0.5">Campus Points</h4>
            <div className="text-2xl font-extrabold text-amber-600 mb-2">{totalXP} <span className="text-sm font-semibold text-amber-400">XP</span></div>
            <div className="w-full bg-amber-100 rounded-full h-2 mb-1.5">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (totalXP % 100))}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-amber-600 font-medium mb-2">
              <span>Progress to next level</span>
              <span>{100 - (totalXP % 100)} XP left</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-lg px-2 py-1.5 text-center border border-amber-100">
                <div className="font-bold text-amber-700 text-sm">{myEvents.filter(e => e.attended).length}</div>
                <div className="text-[9px] text-gray-400">Attended</div>
              </div>
              <div className="flex-1 bg-white rounded-lg px-2 py-1.5 text-center border border-amber-100">
                <div className="font-bold text-amber-700 text-sm">{myEvents.length}</div>
                <div className="text-[9px] text-gray-400">Registered</div>
              </div>
            </div>
          </div>

          {/* QR Attendance */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">QR Attendance</h4>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Scan QR at event entrance — instant verified participation, no manual registers</p>
            <div className="bg-white rounded-xl p-3 border border-blue-100 flex items-center justify-center mb-2">
              <div className="grid grid-cols-5 gap-0.5">
                {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${v ? "bg-blue-700" : "bg-transparent"}`} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-blue-500 font-semibold text-center">Faculty scans → Attendance marked ✓</p>
          </div>

          {/* Extracurricular Resume */}
          <Link href="/dashboard/resume">
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer h-full flex flex-col">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">My Activity Resume</h4>
              <p className="text-[11px] text-gray-500 mb-2">{myEvents.filter(e => e.attended).length} events attended · auto-generated</p>
              <div className="flex flex-wrap gap-1 mb-3 flex-1">
                {["Problem Solving", "Teamwork", "Leadership", "Tech Skills"].map(s => (
                  <span key={s} className="text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">{s}</span>
                ))}
              </div>
              <div className="w-full py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[11px] font-bold rounded-xl text-center shadow-sm">
                Generate Resume →
              </div>
            </div>
          </Link>

          {/* Club / Organizer Dashboard */}
          <div className={`bg-gradient-to-br from-rose-50 to-pink-50 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${canManage ? "border-rose-300" : "border-rose-100"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-rose-600" />
              </div>
              {canManage && <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">Organizer</span>}
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-2">For Organizers</h4>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Total Registrations</span>
                <span className="font-bold text-rose-600">{events.reduce((s, e) => s + e.registrationCount, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Active Events</span>
                <span className="font-bold text-rose-600">{upcomingCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Avg Engagement</span>
                <span className="font-bold text-rose-600">
                  ~{events.length > 0 ? Math.round(events.reduce((s, e) => s + e.registrationCount, 0) / events.length) : 0} / event
                </span>
              </div>
            </div>
            {canManage ? (
              <button onClick={() => setShowCreate(s => !s)}
                className="w-full py-2 bg-rose-500 text-white text-[11px] font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-sm">
                + Create New Event
              </button>
            ) : (
              <p className="text-[10px] text-gray-400 text-center">Faculty & Admin can create and manage events</p>
            )}
          </div>
        </div>

        {/* Tabs + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { key: "all", label: "All Events", icon: <Target className="w-3.5 h-3.5" /> },
              { key: "recommended", label: "For You", icon: <Sparkles className="w-3.5 h-3.5" /> },
              { key: "mine", label: "My Events", icon: <Star className="w-3.5 h-3.5" /> },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? "bg-white shadow text-[#1a237e]" : "text-gray-500 hover:text-gray-700"}`}>
                {tab.icon} {tab.label}
                {tab.key === "mine" && myEvents.length > 0 && (
                  <span className="bg-[#1a237e] text-white text-[10px] px-1.5 rounded-full">{myEvents.length}</span>
                )}
              </button>
            ))}
          </div>
          {canManage && (
            <button onClick={() => setShowCreate(s => !s)}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#283593] shadow-sm">
              <Plus className="w-4 h-4" /> Create Event
            </button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 bg-white"
              placeholder="Search events, tags, venues..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {/* AI Recommendation Banner */}
        {activeTab === "recommended" && (
          <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-violet-900 text-sm">Personalised For You</p>
              <p className="text-xs text-violet-600 mt-0.5">
                {attendedTypes.size > 0
                  ? `Based on your interest in ${Array.from(attendedTypes).join(", ")} events — here are the best upcoming events for your profile.`
                  : "Top high-XP events curated for new students. Register for events to personalise these recommendations!"}
              </p>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreate && canManage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1a237e]" /> New Event
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block font-medium">Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="e.g. National Hackathon 2026" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500 mb-1 block font-medium">Description</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Date *</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.date} onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Registration Deadline</label>
                <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.deadline} onChange={e => setCreateForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Venue</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. CS Block Auditorium" value={createForm.venue} onChange={e => setCreateForm(f => ({ ...f, venue: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Capacity (seats)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 100" value={createForm.capacity} onChange={e => setCreateForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">XP Reward</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.xpReward} onChange={e => setCreateForm(f => ({ ...f, xpReward: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Registration Fee (₹)</label>
                <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.registrationFee} onChange={e => setCreateForm(f => ({ ...f, registrationFee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Tags (comma-separated)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="coding, ML, teamwork" value={createForm.tags} onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              <div className="flex items-center gap-5 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#1a237e]" checked={createForm.requiresPayment} onChange={e => setCreateForm(f => ({ ...f, requiresPayment: e.target.checked }))} />
                  Requires Payment
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#1a237e]" checked={createForm.isTeamEvent} onChange={e => setCreateForm(f => ({ ...f, isTeamEvent: e.target.checked }))} />
                  Team Event
                </label>
                {createForm.isTeamEvent && (
                  <input type="number" min="2" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Max size" value={createForm.maxTeamSize} onChange={e => setCreateForm(f => ({ ...f, maxTeamSize: e.target.value }))} />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createEvent} disabled={saving} className="bg-[#1a237e] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#283593] disabled:opacity-50 flex items-center gap-2">
                <Check className="w-4 h-4" /> {saving ? "Creating..." : "Create Event"}
              </button>
              <button onClick={() => setShowCreate(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-56 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-3">
              {activeTab === "mine" ? "🎟️" : activeTab === "recommended" ? "✨" : "🎪"}
            </div>
            <p className="text-gray-500 font-semibold">
              {activeTab === "mine" ? "You haven't registered for any events yet." :
               activeTab === "recommended" ? "No recommendations available." :
               "No events found matching your search."}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === "mine" ? "Browse events and register to build your portfolio!" : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(ev => {
              const typeColor = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
              const gradient = TYPE_GRADIENT[ev.type] ?? TYPE_GRADIENT.other;
              const isFull = ev.capacity != null && ev.registrationCount >= ev.capacity;
              const isDeadlinePassed = ev.deadline && new Date(ev.deadline) < new Date();
              const canRegister = !ev.isRegistered && ev.registrationOpen && !isFull && !isDeadlinePassed && ev.status !== "completed";
              const countdown = ev.date ? daysUntil(ev.date) : null;
              return (
                <div key={ev.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer ${ev.isRegistered ? "border-[#1a237e]/30 ring-1 ring-[#1a237e]/10" : "border-gray-100"}`}
                  onClick={() => openEvent(ev)}>
                  <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-5xl opacity-90 group-hover:scale-110 transition-transform">{TYPE_EMOJI[ev.type] ?? "📌"}</span>
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-300" /> {ev.xpReward} XP
                      </span>
                    </div>
                    {ev.isRegistered && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-white text-[#1a237e] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Check className="w-2.5 h-2.5" /> Registered
                        </span>
                      </div>
                    )}
                    {ev.attended && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Check className="w-2.5 h-2.5" /> Attended
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColor}`}>
                        {ev.type.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ev.isTeamEvent && <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded">👥 Team</span>}
                        {ev.requiresPayment && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <IndianRupee className="w-2.5 h-2.5" />₹{ev.registrationFee}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1 mb-0.5">{ev.title}</h3>
                    {ev.description && <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{ev.description}</p>}

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3 text-[#1a237e]" />
                        <span>{formatDate(ev.date)}</span>
                        {countdown && ev.status !== "completed" && (
                          <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 rounded">{countdown}</span>
                        )}
                      </div>
                      {ev.venue && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <MapPin className="w-3 h-3 text-[#1a237e]" /> <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                    </div>

                    <CapacityBar count={ev.registrationCount} capacity={ev.capacity} />

                    <div className="flex items-center gap-2 mt-2.5">
                      {ev.attended ? (
                        <span className="flex-1 text-center text-[11px] bg-green-50 text-green-700 font-bold py-1.5 rounded-lg border border-green-200 flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> Attended · +{ev.xpReward} XP
                        </span>
                      ) : ev.isRegistered ? (
                        <span className="flex-1 text-center text-[11px] bg-[#1a237e]/5 text-[#1a237e] font-bold py-1.5 rounded-lg border border-[#1a237e]/20 flex items-center justify-center gap-1">
                          <QrCode className="w-3 h-3" /> Show Ticket
                        </span>
                      ) : canRegister ? (
                        <span className="flex-1 text-center bg-[#1a237e] text-white text-[11px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 group-hover:bg-[#283593]">
                          Register <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          {isFull ? "🔴 Full" : isDeadlinePassed ? "⏰ Deadline passed" : ev.status === "completed" ? "✅ Completed" : "Registration closed"}
                        </span>
                      )}
                      {canManage && (
                        <button onClick={e => { e.stopPropagation(); setViewRegsEvent(ev); }}
                          className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-[#1a237e] shrink-0" title="View registrations">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* XP Guide */}
        {activeTab === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: "⚡", title: "Earn 50–250 XP", desc: "Every event attendance earns Campus XP based on the event tier", color: "bg-amber-50 border-amber-200" },
              { icon: "🏅", title: "Unlock Badges", desc: "First event, 5 events, 10 events — milestone badges auto-awarded", color: "bg-blue-50 border-blue-200" },
              { icon: "📄", title: "Auto Resume", desc: "Your attendance builds a verifiable extracurricular resume for placements", color: "bg-purple-50 border-purple-200" },
            ].map(c => (
              <div key={c.title} className={`${c.color} border rounded-xl p-4 text-sm`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="font-semibold text-gray-800">{c.title}</div>
                <div className="text-gray-500 text-xs mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) closeEvent(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className={`h-32 bg-gradient-to-br ${TYPE_GRADIENT[selectedEvent.type] ?? TYPE_GRADIENT.other} flex items-center justify-center relative rounded-t-2xl`}>
              <span className="text-7xl opacity-90">{TYPE_EMOJI[selectedEvent.type] ?? "📌"}</span>
              <button onClick={closeEvent} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${TYPE_COLORS[selectedEvent.type] ?? TYPE_COLORS.other}`}>
                      {TYPE_EMOJI[selectedEvent.type]} {selectedEvent.type}
                    </span>
                    {selectedEvent.isTeamEvent && (
                      <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded border border-violet-200">👥 Team Event</span>
                    )}
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {selectedEvent.xpReward} XP
                    </span>
                    {selectedEvent.requiresPayment && (
                      <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> ₹{selectedEvent.registrationFee}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{selectedEvent.title}</h2>
                  {selectedEvent.organizerName && <p className="text-sm text-gray-400 mt-1">by {selectedEvent.organizerName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-[#1a237e] mx-auto mb-1" />
                  <div className="text-xs font-bold text-gray-800">{formatDate(selectedEvent.date)}</div>
                  <div className="text-[10px] text-gray-400">Date</div>
                </div>
                {selectedEvent.venue && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <MapPin className="w-4 h-4 text-[#1a237e] mx-auto mb-1" />
                    <div className="text-xs font-bold text-gray-800 line-clamp-1">{selectedEvent.venue}</div>
                    <div className="text-[10px] text-gray-400">Venue</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-[#1a237e] mx-auto mb-1" />
                  <div className="text-xs font-bold text-gray-800">{selectedEvent.registrationCount}{selectedEvent.capacity ? `/${selectedEvent.capacity}` : ""}</div>
                  <div className="text-[10px] text-gray-400">Registered</div>
                </div>
                {selectedEvent.deadline && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Clock className="w-4 h-4 text-[#1a237e] mx-auto mb-1" />
                    <div className="text-xs font-bold text-gray-800">{formatDT(selectedEvent.deadline)}</div>
                    <div className="text-[10px] text-gray-400">Deadline</div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="mb-5">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm"><Info className="w-4 h-4 text-[#1a237e]" /> About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.tags && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {selectedEvent.tags.split(",").map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">#{t.trim()}</span>
                  ))}
                </div>
              )}

              {selectedEvent.requiresPayment && !selectedEvent.isRegistered && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <IndianRupee className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Registration Fee: ₹{selectedEvent.registrationFee}</p>
                    <p className="text-xs text-amber-700 mt-0.5">Provide payment details during registration. Keep your UPI transaction ID or screenshot ready.</p>
                  </div>
                </div>
              )}

              {/* Registered State — QR Ticket */}
              {selectedEvent.isRegistered && !selectedEvent.attended && (
                <div className="border border-[#1a237e]/20 rounded-2xl bg-[#1a237e]/3 overflow-hidden mb-4">
                  <div className="bg-[#1a237e] text-white px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5" />
                      <span className="font-bold text-sm">Event Ticket — Registered</span>
                    </div>
                    <button onClick={() => setShowQR(s => !s)} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold">
                      <QrCode className="w-3.5 h-3.5" /> {showQR ? "Hide QR" : "Show QR Code"}
                    </button>
                  </div>
                  {showQR && (
                    <div className="p-6 flex flex-col items-center gap-3">
                      <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-[#1a237e]/10">
                        <QRCodeCanvas
                          value={`JCET-EVENT:${selectedEvent.id}:${user?.id}:${user?.name}:${user?.usn}`}
                          size={180}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.usn} · {selectedEvent.title}</p>
                        <p className="text-xs text-gray-400 mt-1">Present this QR code to faculty at the event for attendance marking</p>
                      </div>
                      <div className="w-full bg-[#1a237e]/5 rounded-xl p-3 text-center border border-[#1a237e]/10">
                        <p className="text-xs text-[#1a237e] font-bold">Attend to earn <span className="text-amber-600">+{selectedEvent.xpReward} XP</span> on your campus profile!</p>
                      </div>
                    </div>
                  )}
                  {!showQR && (
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{user?.name} · {user?.usn}</p>
                        <p className="text-xs text-gray-400">Registered for {selectedEvent.title}</p>
                      </div>
                      <button onClick={() => unregister(selectedEvent.id)} disabled={loading === selectedEvent.id} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                        {loading === selectedEvent.id ? "..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Attended State */}
              {selectedEvent.attended && (
                <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">Event Completed!</p>
                    <p className="text-sm text-green-600"><span className="font-bold text-amber-600">+{selectedEvent.xpReward} XP</span> has been credited to your campus profile.</p>
                  </div>
                </div>
              )}

              {/* Registration Form */}
              {!selectedEvent.isRegistered && selectedEvent.registrationOpen && selectedEvent.status !== "completed" && (
                <>
                  {!showRegForm ? (
                    <button onClick={() => setShowRegForm(true)}
                      className="w-full py-3.5 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#283593] transition-colors flex items-center justify-center gap-2 text-sm">
                      <Ticket className="w-5 h-5" /> Register for this Event
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl p-5 mt-2">
                      <h3 className="font-bold text-gray-800 text-base mb-5 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#1a237e]" /> Registration Form
                      </h3>
                      <div className="space-y-5">
                        {/* Student Info */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                            <BookOpen className="w-4 h-4 text-[#1a237e]" /> Student Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" value={user?.name ?? ""} disabled />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">USN / Roll Number</label>
                              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" value={user?.usn ?? user?.id ?? ""} disabled />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input type="email" className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="your@email.com" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Phone Number *</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input type="tel" maxLength={10} className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="10-digit mobile number" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Branch / Department *</label>
                              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" value={regForm.branch} onChange={e => setRegForm(f => ({ ...f, branch: e.target.value }))}>
                                <option value="">Select Branch</option>
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Year of Study *</label>
                              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" value={regForm.yearOfStudy} onChange={e => setRegForm(f => ({ ...f, yearOfStudy: e.target.value }))}>
                                <option value="">Select Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Semester</label>
                              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" value={regForm.semester} onChange={e => setRegForm(f => ({ ...f, semester: e.target.value }))}>
                                <option value="">Select Semester</option>
                                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Team Details */}
                        {selectedEvent.isTeamEvent && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                              <Users className="w-4 h-4 text-[#1a237e]" /> Team Details
                              {selectedEvent.maxTeamSize && <span className="text-xs text-gray-400 font-normal">· max {selectedEvent.maxTeamSize} members</span>}
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Team Name</label>
                                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="e.g. Team Phoenix" value={regForm.teamName} onChange={e => setRegForm(f => ({ ...f, teamName: e.target.value }))} />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Other Team Members (USN)</label>
                                <div className="space-y-2">
                                  {regForm.teamMembers.map((m, i) => (
                                    <div key={i} className="flex gap-2">
                                      <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder={`Member ${i + 2} USN`} value={m} onChange={e => { const arr = [...regForm.teamMembers]; arr[i] = e.target.value; setRegForm(f => ({ ...f, teamMembers: arr })); }} />
                                      {regForm.teamMembers.length > 1 && (
                                        <button type="button" onClick={() => setRegForm(f => ({ ...f, teamMembers: f.teamMembers.filter((_, j) => j !== i) }))} className="p-2 text-gray-400 hover:text-red-500">
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {(!selectedEvent.maxTeamSize || regForm.teamMembers.length < selectedEvent.maxTeamSize - 1) && (
                                    <button type="button" onClick={() => setRegForm(f => ({ ...f, teamMembers: [...f.teamMembers, ""] }))} className="text-xs text-[#1a237e] hover:underline">
                                      + Add Member
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Payment Details */}
                        {selectedEvent.requiresPayment && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                              <CreditCard className="w-4 h-4 text-[#1a237e]" /> Payment Details
                              <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">₹{selectedEvent.registrationFee} Required</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Payment Mode *</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" value={regForm.paymentMode} onChange={e => setRegForm(f => ({ ...f, paymentMode: e.target.value }))}>
                                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Transaction / Reference ID</label>
                                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="UPI ref / transaction ID" value={regForm.transactionId} onChange={e => setRegForm(f => ({ ...f, transactionId: e.target.value }))} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Payment Screenshot URL (optional)</label>
                                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20" placeholder="https://drive.google.com/..." value={regForm.paymentScreenshotUrl} onChange={e => setRegForm(f => ({ ...f, paymentScreenshotUrl: e.target.value }))} />
                              </div>
                            </div>
                          </div>
                        )}

                        {regError && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {regError}
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button onClick={handleRegister} disabled={regSaving}
                            className="flex-1 py-3 bg-[#1a237e] text-white font-bold rounded-xl hover:bg-[#283593] disabled:opacity-50 flex items-center justify-center gap-2">
                            {regSaving ? "Registering..." : <><Check className="w-4 h-4" /> Confirm Registration</>}
                          </button>
                          <button onClick={() => setShowRegForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {canManage && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => { setViewRegsEvent(selectedEvent); closeEvent(); }}
                    className="flex items-center gap-2 border border-[#1a237e]/30 text-[#1a237e] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a237e]/5">
                    <Eye className="w-4 h-4" /> View Registrations
                  </button>
                  <button onClick={() => deleteEvent(selectedEvent.id)}
                    className="flex items-center gap-2 border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 ml-auto">
                    <X className="w-4 h-4" /> Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registrations Panel Modal (faculty) */}
      {viewRegsEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setViewRegsEvent(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Registrations — {viewRegsEvent.title}</h3>
                <p className="text-sm text-gray-400">{registrations.length} registered · {registrations.filter(r => r.attended).length} attended</p>
              </div>
              <button onClick={() => setViewRegsEvent(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              {regsLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400">No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.map(r => (
                    <div key={r.id} className={`border rounded-xl p-4 ${r.attended ? "border-green-200 bg-green-50" : "border-gray-100 bg-white"}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800">{r.studentName}</span>
                            <span className="text-xs text-gray-500 font-mono">{r.studentUsn}</span>
                            {r.branch && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">{r.branch}</span>}
                            {r.yearOfStudy && <span className="text-xs text-gray-400">{r.yearOfStudy}</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                            {r.email && <span>✉ {r.email}</span>}
                            {r.phone && <span>📞 {r.phone}</span>}
                            {r.teamName && <span className="text-violet-600 font-medium">👥 {r.teamName}</span>}
                            {r.paymentStatus && r.paymentStatus !== "not_required" && (
                              <span className={`px-1.5 rounded font-semibold ${r.paymentStatus === "submitted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                💳 {r.paymentStatus} · {r.paymentMode}
                                {r.transactionId && ` · ${r.transactionId}`}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-300 mt-1">Registered {new Date(r.registeredAt).toLocaleDateString("en-IN")}</div>
                        </div>
                        <div>
                          {r.attended ? (
                            <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Check className="w-3 h-3" /> Attended
                            </span>
                          ) : (
                            <button onClick={() => markAttendance(viewRegsEvent.id, r.id)}
                              className="text-xs bg-[#1a237e] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#283593] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Mark Present
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
