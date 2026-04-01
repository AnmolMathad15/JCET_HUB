import Layout from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { Calendar, GraduationCap, Trophy, Palmtree, FlaskConical, AlertCircle } from "lucide-react";

interface CalendarEvent {
  id: string; title: string; date: string; endDate?: string;
  category: string; description: string; important?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  exam:     { label: "Examination", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    Icon: FlaskConical },
  academic: { label: "Academic",    color: "text-[#1a237e]",  bg: "bg-blue-50",   border: "border-blue-200",   Icon: GraduationCap },
  holiday:  { label: "Holiday",     color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200", Icon: Palmtree },
  event:    { label: "Event",       color: "text-[#E8821A]",  bg: "bg-amber-50",  border: "border-amber-200",  Icon: Trophy },
};

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function fmtFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const SEM_SCHEDULE = [
  {
    sem: "6th Semester",
    color: "text-[#1a237e]",
    bg: "bg-blue-50",
    border: "border-blue-200",
    commencement: "27 Jan 2026",
    lwd: "16 May 2026",
    practical: "18 May – 29 May 2026",
    theory: "1 Jun – 26 Jun 2026",
  },
  {
    sem: "8th Semester",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    commencement: "27 Jan 2026",
    lwd: "9 May 2026",
    practical: "6 May – 12 May 2026",
    theory: "11 May – 30 May 2026",
  },
];

export default function AcademicCalendar() {
  const { data: events, isLoading } = useApiGet<CalendarEvent[]>("/academic-calendar");

  const grouped = (events ?? []).reduce((acc, e) => {
    const d = new Date(e.date);
    const key = `${MONTH_ORDER[d.getMonth()]} ${d.getFullYear()}`;
    (acc[key] ??= []).push(e);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedMonths = Object.keys(grouped).sort((a, b) => {
    const da = new Date(grouped[a][0].date);
    const db = new Date(grouped[b][0].date);
    return da.getTime() - db.getTime();
  });

  return (
    <Layout title="Academic Calendar">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E8821A] rounded-full translate-y-24 -translate-x-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E8821A] rounded-xl flex items-center justify-center text-xl">📅</div>
              <div>
                <h2 className="text-xl font-bold">Academic Calendar 2025–26</h2>
                <p className="text-blue-200 text-xs">Even Semester — 6th &amp; 8th Semester</p>
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-2 leading-relaxed">
              Jain College of Engineering and Technology, Hubballi &nbsp;|&nbsp; Academic Co-ordinator: Prof. Prasanna S Patbashetty &nbsp;|&nbsp; Principal: Dr. Prashanth Basekar
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <span key={key} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white flex items-center gap-1">
                  <cfg.Icon className="w-3 h-3" /> {cfg.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {SEM_SCHEDULE.map(s => (
            <div key={s.sem} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
              <h3 className={`font-bold text-sm mb-3 ${s.color}`}>{s.sem} — Schedule</h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: "Commencement", value: s.commencement },
                  { label: "Last Working Day", value: s.lwd },
                  { label: "Practical Exam", value: s.practical },
                  { label: "Theory Exam", value: s.theory },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-gray-500 font-medium">{row.label}</span>
                    <span className={`font-semibold ${s.color} text-right`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : sortedMonths.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No calendar data available.</div>
        ) : (
          <div className="space-y-4">
            {sortedMonths.map(month => (
              <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1a237e]/5 border-b border-[#1a237e]/10 py-3 px-5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#E8821A]" />
                  <span className="text-sm font-bold text-[#1a237e]">{month}</span>
                  <span className="ml-auto text-xs text-gray-400">{grouped[month].length} events</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {grouped[month]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(ev => {
                      const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.academic;
                      const Icon = cfg.Icon;
                      const d = new Date(ev.date);
                      return (
                        <div
                          key={ev.id}
                          className={`flex gap-4 p-4 hover:bg-gray-50/70 transition-colors ${ev.important ? "border-l-4 border-l-red-400" : "border-l-4 border-l-transparent"}`}
                        >
                          <div className="flex-shrink-0 text-center w-12">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">
                              {d.toLocaleDateString("en-US", { month: "short" })}
                            </div>
                            <div className="text-2xl font-black text-[#1a237e] leading-none">{d.getDate()}</div>
                            <div className="text-[10px] text-gray-400">
                              {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-gray-800">{ev.title}</h4>
                              {ev.important && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                                  <AlertCircle className="w-2.5 h-2.5" /> Important
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>
                            {ev.endDate && (
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                {fmtShort(ev.date)} – {fmtFull(ev.endDate)}
                              </p>
                            )}
                          </div>
                          <div className={`flex-shrink-0 p-2 rounded-lg border self-start ${cfg.bg} ${cfg.border}`}>
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pb-4">
          Prepared by Academic Co-ordinator · Approved by Principal · JCET Hubballi
        </div>
      </div>
    </Layout>
  );
}
