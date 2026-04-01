import Layout from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { BookOpen, FlaskConical, CalendarDays, Info, Clock, AlertCircle } from "lucide-react";

interface ExamSchedule {
  notification: { ref: string; date: string; subject: string; issuedBy: string; note: string; };
  semesters: Array<{
    sem: string; program: string; colorClass: string;
    commencement: string; lastWorkingDay: string;
    theory: { start: string; end: string };
    practical: { start: string; end: string };
    nextSemester: string;
  }>;
  generalInfo: string[];
}

const COLOR_MAP: Record<string, { bg: string; border: string; header: string; text: string }> = {
  blue:   { bg: "bg-blue-50",       border: "border-blue-200",     header: "bg-blue-600",   text: "text-blue-700" },
  indigo: { bg: "bg-indigo-50",     border: "border-indigo-200",   header: "bg-indigo-600", text: "text-indigo-700" },
  navy:   { bg: "bg-[#1a237e]/5",   border: "border-[#1a237e]/20", header: "bg-[#1a237e]",  text: "text-[#1a237e]" },
  amber:  { bg: "bg-orange-50",     border: "border-orange-200",   header: "bg-[#E8821A]",  text: "text-[#E8821A]" },
};

export default function ExamSchedule() {
  const { data, isLoading } = useApiGet<ExamSchedule>("/exam-schedule");

  return (
    <Layout title="Exam Schedule">
      <div className="space-y-6 max-w-5xl mx-auto">

        <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E8821A] rounded-full translate-y-24 -translate-x-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E8821A] rounded-xl flex items-center justify-center text-xl">📋</div>
              <div>
                <h2 className="text-xl font-bold">Exam Schedule 2025–26</h2>
                <p className="text-blue-200 text-xs">Even Semester — II, IV, VI &amp; VIII Semester B.E. / B.Tech</p>
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-1">
              As per VTU Revised Notification — Theory &amp; Practical examination dates per semester
            </p>
          </div>
        </div>

        {data?.notification && (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <p className="text-sm font-bold text-amber-800">VTU Revised Notification</p>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">{data.notification.ref}</span>
                  <span className="text-xs text-amber-600">Dated: {data.notification.date}</span>
                </div>
                <p className="text-xs text-amber-700 font-medium">{data.notification.subject}</p>
                <p className="text-xs text-amber-600 mt-1 italic">Note: {data.notification.note}</p>
                <p className="text-[10px] text-amber-500 mt-1">Issued by: {data.notification.issuedBy}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {(data?.semesters ?? []).map(s => {
              const c = COLOR_MAP[s.colorClass] ?? COLOR_MAP.navy;
              const rows = [
                { label: "Commencement",          icon: CalendarDays, value: s.commencement },
                { label: "Last Working Day",       icon: CalendarDays, value: s.lastWorkingDay },
                { label: "Theory Examinations",    icon: BookOpen,     value: `${s.theory.start} → ${s.theory.end}` },
                { label: "Practical / Viva-Voce",  icon: FlaskConical, value: `${s.practical.start} → ${s.practical.end}` },
                { label: "Next Semester Begins",   icon: CalendarDays, value: s.nextSemester },
              ];
              return (
                <div key={s.sem} className={`rounded-xl border overflow-hidden shadow-sm ${c.border}`}>
                  <div className={`${c.header} text-white px-4 py-3 flex items-center justify-between`}>
                    <div>
                      <h3 className="font-bold text-sm">{s.sem}</h3>
                      <p className="text-white/80 text-[10px]">{s.program}</p>
                    </div>
                    <span className="text-2xl opacity-70">📚</span>
                  </div>
                  <div className={`${c.bg} divide-y divide-white/60`}>
                    {rows.map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <row.icon className={`w-3.5 h-3.5 shrink-0 ${c.text}`} />
                          <span className="text-xs text-gray-500 truncate">{row.label}</span>
                        </div>
                        <span className={`text-xs font-bold ${c.text} text-right`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#1a237e]/5 border border-[#1a237e]/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#1a237e]" />
            <span className="text-sm font-bold text-[#1a237e]">Examination Timings</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-[#1a237e]/15 p-3 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#1a237e]" />
              <div>
                <p className="text-xs font-bold text-gray-800">Theory Examinations</p>
                <p className="text-sm font-black text-[#1a237e]">09:30 AM – 12:30 PM</p>
                <p className="text-[10px] text-gray-400">Duration: 3 hours</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E8821A]/20 p-3 flex items-center gap-3">
              <FlaskConical className="w-5 h-5 text-[#E8821A]" />
              <div>
                <p className="text-xs font-bold text-gray-800">Practical / Viva-Voce</p>
                <p className="text-sm font-black text-[#E8821A]">10:00 AM onwards</p>
                <p className="text-[10px] text-gray-400">Duration: as per subject</p>
              </div>
            </div>
          </div>
        </div>

        {data?.generalInfo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#1a237e]" />
              <span className="text-sm font-bold text-[#1a237e]">General Instructions</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {data.generalInfo.map((info, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-[#1a237e]/10 text-[#1a237e] text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="text-sm text-gray-600">{info}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pb-4">
          Source: VTU Belagavi — Ref: VTU/BGM/BoS/R; IV &amp; VI sem UG/2025-26/6556 · Dated 20 Mar 2026
        </div>
      </div>
    </Layout>
  );
}
