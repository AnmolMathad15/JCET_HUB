import { Layout } from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Clock } from "lucide-react";
import { useState } from "react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday",
  THU: "Thursday", FRI: "Friday", SAT: "Saturday",
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const SECTIONS = [
  { value: "6A", label: "VI A – CSE",  room: "LH 202", coordinator: "Prof. Trupti T" },
  { value: "6B", label: "VI B – CSE",  room: "LH 203", coordinator: "Prof. Amruta Naveen" },
  { value: "6C", label: "VI C – CSE",  room: "LH 204", coordinator: "Prof. Megha S" },
  { value: "6D", label: "VI D – AIML", room: "LH 205", coordinator: "Prof. Praveen" },
];

const TIMING_LABELS: Record<number, string> = {
  1: "8:30 – 9:30",
  2: "9:30 – 10:30",
  3: "10:45 – 11:45",
  4: "11:45 – 12:45",
  5: "1:30 – 2:20",
  6: "2:20 – 3:10",
  7: "3:10 – 4:00",
};

// subject code → color (for visual distinction)
const CODE_COLORS: Record<string, string> = {
  BCS601:  "bg-blue-50 border-blue-200 text-blue-800",
  BCS602:  "bg-purple-50 border-purple-200 text-purple-800",
  BCS613A: "bg-emerald-50 border-emerald-200 text-emerald-800",
  BCSL606: "bg-cyan-50 border-cyan-200 text-cyan-800",
  BAIL657C:"bg-rose-50 border-rose-200 text-rose-800",
  BCS685:  "bg-amber-50 border-amber-200 text-amber-800",
  BIKS609: "bg-orange-50 border-orange-200 text-orange-800",
  BAI601:  "bg-violet-50 border-violet-200 text-violet-800",
  BAI602:  "bg-indigo-50 border-indigo-200 text-indigo-800",
  BAI685:  "bg-amber-50 border-amber-200 text-amber-800",
  OEC:     "bg-gray-50 border-gray-200 text-gray-700",
  BAIL606: "bg-teal-50 border-teal-200 text-teal-800",
};

interface TimetableEntry {
  day: string; period: number; startTime: string; endTime: string;
  subject: string; subjectCode: string; faculty: string; room: string;
}

export default function Timetable() {
  const [section, setSection] = useState("6A");
  const { data: timetable } = useApiGet<TimetableEntry[]>(`/timetable?section=${section}`);

  const todayShort = new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().substring(0, 3);
  const defaultTab = DAYS.includes(todayShort) ? todayShort : "MON";

  const scheduleByDay = (timetable ?? []).reduce((acc, entry) => {
    (acc[entry.day] ??= {})[entry.period] = entry;
    return acc;
  }, {} as Record<string, Record<number, TimetableEntry>>);

  const currentSection = SECTIONS.find(s => s.value === section)!;

  return (
    <Layout>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        {/* Header + section selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Class Timetable</h1>
            <p className="text-muted-foreground mt-1 text-sm">6th Semester – Academic Year 2025-26 (W.E.F. 27-01-2026)</p>
          </div>
          <div className="flex-shrink-0 w-48">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="border-[#1a237e]/30 font-semibold text-[#1a237e] bg-blue-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value} className="font-semibold">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section info bar */}
        <Card className="bg-[#1a237e] text-white border-0 shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Section</p>
              <p className="font-black text-lg">{currentSection.label}</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Lecture Hall</p>
              <p className="font-bold">{currentSection.room}</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Class Coordinator</p>
              <p className="font-bold">{currentSection.coordinator}</p>
            </div>
            <Badge className="bg-[#E8821A] text-white ml-auto self-center">Sem VI · 2025-26</Badge>
          </CardContent>
        </Card>

        {/* Note */}
        <p className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="font-bold text-amber-700">Note:</span> 1st and 3rd Saturdays of the month are holidays. Remaining Saturdays are full working days.
        </p>

        {/* Day tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-4 h-auto p-1 bg-muted/60 rounded-xl">
            {DAYS.map(day => (
              <TabsTrigger
                key={day}
                value={day}
                className="py-2.5 data-[state=active]:bg-[#1a237e] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold"
              >
                {day}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS.map(day => (
            <TabsContent key={day} value={day} className="mt-0 outline-none">
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-[#1a237e]/5 border-b border-border/50 py-3 px-5">
                  <CardTitle className="text-base text-[#1a237e]">{DAY_LABELS[day]}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Break / lunch indicators inline */}
                  <div className="divide-y divide-border/40">
                    {PERIODS.map(period => {
                      const entry = scheduleByDay[day]?.[period];

                      return (
                        <div key={period}>
                          {/* After period 2, show break */}
                          {period === 3 && (
                            <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-border/30">
                              <div className="w-11 h-7 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Break</span>
                              </div>
                              <span className="text-[10px] text-gray-400">10:30 – 10:45 AM</span>
                            </div>
                          )}
                          {/* After period 4, show lunch */}
                          {period === 5 && (
                            <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-border/30">
                              <div className="w-11 h-7 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Lunch</span>
                              </div>
                              <span className="text-[10px] text-gray-400">12:45 – 1:30 PM</span>
                            </div>
                          )}

                          {entry ? (
                            <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-4 flex-shrink-0 w-40">
                                <div className="bg-[#E8821A]/10 text-[#E8821A] font-black rounded-lg w-11 h-11 flex items-center justify-center text-lg border border-[#E8821A]/20 flex-shrink-0">
                                  {period}
                                </div>
                                <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  {TIMING_LABELS[period]}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm">{entry.subject}</h3>
                                  <Badge variant="outline" className={`text-[9px] font-bold border ${CODE_COLORS[entry.subjectCode] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
                                    {entry.subjectCode}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                                  {entry.faculty && (
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{entry.faculty}</span>
                                  )}
                                  {entry.room && (
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Room {entry.room}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="px-5 py-3 text-xs text-muted-foreground/40 flex items-center gap-4 italic">
                              <div className="w-11 text-center font-bold not-italic text-muted-foreground/30">{period}</div>
                              <span className="text-[10px]">{TIMING_LABELS[period]} — Free / VAC / NSS</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Object.keys(scheduleByDay[day] ?? {}).length === 0 && !timetable && (
                      <div className="p-12 text-center text-muted-foreground flex flex-col items-center opacity-40">
                        <Clock className="h-8 w-8 mb-2" />
                        <p className="font-semibold text-sm">Loading schedule…</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Subject legend */}
        {timetable && timetable.length > 0 && (
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm text-[#1a237e]">Subject Legend</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {Array.from(new Map(timetable.map(e => [e.subjectCode, e])).values()).map(e => (
                  <div key={e.subjectCode} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${CODE_COLORS[e.subjectCode] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
                    <span className="font-black">{e.subjectCode}</span>
                    <span className="opacity-70">–</span>
                    <span>{e.subject}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
