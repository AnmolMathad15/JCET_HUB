import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText, Link2, Download, ExternalLink } from "lucide-react";

const COURSES = [
  {
    code: "18MAT41", name: "Engineering Mathematics IV", faculty: "Dr. A. Kulkarni",
    color: "bg-blue-500", progress: 65,
    resources: [
      { type: "slides", title: "Module 1 – Fourier Series", url: "#" },
      { type: "video",  title: "Laplace Transform – Lecture 5", url: "#" },
      { type: "pdf",    title: "Previous Year Question Papers", url: "#" },
    ],
  },
  {
    code: "18CS32", name: "Data Structures & Algorithms", faculty: "Prof. B. Patil",
    color: "bg-emerald-500", progress: 80,
    resources: [
      { type: "slides", title: "Module 3 – Trees & Graphs", url: "#" },
      { type: "video",  title: "AVL Tree Rotation – Demo", url: "#" },
      { type: "pdf",    title: "Lab Programs (1–15)", url: "#" },
    ],
  },
  {
    code: "18CS53", name: "Database Management Systems", faculty: "Dr. C. Nair",
    color: "bg-purple-500", progress: 70,
    resources: [
      { type: "slides", title: "Module 2 – ER Diagrams", url: "#" },
      { type: "video",  title: "SQL Joins – Explained", url: "#" },
      { type: "pdf",    title: "DBMS Lab Manual", url: "#" },
    ],
  },
  {
    code: "18CS43", name: "Operating Systems", faculty: "Dr. D. Rao",
    color: "bg-orange-500", progress: 55,
    resources: [
      { type: "slides", title: "Module 4 – Memory Management", url: "#" },
      { type: "pdf",    title: "Process Scheduling Examples", url: "#" },
    ],
  },
  {
    code: "18CS55", name: "Computer Networks", faculty: "Prof. E. Joshi",
    color: "bg-cyan-500", progress: 60,
    resources: [
      { type: "slides", title: "Module 1 – OSI Model", url: "#" },
      { type: "video",  title: "TCP/IP Protocol Suite", url: "#" },
    ],
  },
  {
    code: "18CS51", name: "Software Engineering", faculty: "Prof. F. Mehta",
    color: "bg-rose-500", progress: 75,
    resources: [
      { type: "slides", title: "Module 3 – Agile Methodology", url: "#" },
      { type: "pdf",    title: "Case Study – Mini Project Guide", url: "#" },
    ],
  },
];

const ICON_MAP: Record<string, any> = { slides: FileText, video: Video, pdf: Download, link: Link2 };

export default function LMS() {
  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">LMS Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Learning Management System – 5th Semester CSE</p>
          </div>
          <Badge className="bg-[#E8821A] text-white px-3 py-1">Semester 5</Badge>
        </div>

        {/* Overall progress */}
        <Card className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Overall Course Progress</p>
              <div className="text-4xl font-black mt-1">67%</div>
              <p className="text-white/70 text-sm mt-1">6 courses • Week 8 of 16</p>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1">
              {[{ label: "Lectures", value: "48/72" }, { label: "Resources", value: "18" }, { label: "Assignments", value: "5 pending" }].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="font-bold text-lg">{s.value}</div>
                  <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COURSES.map(course => {
            return (
              <Card key={course.code} className="shadow-sm border-border/50 hover:shadow-md transition-all overflow-hidden">
                <div className={`h-1.5 w-full ${course.color}`} />
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold leading-snug">{course.name}</CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">{course.code} • {course.faculty}</CardDescription>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#1a237e]">
                      {course.progress}%
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.progress}%` }} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {course.resources.map((r, i) => {
                    const Icon = ICON_MAP[r.type] ?? BookOpen;
                    return (
                      <a key={i} href={r.url} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className="p-1.5 bg-muted rounded-md group-hover:bg-[#1a237e]/10">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#1a237e]" />
                        </div>
                        <span className="text-[11px] font-medium flex-1 truncate">{r.title}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
