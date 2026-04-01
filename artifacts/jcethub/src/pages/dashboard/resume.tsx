import { useRef, useState } from "react";
import Layout from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Download, Printer, Star, Zap, Award, Briefcase, Code2, Users, BookOpen, Loader2 } from "lucide-react";

interface ResumeData {
  student: { name: string; usn: string; branch: string | null; email: string | null; phone: string | null; role: string; } | null;
  totalPoints: number;
  level: { name: string; icon: string; };
  eventsAttended: { eventId: string; attendedAt: string | null; event: { title: string; type: string; date: string; xpReward: number; domain: string | null; } | null; }[];
  badges: { id: string; definition: { name: string; icon: string; category: string; } | null; }[];
  skills: string[];
  typeGroups: Record<string, string[]>;
  summary: string;
}

const TYPE_ROLE: Record<string, string> = {
  technical: "Technical Participant",
  hackathon: "Hackathon Competitor",
  cultural: "Cultural Participant",
  sports: "Sports Participant",
  workshop: "Workshop Attendee",
  academic: "Academic Presenter",
};

function SkillTag({ label }: { label: string }) {
  return <span className="inline-block border border-[#1a237e]/30 text-[#1a237e] text-xs font-semibold px-2.5 py-1 rounded-full mr-1.5 mb-1.5">{label}</span>;
}

export default function ResumeBuilder() {
  const user = getUser();
  const { data, isLoading } = useApiGet<ResumeData>("/resume-data");
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Extracurricular Resume – ${data?.student?.name ?? "Student"}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1f2937; background: #fff; padding: 32px; }
        .print-page { max-width: 800px; margin: auto; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 13px; font-weight: 700; color: #1a237e; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #1a237e; padding-bottom: 6px; margin-bottom: 12px; }
        .header-name { font-size: 28px; font-weight: 700; color: #1a237e; }
        .header-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .level-badge { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #d97706; font-weight: 700; padding: 3px 10px; border-radius: 999px; font-size: 12px; }
        .event-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .event-title { font-weight: 600; font-size: 14px; }
        .event-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .skill-tag { display: inline-block; border: 1.5px solid #c7d2fe; color: #1a237e; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; margin-right: 6px; margin-bottom: 6px; }
        .badge-item { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: 600; margin-right: 8px; margin-bottom: 8px; }
        .summary { background: #f0f4ff; border-left: 3px solid #1a237e; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #374151; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <div class="print-page">${content}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 0;
      while (y < pdfHeight) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, pdfWidth, pdfHeight);
        y += pageHeight;
      }
      const name = data?.student?.name?.replace(/\s+/g, "_") ?? "Student";
      pdf.save(`${name}_JCET_Resume.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please use the Print option instead.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return <Layout title="Resume Builder"><div className="p-8 text-center text-gray-400">Loading your resume data...</div></Layout>;
  }

  if (!data) {
    return <Layout title="Resume Builder">
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <div className="text-4xl mb-3">📄</div>
        <p className="text-gray-500 font-medium">No extracurricular data yet</p>
        <p className="text-gray-400 text-sm mt-1">Attend campus events to build your verifiable resume automatically.</p>
      </div>
    </Layout>;
  }

  const { student, totalPoints, level, eventsAttended, badges, skills, typeGroups, summary } = data;
  const groupedEvents = Object.entries(typeGroups);

  return (
    <Layout title="Resume Builder">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#1a237e]" /> Extracurricular Resume Builder
            </h2>
            <p className="text-sm text-gray-400">Auto-generated from your verified campus activity record</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || (eventsAttended.length === 0 && badges.length === 0)}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#283593] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Printer className="w-4 h-4" /> Print View
            </button>
          </div>
        </div>

        {eventsAttended.length === 0 && badges.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
            <strong>Your resume is empty.</strong> Register for campus events in the Events Hub and attend them. The system will automatically build your resume from verified participation records.
          </div>
        ) : null}

        <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-7">
          <div className="section">
            <div className="flex items-start justify-between flex-wrap gap-3 pb-5 border-b-2 border-[#1a237e]">
              <div>
                <div className="header-name text-3xl font-extrabold text-[#1a237e]">{student?.name ?? user?.name}</div>
                <div className="header-meta text-sm text-gray-500 mt-1 space-y-0.5">
                  <div>{student?.usn} · {student?.branch ?? student?.role}</div>
                  {student?.email && <div>✉ {student.email}</div>}
                  {student?.phone && <div>📞 {student.phone}</div>}
                  <div className="font-semibold text-[#1a237e]">Jain College of Engineering and Technology, Hubballi</div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-3xl font-extrabold text-amber-600 flex items-center gap-1.5 justify-end">
                  <Zap className="w-7 h-7" /> {totalPoints} XP
                </div>
                <div className="level-badge inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">
                  {level.icon} {level.name} Level
                </div>
                <div className="text-xs text-gray-400">{eventsAttended.length} verified events · {badges.length} badges</div>
              </div>
            </div>
          </div>

          {summary && (
            <div className="section">
              <div className="section-title text-xs font-bold text-[#1a237e] uppercase tracking-wider mb-3">Summary</div>
              <div className="summary bg-blue-50 border-l-4 border-[#1a237e] px-4 py-3 rounded-r-xl text-sm text-gray-700">
                {summary}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div className="section">
              <div className="section-title text-xs font-bold text-[#1a237e] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Skills Demonstrated
              </div>
              <div>
                {skills.map(s => <SkillTag key={s} label={s} />)}
              </div>
            </div>
          )}

          {groupedEvents.length > 0 && (
            <div className="section">
              <div className="section-title text-xs font-bold text-[#1a237e] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Extracurricular Participation
              </div>
              <div className="space-y-4">
                {groupedEvents.map(([type, eventTitles]) => (
                  <div key={type}>
                    <div className="font-semibold text-gray-700 text-sm mb-2">
                      {TYPE_ROLE[type] ?? "Participant"} <span className="text-gray-400 font-normal">({eventTitles.length} events)</span>
                    </div>
                    <div className="space-y-1 pl-3 border-l-2 border-[#1a237e]/20">
                      {eventsAttended
                        .filter(ea => ea.event?.type === type)
                        .map(ea => (
                          <div key={ea.eventId} className="event-item">
                            <div className="event-title text-sm font-semibold text-gray-800">{ea.event?.title}</div>
                            <div className="event-meta text-xs text-gray-400">
                              {ea.event?.date ? new Date(ea.event.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                              {" · "} Verified Attendance
                              {" · "} <span className="text-amber-600 font-medium">+{ea.event?.xpReward} XP</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {badges.length > 0 && (
            <div className="section">
              <div className="section-title text-xs font-bold text-[#1a237e] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Achievement Badges
              </div>
              <div>
                {badges.map(b => (
                  <span key={b.id} className="badge-item inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold px-3 py-1.5 rounded-lg mr-2 mb-2">
                    {b.definition?.icon ?? "🏅"} {b.definition?.name ?? b.id}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            This extracurricular record is verified by JCET Hub — Jain College of Engineering and Technology, Hubballi
          </div>
        </div>
      </div>
    </Layout>
  );
}
