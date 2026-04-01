import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { useApiGet, useApiPost } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar, MapPin, Clock, Plus, X, Shield, Zap,
  Users, Ticket, ChevronRight, Search, AlertCircle,
} from "lucide-react";

interface EventItem {
  id: string; title: string; description: string | null; date: string;
  type: string; venue: string | null; xpReward: number; status: string;
  registrationOpen: boolean; isRegistered: boolean; attended: boolean;
  registrationCount: number; capacity: number | null; requiresPayment: boolean;
  registrationFee: number; organizerName: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  technical: "bg-blue-50 text-[#1a237e] border-blue-200",
  hackathon:  "bg-rose-50 text-rose-700 border-rose-200",
  cultural:   "bg-purple-50 text-purple-700 border-purple-200",
  academic:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  sports:     "bg-orange-50 text-[#E8821A] border-orange-200",
  workshop:   "bg-teal-50 text-teal-700 border-teal-200",
  exam:       "bg-red-50 text-red-700 border-red-200",
};
const TYPE_EMOJI: Record<string, string> = {
  technical: "💻", hackathon: "⚡", cultural: "🎭", academic: "📚",
  sports: "🏅", workshop: "🔧", exam: "📝", other: "📌",
};
const TYPE_GRADIENT: Record<string, string> = {
  technical: "from-blue-600 to-cyan-500",
  hackathon: "from-rose-600 to-orange-500",
  cultural:  "from-purple-600 to-pink-500",
  academic:  "from-amber-500 to-yellow-400",
  sports:    "from-green-600 to-emerald-500",
  workshop:  "from-teal-600 to-cyan-500",
  exam:      "from-red-500 to-rose-400",
};

const FALLBACK_EVENTS: EventItem[] = [
  { id: "f-1", title: "HackJCET 2026 — 24-Hour Hackathon", description: "Build, innovate, win. 24-hour hackathon open to all students.", date: "2026-04-10", type: "hackathon", venue: "CS Block Auditorium", xpReward: 200, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 100, requiresPayment: false, registrationFee: 0, organizerName: "CSE Department" },
  { id: "f-2", title: "Utsav 2026 — JCET Cultural Fest", description: "Music, dance, drama and art — celebrate creativity at JCET.", date: "2026-04-15", type: "cultural", venue: "Open Amphitheater", xpReward: 100, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 500, requiresPayment: false, registrationFee: 0, organizerName: "Student Council" },
  { id: "f-3", title: "AWS Cloud Workshop", description: "Hands-on cloud computing workshop with AWS certification guidance.", date: "2026-04-17", type: "workshop", venue: "Computer Lab 3", xpReward: 150, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 60, requiresPayment: false, registrationFee: 0, organizerName: "Training & Placement" },
  { id: "f-4", title: "JCET Sports Day 2026", description: "Annual inter-department sports championship. Athletics, cricket, football and more.", date: "2026-04-22", type: "sports", venue: "Sports Ground", xpReward: 75, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 200, requiresPayment: false, registrationFee: 0, organizerName: "Physical Education Dept" },
  { id: "f-5", title: "AI/ML Industry Expert Talk", description: "Industry experts share insights on Machine Learning and AI career paths.", date: "2026-04-19", type: "academic", venue: "Seminar Hall A", xpReward: 60, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 150, requiresPayment: false, registrationFee: 0, organizerName: "AIML Department" },
  { id: "f-6", title: "Web Dev Bootcamp — React & Node.js", description: "Intensive 2-day bootcamp on modern full-stack development.", date: "2026-05-02", type: "workshop", venue: "IT Lab", xpReward: 180, status: "upcoming", registrationOpen: true, isRegistered: false, attended: false, registrationCount: 0, capacity: 40, requiresPayment: false, registrationFee: 0, organizerName: "IEEE Student Branch" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Events() {
  const user = getUser();
  const canCreate = user?.role === "faculty" || user?.role === "admin";
  const qc = useQueryClient();
  const postEvent = useApiPost<any, any>("/dashboard/events");

  const { data: rawEvents, isLoading, isError } = useApiGet<EventItem[]>("/events-hub");
  const events = (rawEvents && rawEvents.length > 0) ? rawEvents : (isLoading ? [] : FALLBACK_EVENTS);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "technical", venue: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q);
    const matchType = !typeFilter || e.type === typeFilter;
    return matchSearch && matchType;
  });
  const upcoming = filtered.filter(e => e.status !== "completed");
  const past = filtered.filter(e => e.status === "completed");

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    postEvent.mutate(form, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/events-hub"] });
        setForm({ title: "", description: "", date: "", type: "technical", venue: "" });
        setShowForm(false);
      },
    });
  };

  return (
    <Layout title="Campus Events">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-100 pb-5">
          <div>
            {user?.role === "admin" && (
              <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin View</span>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a237e] tracking-tight">Campus Events</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Discover, register, and earn XP for attending events.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {canCreate && (
              <button onClick={() => setShowForm(f => !f)}
                className="flex items-center gap-2 bg-[#1a237e] hover:bg-[#283593] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Create Event</>}
              </button>
            )}
            <Link href="/dashboard/events-hub">
              <span className="flex items-center gap-2 bg-[#E8821A] hover:bg-[#d4741a] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm">
                <Zap className="h-4 w-4" /> Events Hub & Register
              </span>
            </Link>
          </div>
        </div>

        {/* Error / Fallback Notice */}
        {isError && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Could not reach the server — showing sample events below. <Link href="/dashboard/events-hub"><span className="underline font-semibold cursor-pointer">Go to Events Hub</span></Link> for full registration.</span>
          </div>
        )}
        {!rawEvents?.length && !isLoading && !isError && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Showing sample events. <Link href="/dashboard/events-hub"><span className="underline font-semibold cursor-pointer">Visit Events Hub</span></Link> to see all live events and register.</span>
          </div>
        )}

        {/* Events Hub CTA Banner */}
        <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg">🎪 Register for Events & Earn Campus XP</h3>
            <p className="text-blue-200 text-sm mt-0.5">Get verified participation, QR tickets, badges, and a PDF portfolio resume.</p>
          </div>
          <Link href="/dashboard/events-hub">
            <span className="flex items-center gap-2 bg-[#E8821A] hover:bg-[#d4741a] text-white px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-colors shadow-md">
              Open Events Hub <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Create Form */}
        {canCreate && showForm && (
          <div className="bg-white border border-[#1a237e]/20 rounded-2xl shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <div className="p-5">
              <h3 className="font-bold text-[#1a237e] text-base mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Campus Event
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Event Title *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Hackathon 2026" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date *</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {["technical","hackathon","cultural","academic","sports","workshop","exam","other"].map(t => (
                      <option key={t} value={t}>{TYPE_EMOJI[t] ?? "📌"} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Venue</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Seminar Hall A" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description</label>
                  <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" disabled={postEvent.isPending}
                    className="bg-[#1a237e] hover:bg-[#283593] text-white px-8 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {postEvent.isPending ? "Creating…" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 bg-white"
              placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {["technical","hackathon","cultural","academic","sports","workshop","exam"].map(t => (
              <option key={t} value={t}>{TYPE_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />)}
          </div>
        )}

        {/* Upcoming Events */}
        {!isLoading && upcoming.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-base">Upcoming Events <span className="text-sm text-gray-400 font-normal ml-1">({upcoming.length})</span></h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {upcoming.map((event) => {
                const gradient = TYPE_GRADIENT[event.type] ?? "from-gray-500 to-gray-400";
                const badgeClass = TYPE_COLOR[event.type] ?? "bg-gray-100 text-gray-600 border-gray-200";
                const canRegister = !event.isRegistered && event.registrationOpen && event.status !== "completed";
                return (
                  <div key={event.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 ${event.isRegistered ? "border-[#1a237e]/30" : "border-gray-100"}`}>
                    <div className={`h-20 bg-gradient-to-br ${gradient} flex items-center gap-4 px-5 relative`}>
                      <span className="text-4xl">{TYPE_EMOJI[event.type] ?? "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm line-clamp-1">{event.title}</h3>
                        <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{event.organizerName ?? "JCET"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-yellow-300" /> {event.xpReward} XP
                        </span>
                        {event.isRegistered && (
                          <span className="bg-white text-[#1a237e] text-[9px] font-bold px-2 py-0.5 rounded-full">✓ Registered</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {event.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#1a237e]/60 shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#1a237e]/60 shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#1a237e]/60 shrink-0" />
                          <span>{event.registrationCount} registered{event.capacity ? ` / ${event.capacity}` : ""}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <Link href="/dashboard/events-hub">
                        <span className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                          event.attended
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : event.isRegistered
                              ? "bg-[#1a237e]/5 text-[#1a237e] border border-[#1a237e]/20"
                              : canRegister
                                ? "bg-[#1a237e] text-white hover:bg-[#283593]"
                                : "bg-gray-100 text-gray-400"
                        }`}>
                          {event.attended ? (
                            <><span>✓ Attended</span><span className="text-amber-600">+{event.xpReward} XP</span></>
                          ) : event.isRegistered ? (
                            <><Ticket className="w-3.5 h-3.5" /> View Ticket</>
                          ) : canRegister ? (
                            <><Ticket className="w-3.5 h-3.5" /> Register Now <ChevronRight className="w-3.5 h-3.5" /></>
                          ) : (
                            "Registration Closed"
                          )}
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Past Events */}
        {!isLoading && past.length > 0 && (
          <>
            <h2 className="font-bold text-gray-500 text-sm border-t border-gray-100 pt-4">Past Events <span className="text-xs text-gray-400 font-normal ml-1">({past.length})</span></h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-60">
              {past.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{TYPE_EMOJI[event.type] ?? "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-600 text-sm line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(event.date)}</span>
                          {event.venue && <span>· {event.venue}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium shrink-0">Completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-semibold">No events match your search.</p>
            <button onClick={() => { setSearch(""); setTypeFilter(""); }} className="text-[#1a237e] text-sm mt-2 underline">Clear filters</button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-amber-900 text-sm">Want the full experience? Go to Events Hub</p>
            <p className="text-xs text-amber-700 mt-0.5">Registration, QR tickets, XP leaderboard, badges and auto-resume — all in one place.</p>
          </div>
          <Link href="/dashboard/events-hub">
            <span className="flex items-center gap-2 bg-[#E8821A] text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-[#d4741a] transition-colors whitespace-nowrap">
              <Zap className="w-4 h-4" /> Open Events Hub
            </span>
          </Link>
        </div>

      </div>
    </Layout>
  );
}
