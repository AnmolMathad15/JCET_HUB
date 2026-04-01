import { Layout } from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SemResult {
  semester: number; sgpa: number; credits: number; year: string;
  subjects: Array<{ name: string; code: string; grade: string; points: number }>;
}
interface ResultsData { cgpa: number; totalCredits: number; semesters: SemResult[]; }

const GRADE_COLOR: Record<string, string> = {
  O: "bg-emerald-500 text-white", "A+": "bg-blue-500 text-white",
  A: "bg-[#1a237e] text-white", "B+": "bg-amber-500 text-white",
  B: "bg-orange-500 text-white", C: "bg-red-400 text-white",
};

export default function Results() {
  const { data } = useApiGet<ResultsData>("/results");
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Semester Results</h1>
          <p className="text-muted-foreground mt-1 text-sm">VTU results and SGPA/CGPA tracker</p>
        </div>

        {/* CGPA summary banner */}
        <Card className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white border-0 shadow-lg overflow-hidden relative">
          <div className="absolute right-4 top-4 opacity-10"><Award className="w-32 h-32" /></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Cumulative GPA</p>
            <div className="text-6xl font-black mt-1 leading-none">{data?.cgpa.toFixed(2) ?? "—"}</div>
            <p className="text-white/70 text-sm mt-2">Total Credits Earned: <span className="font-bold text-white">{data?.totalCredits ?? "—"}</span></p>
            <div className="flex gap-4 mt-4 flex-wrap">
              {data?.semesters.map(s => (
                <div key={s.semester} className="bg-white/10 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-white/60 font-semibold">Sem {s.semester}</div>
                  <div className="text-lg font-black">{s.sgpa.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SGPA trend */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1a237e] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#E8821A]" /> SGPA Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-24">
              {(data?.semesters ?? [{semester:1,sgpa:0},{semester:2,sgpa:0},{semester:3,sgpa:0},{semester:4,sgpa:0}]).map((s: any) => {
                const heightPct = ((s.sgpa - 5) / 5) * 100;
                return (
                  <div key={s.semester} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#1a237e]">{s.sgpa > 0 ? s.sgpa.toFixed(2) : "—"}</span>
                    <div className="w-full bg-muted rounded-t-md relative overflow-hidden" style={{ height: 64 }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-[#1a237e] rounded-t-md transition-all" style={{ height: `${Math.max(5, heightPct)}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">Sem {s.semester}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Semester-wise results */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-[#1a237e] uppercase tracking-widest">Semester-wise Breakdown</h3>
          {(data?.semesters ?? []).slice().reverse().map(sem => (
            <Card key={sem.semester} className="shadow-sm border-border/50 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(expanded === sem.semester ? null : sem.semester)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#1a237e] text-white rounded-lg w-10 h-10 flex items-center justify-center font-black text-sm">
                    S{sem.semester}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Semester {sem.semester} — {sem.year}</div>
                    <div className="text-xs text-muted-foreground">Credits: {sem.credits}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-black text-[#1a237e]">{sem.sgpa.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">SGPA</div>
                  </div>
                  {expanded === sem.semester ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {expanded === sem.semester && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {sem.subjects.map(sub => (
                    <div key={sub.code} className="flex items-center justify-between px-5 py-3 hover:bg-muted/10">
                      <div>
                        <div className="font-medium text-sm">{sub.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{sub.code}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">{sub.points} pts</span>
                        <Badge className={`text-xs font-bold min-w-[2rem] justify-center ${GRADE_COLOR[sub.grade] ?? "bg-gray-100 text-gray-700"}`}>
                          {sub.grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
