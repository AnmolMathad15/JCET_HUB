import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { isAuthenticated, getUser, clearAuthToken, clearUser } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Bell, LogOut, Menu, Calendar, BookOpen, Clock,
  LayoutDashboard, Bus, GraduationCap, Wallet,
  MessageSquare, FileText, Users, CalendarDays, FlaskConical, Award, BookMarked,
  ClipboardList, Shield, Building2, Layers, Link2,
  Zap, Trophy, Star, Briefcase, PartyPopper,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RIBBON_TEXT = "Jain College of Engineering and Technology, Hubballi";

interface LayoutProps { children: ReactNode; title?: string; }

const BASE_NAV_GROUPS = [
  {
    label: "Academic",
    roles: ["student", "faculty", "admin"],
    items: [
      { href: "/dashboard",                  label: "Overview",           icon: LayoutDashboard },
      { href: "/dashboard/attendance",        label: "Attendance",         icon: Clock },
      { href: "/dashboard/timetable",         label: "Time Table",         icon: Calendar },
      { href: "/dashboard/academic-calendar", label: "Academic Calendar",  icon: CalendarDays },
      { href: "/dashboard/marks",             label: "Internal Assessment",icon: BookOpen },
      { href: "/dashboard/exam-schedule",     label: "Exam Schedule",      icon: FlaskConical },
      { href: "/dashboard/results",           label: "Results",            icon: Award },
    ],
  },
  {
    label: "Learning",
    roles: ["student", "faculty", "admin"],
    items: [
      { href: "/dashboard/lms",         label: "LMS Dashboard",  icon: GraduationCap },
      { href: "/dashboard/notes",       label: "App Notes",       icon: BookMarked },
      { href: "/dashboard/assignments", label: "Assignments",     icon: ClipboardList },
    ],
  },
  {
    label: "Campus Life",
    roles: ["student", "faculty", "admin"],
    items: [
      { href: "/dashboard/events-hub",   label: "Events Hub",       icon: PartyPopper },
      { href: "/dashboard/leaderboard",  label: "Leaderboard",      icon: Trophy },
      { href: "/dashboard/achievements", label: "My Achievements",  icon: Zap },
      { href: "/dashboard/resume",       label: "Resume Builder",   icon: Briefcase },
    ],
  },
  {
    label: "Campus",
    roles: ["student", "faculty", "admin"],
    items: [
      { href: "/dashboard/events",    label: "Events",    icon: Calendar },
      { href: "/dashboard/circular",  label: "Circular",  icon: FileText },
      { href: "/dashboard/transport", label: "Transport", icon: Bus },
      { href: "/dashboard/fees",      label: "Fees",      icon: Wallet },
    ],
  },
  {
    label: "Connect",
    roles: ["student", "faculty", "admin"],
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/mentoring",     label: "Mentoring",     icon: Users },
      { href: "/dashboard/feedback",      label: "Feedback",      icon: MessageSquare },
    ],
  },
  {
    label: "Admin Panel",
    roles: ["admin"],
    items: [
      { href: "/dashboard/admin",                     label: "Control Panel",    icon: Shield },
      { href: "/dashboard/admin/departments",          label: "Departments",      icon: Building2 },
      { href: "/dashboard/admin/batches",              label: "Batches",          icon: Layers },
      { href: "/dashboard/admin/subjects",             label: "Subjects",         icon: BookOpen },
      { href: "/dashboard/admin/users",                label: "Users",            icon: Users },
      { href: "/dashboard/admin/faculty-assignments",  label: "Faculty Assign",   icon: Link2 },
    ],
  },
];

export function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const [user, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/");
    } else {
      setUserData(getUser());
    }
  }, [setLocation]);

  const handleLogout = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearAuthToken();
    clearUser();
    setLocation("/");
  };

  const NAV_GROUPS = user
    ? BASE_NAV_GROUPS.filter(g => g.roles.includes(user.role))
    : BASE_NAV_GROUPS.filter(g => g.roles.includes("student"));

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* ── Fixed college building background (visible everywhere) ── */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/clg-building.jpg')" }}
      />
      {/* Overlay: light enough to keep building visible, content sits on white card */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(7,13,48,0.52) 0%, rgba(10,16,64,0.44) 50%, rgba(7,13,48,0.55) 100%)" }}
      />

      {/* ── Scrolling ribbon ── */}
      <div className="relative z-30 overflow-hidden bg-[#1a237e]/95 border-b-2 border-[#E8821A] flex-shrink-0" style={{ height: 40 }}>
        <div className="ribbon-scroll-track flex items-center h-full whitespace-nowrap">
          {[0, 1].map((clone) => (
            <span key={clone} className="flex items-center" aria-hidden={clone === 1 ? true : undefined}>
              {Array(8).fill(null).map((_, i) => (
                <span key={i} className="flex items-center gap-3 px-5">
                  <img src="/jgi-logo.jpg" alt="JGI" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                  <span className="text-white font-bold text-[11px] tracking-widest uppercase">{RIBBON_TEXT}</span>
                  <span className="text-[#E8821A] text-lg leading-none">•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d1545]/90 backdrop-blur-md shadow-lg">
        <div className="container mx-auto flex h-14 items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] overflow-y-auto">
                <div className="flex items-center gap-3 mb-5 mt-2">
                  {/* Circle logo in sidebar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden sidebar-logo-glow flex-shrink-0">
                    <img src="/college-logo.png" alt="JCET" className="w-full h-full object-contain bg-white" />
                  </div>
                  <div>
                    <p className="brand-name-sm">
                      <span className="text-[#1a237e]">JCET</span>
                      <span className="text-[#E8821A]"> HUB</span>
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Smart Campus Portal</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-4">
                  {NAV_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">{group.label}</p>
                      {group.items.map(item => (
                        <Link key={item.href} href={item.href} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted text-foreground transition-colors" data-testid={`link-mobile-${item.label.toLowerCase()}`}>
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Brand logo + name */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden header-logo-glow flex-shrink-0">
                <img src="/college-logo.png" alt="JCET Logo" className="w-full h-full object-contain bg-white" />
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="brand-name-header">
                  <span className="text-white">JCET</span>
                  <span className="text-[#E8821A]"> HUB</span>
                </span>
                <span className="text-[9px] text-white/50 tracking-[0.18em] uppercase font-medium">Smart Campus Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8821A] rounded-full border border-[#0d1545]" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-white/20 hover:border-[#E8821A]/70 transition-colors" data-testid="button-user-menu">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-[#E8821A] text-white font-bold text-xs">
                      {user.avatarInitials || user.name?.substring(0, 2).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.usn} • {user.branch ?? user.role}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Main content area ── */}
      <div className="flex flex-1 container mx-auto relative z-10">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col px-3 py-4 h-[calc(100vh-6.5rem)] sticky top-[6.5rem] overflow-y-auto border-r border-white/10">
          <nav className="flex flex-col gap-4">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2 mb-1">{group.label}</p>
                {group.items.map(item => <NavRoute key={item.href} {...item} />)}
              </div>
            ))}
          </nav>
        </aside>

        {/* Page content — white card overlay so content is easy to read */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl min-h-full p-5 md:p-6">
            {children}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ribbon-scroll-track { display:flex; width:max-content; animation:ribbonScroll 35s linear infinite; }
        @keyframes ribbonScroll { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }

        .header-logo-glow {
          box-shadow:
            0 0 0 2px rgba(232,130,26,0.6),
            0 0 12px 4px rgba(232,130,26,0.5),
            0 0 28px 8px rgba(26,35,126,0.4);
        }
        .sidebar-logo-glow {
          box-shadow:
            0 0 0 2px rgba(232,130,26,0.5),
            0 0 10px 4px rgba(232,130,26,0.4),
            0 0 22px 7px rgba(26,35,126,0.3);
        }
        .brand-name-header {
          font-family: 'Rajdhani', 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 1.35rem;
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .brand-name-sm {
          font-family: 'Rajdhani', 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          letter-spacing: 0.04em;
          line-height: 1.1;
        }
      `}} />
    </div>
  );
}

function NavRoute({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-xs ${
        isActive
          ? "bg-[#E8821A]/90 text-white font-semibold shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
      data-testid={`link-sidebar-${label.toLowerCase()}`}
    >
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
      <span>{label}</span>
    </Link>
  );
}

export default Layout;
