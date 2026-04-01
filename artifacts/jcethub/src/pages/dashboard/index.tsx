import { Layout } from "@/components/layout";
import { useGetDashboardSummary, useGetStudentProfile, useGetUpcomingEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, BookOpen, Clock, Calendar, ChevronRight, Award,
  Bus, Wallet, MessageSquare, FileText, Users, CalendarDays, FlaskConical, LayoutDashboard,
  PartyPopper, Zap, Trophy, Briefcase,
} from "lucide-react";
import { Link } from "wouter";

const MODULES = [
  { title: "Attendance",         icon: Clock,          href: "/dashboard/attendance",        color: "bg-blue-50 text-[#1a237e]" },
  { title: "Time Table",         icon: Calendar,       href: "/dashboard/timetable",          color: "bg-indigo-50 text-indigo-700" },
  { title: "Academic Calendar",  icon: CalendarDays,   href: "/dashboard/academic-calendar",  color: "bg-cyan-50 text-cyan-700" },
  { title: "LMS Dashboard",      icon: LayoutDashboard,href: "/dashboard/lms",                color: "bg-violet-50 text-violet-700" },
  { title: "Internal Assessment",icon: BookOpen,       href: "/dashboard/marks",              color: "bg-amber-50 text-[#E8821A]" },
  { title: "Exam Schedule",      icon: FlaskConical,   href: "/dashboard/exam-schedule",      color: "bg-red-50 text-red-700" },
  { title: "Results",            icon: Award,          href: "/dashboard/results",            color: "bg-emerald-50 text-emerald-700" },
  { title: "Fees",               icon: Wallet,         href: "/dashboard/fees",               color: "bg-lime-50 text-lime-700" },
  { title: "Circular",           icon: FileText,       href: "/dashboard/circular",           color: "bg-orange-50 text-orange-700" },
  { title: "Announcement",       icon: MessageSquare,  href: "/dashboard/notifications",      color: "bg-pink-50 text-pink-700" },
  { title: "Transport",          icon: Bus,            href: "/dashboard/transport",          color: "bg-yellow-50 text-yellow-700" },
  { title: "Events",             icon: Calendar,       href: "/dashboard/events",             color: "bg-purple-50 text-purple-700" },
  { title: "Mentoring",          icon: Users,          href: "/dashboard/mentoring",          color: "bg-teal-50 text-teal-700" },
  { title: "Feedback",           icon: MessageSquare,  href: "/dashboard/feedback",           color: "bg-rose-50 text-rose-700" },
];

export default function Dashboard() {
  const { data: profile }  = useGetStudentProfile({ query: { queryKey: ["/api/students/me"] } });
  const { data: summary }  = useGetDashboardSummary({ query: { queryKey: ["/api/dashboard/summary"] } });
  const { data: events }   = useGetUpcomingEvents({ query: { queryKey: ["/api/dashboard/events"] } });

  const attendance = summary?.overallAttendance ?? 0;
  const cgpa       = summary?.cgpa ?? 0;
  const pending    = summary?.pendingAssignments ?? 0;
  const examDays   = summary?.nextExamDays ?? 0;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ⭐ Events Hub — Featured First */}
        <Link href="/dashboard/events-hub">
          <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5 group">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E8821A]/10 rounded-full translate-y-24 -translate-x-24" />
              <div className="absolute top-1/2 right-10 text-7xl opacity-5 select-none group-hover:opacity-10 transition-opacity">🎪</div>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#E8821A] rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0">🎪</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-extrabold tracking-tight">Campus Events & Extracurricular Hub</h2>
                    <span className="text-[10px] bg-[#E8821A] text-white font-bold px-2 py-0.5 rounded-full">NEW</span>
                  </div>
                  <p className="text-blue-200 text-xs">Centralized platform for events, achievements & career growth</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      { icon: <PartyPopper className="w-3 h-3" />, text: "Discover Events" },
                      { icon: <Zap className="w-3 h-3 text-yellow-300" />, text: "Earn XP" },
                      { icon: <Trophy className="w-3 h-3 text-amber-300" />, text: "Leaderboard" },
                      { icon: <Briefcase className="w-3 h-3 text-purple-300" />, text: "Resume Builder" },
                    ].map(f => (
                      <span key={f.text} className="flex items-center gap-1 text-[10px] text-blue-100 font-medium bg-white/10 px-2 py-0.5 rounded-full">
                        {f.icon} {f.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto shrink-0">
                <span className="text-sm font-bold">Open Events Hub</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        {/* Welcome banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-5 rounded-xl border shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[#1a237e]">
              Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 flex-shrink-0" />
              {profile ? `${profile.branch} • Semester ${profile.semester} • ${profile.usn}` : "Loading profile…"}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#1a237e]/10 px-4 py-1.5 text-xs font-semibold text-[#1a237e] ring-1 ring-inset ring-[#1a237e]/20 self-start md:self-auto">
            Academic Year 2024-25
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Overall Attendance" value={summary ? `${attendance}%` : "—"} icon={Clock} description="Across all subjects" trend={attendance >= 75 ? "Safe" : attendance === 0 ? "Loading…" : "Action Required"} trendColor={attendance >= 75 ? "text-emerald-600" : "text-muted-foreground"} accent="#1a237e" />
          <StatCard title="Current CGPA"       value={summary ? cgpa.toFixed(2) : "—"} icon={Award} description={summary ? `Credits: ${summary.creditsCompleted}/${summary.creditsTotal}` : "Credits: —/—"} trend={summary ? "Top 15%" : "Loading…"} trendColor="text-[#1a237e]" accent="#E8821A" />
          <StatCard title="Pending Tasks"      value={summary ? String(pending) : "—"} icon={BookOpen} description="Due within 7 days" trend={summary ? (pending ? `${pending} High Priority` : "All clear") : "Loading…"} trendColor={summary ? (pending ? "text-[#E8821A]" : "text-emerald-600") : "text-muted-foreground"} accent="#E8821A" />
          <StatCard title="Next Exam In"       value={summary ? `${examDays} Days` : "—"} icon={Calendar} description="Mid-term internals" trend={summary ? "Syllabus updated" : "Loading…"} trendColor="text-muted-foreground" accent="#1a237e" />
        </div>

        {/* All Modules Grid */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-[#1a237e]">All Modules</CardTitle>
            <CardDescription>Quick access to all campus services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {MODULES.map(mod => (
                <Link key={mod.href} href={mod.href}>
                  <div className="flex flex-col items-center justify-center p-3 bg-card border rounded-xl hover:border-[#1a237e]/40 hover:shadow-md transition-all group cursor-pointer gap-2.5 min-h-[80px]">
                    <div className={`p-2.5 rounded-full ${mod.color} group-hover:scale-110 transition-transform duration-200`}>
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-[10px] text-center leading-tight">{mod.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Semester progress */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading flex items-center justify-between text-[#1a237e] text-base">
                  <span>Current Semester Progress</span>
                  <span className="text-xs font-normal text-muted-foreground">Week 8 of 16</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>50% Completed</span><span>Mid-terms approaching</span>
                  </div>
                  <Progress value={50} className="h-3 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading flex items-center gap-2 text-base text-[#1a237e]">
                <Calendar className="h-4 w-4 text-[#E8821A]" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events && events.length > 0
                ? events.slice(0, 3).map(event => (
                    <div key={event.id} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="bg-[#1a237e]/10 rounded-lg p-2 text-center min-w-[3rem] shrink-0">
                        <div className="text-[9px] font-bold text-[#1a237e] uppercase">
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-lg font-heading font-bold text-[#1a237e]">{new Date(event.date).getDate()}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs line-clamp-1">{event.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                : [1,2,3].map(i => (
                    <div key={i} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0 opacity-40">
                      <div className="bg-muted rounded-lg p-2 min-w-[3rem] h-12" />
                      <div className="flex-1 space-y-1.5 pt-1">
                        <div className="h-2.5 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
              <Link href="/dashboard/events" className="flex items-center justify-center text-xs font-semibold text-[#1a237e] hover:text-[#E8821A] pt-1 transition-colors">
                View all events <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, description, trend, trendColor, accent }: any) {
  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="h-1 w-full" style={{ background: accent }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
          <div className="p-1.5 rounded-full" style={{ background: `${accent}18` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
          </div>
        </div>
        <div className="text-2xl font-heading font-black text-foreground mb-0.5 tracking-tight">{value}</div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-muted-foreground truncate">{description}</span>
          <span className={`font-semibold ml-1 flex-shrink-0 ${trendColor}`}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
