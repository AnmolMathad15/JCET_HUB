import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetMyAttendance } from "@workspace/api-client-react";
import { useApiPost, useApiGet } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, AlertTriangle, BookOpen, Upload, Plus, X, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function statusColor(status: string) {
  switch (status) {
    case "safe":    return "bg-emerald-500";
    case "warning": return "bg-amber-500";
    case "low":     return "bg-red-500";
    default:        return "bg-[#1a237e]";
  }
}
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "safe":    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case "low":     return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:        return null;
  }
}
const PLACEHOLDER_SUBJECTS = ["Engineering Mathematics","Data Structures & Algorithms","Computer Organization","Operating Systems","Database Management"];
const SUBJECTS = ["Data Structures & Algorithms","Operating Systems","Database Management Systems","Computer Networks","Engineering Mathematics","Computer Organization","OOP with Java","Microprocessors","Software Engineering"];

export default function Attendance() {
  const user = getUser();
  const canUpload = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const { data: attendance } = useGetMyAttendance({ query: { queryKey: ["/api/attendance/me"] } });
  const { data: uploads } = useApiGet<any[]>("/attendance/uploads");
  const postAttendance = useApiPost<any, any>("/attendance/upload");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentUsn: "", subject: "", subjectCode: "", attended: "", total: "" });

  const overall = attendance?.length ? attendance.reduce((a, r) => a + r.percentage, 0) / attendance.length : 0;
  const hasData = !!attendance?.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postAttendance.mutate({ ...form, updatedBy: user?.name ?? user?.usn }, {
      onSuccess: () => {
        toast({ title: "Attendance updated successfully!" });
        qc.invalidateQueries({ queryKey: ["/attendance/uploads"] });
        setForm({ studentUsn: "", subject: "", subjectCode: "", attended: "", total: "" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update attendance" }),
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">{canUpload ? "Attendance Management" : "Attendance Tracking"}</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">{canUpload ? "Update and monitor student attendance records by subject." : "Monitor your real-time subject-wise attendance to stay eligible for exams."}</p>
          </div>
          {canUpload && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 self-start">
              {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Upload className="h-4 w-4" /> Update Attendance</>}
            </Button>
          )}
        </div>

        {/* Faculty Upload Form */}
        {canUpload && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Update Student Attendance</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student USN *</Label>
                  <Input value={form.studentUsn} onChange={e => setForm(f => ({ ...f, studentUsn: e.target.value }))} placeholder="e.g. 2JH23CS001" className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject *</Label>
                  <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject Code</Label>
                  <Input value={form.subjectCode} onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))} placeholder="e.g. 18CS52" className="bg-gray-50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attended *</Label>
                    <Input type="number" min={0} value={form.attended} onChange={e => setForm(f => ({ ...f, attended: e.target.value }))} placeholder="42" className="bg-gray-50" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total *</Label>
                    <Input type="number" min={0} value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} placeholder="50" className="bg-gray-50" required />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={postAttendance.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8">{postAttendance.isPending ? "Saving…" : "Save Attendance"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent uploads */}
        {canUpload && (uploads?.length ?? 0) > 0 && (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/50"><CardTitle className="text-sm font-semibold text-[#1a237e]">Recent Attendance Updates</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {uploads!.slice(0, 8).map((u: any) => {
                  const pct = Math.round((u.attended / u.total) * 100);
                  return (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div><span className="font-semibold text-[#1a237e]">{u.studentUsn}</span><span className="mx-2 text-muted-foreground">·</span><span className="text-muted-foreground">{u.subject}</span></div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{u.attended}/{u.total}</span>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${pct >= 75 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{pct}%</Badge>
                        <span className="text-[11px] text-muted-foreground hidden md:block">{u.updatedBy}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Faculty empty state */}
        {canUpload && !showForm && (uploads?.length ?? 0) === 0 && (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            <Upload className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No attendance records updated yet</p>
            <p className="text-sm mt-1">Use the button above to update student attendance.</p>
          </div>
        )}

        {/* Student view */}
        {!canUpload && (
          <>
            <Card className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white border-0 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4"><BookOpen className="w-56 h-56" /></div>
              <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-white/70 font-medium uppercase tracking-wider text-xs">Overall Attendance</p>
                  <div className="text-5xl font-heading font-bold">{hasData ? `${overall.toFixed(1)}%` : "—"}</div>
                  <p className="text-sm pt-2 text-white/80">{!hasData ? "Loading your attendance data…" : overall >= 75 ? "You are maintaining a healthy attendance." : "Warning: Your attendance is below the 75% threshold."}</p>
                </div>
                <div className="w-44 h-44 rounded-full border-8 border-white/20 flex items-center justify-center relative flex-shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="88" cy="88" r="80" fill="none" stroke="#E8821A" strokeWidth="14" strokeDasharray={`${overall * 5.03} 600`} strokeLinecap="round" /></svg>
                  <span className="text-3xl font-bold">{hasData ? `${overall.toFixed(0)}%` : "—"}</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <h3 className="text-base font-heading font-semibold text-[#1a237e]">Subject-wise Breakdown</h3>
              {hasData
                ? attendance!.map(r => (
                    <Card key={r.subjectCode} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-0">
                        <div className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{r.subject}</h4>
                              <Badge variant="outline" className="text-[10px] uppercase bg-muted text-muted-foreground">{r.subjectCode}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Attended: <strong className="text-foreground">{r.attended}</strong> / {r.total}</p>
                          </div>
                          <div className="flex-1 w-full md:max-w-xs space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-medium">
                              <span className="flex items-center gap-1"><StatusIcon status={r.status} />{r.percentage}%</span>
                              <span className="uppercase tracking-wider text-muted-foreground">{r.status}</span>
                            </div>
                            <Progress value={r.percentage} className={`h-2.5 bg-muted [&>div]:${statusColor(r.status)}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : PLACEHOLDER_SUBJECTS.map(name => (
                    <Card key={name} className="overflow-hidden border-border/50 shadow-sm opacity-50">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="space-y-1 flex-1"><h4 className="font-semibold text-sm text-muted-foreground">{name}</h4><p className="text-xs text-muted-foreground">Attended: — / —</p></div>
                        <div className="flex-1 w-full md:max-w-xs space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><span>—%</span><span>—</span></div><Progress value={0} className="h-2.5 bg-muted" /></div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
