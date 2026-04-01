import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetMyMarks } from "@workspace/api-client-react";
import { useApiPost, useApiGet } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, Target, TrendingUp, Upload, Plus, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PLACEHOLDER_SUBJECTS = [
  { subject: "Design Thinking and Innovation", code: "22CS61" },
  { subject: "Machine Learning",               code: "22CS62" },
  { subject: "Computer Networks",              code: "22CS63" },
  { subject: "Cloud Computing",                code: "22CS641" },
  { subject: "Artificial Intelligence",        code: "22CS651" },
  { subject: "Machine Learning Lab",           code: "22CSL66" },
];
const SUBJECTS = [
  "Design Thinking and Innovation",
  "Machine Learning",
  "Computer Networks",
  "Cloud Computing",
  "Artificial Intelligence",
  "Machine Learning Lab",
  "Data Structures and Applications",
  "Operating Systems",
  "Database Management Systems",
  "Software Engineering",
  "Computer Organization",
  "Web Technologies and its Applications",
];

function gradeColor(g: string) {
  if (g === "O") return "bg-emerald-100 text-emerald-800";
  if (g === "A+" || g === "A") return "bg-blue-100 text-blue-800";
  if (g === "B+" || g === "B") return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-700";
}

export default function Marks() {
  const user = getUser();
  const canUpload = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const { data: marks } = useGetMyMarks({ query: { queryKey: ["/api/marks/me"] } });
  const { data: uploads } = useApiGet<any[]>("/marks/uploads");
  const postMarks = useApiPost<any, any>("/marks/upload");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentUsn: "", subject: "", subjectCode: "", ia1: "", ia2: "" });

  const hasData = !!marks?.length;
  const internalAvg = hasData ? (marks!.reduce((s, m) => s + (m.ia1 ?? 0) + (m.ia2 ?? 0), 0) / (marks!.length * 2)).toFixed(1) : "—";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postMarks.mutate({ ...form, uploadedBy: user?.name ?? user?.usn }, {
      onSuccess: () => {
        toast({ title: "Marks uploaded successfully!" });
        qc.invalidateQueries({ queryKey: ["/marks/uploads"] });
        setForm({ studentUsn: "", subject: "", subjectCode: "", ia1: "", ia2: "" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to upload marks" }),
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">{canUpload ? "Marks Management" : "Marks & Results"}</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">{canUpload ? "Upload and manage internal assessment marks for students." : "Internal assessments and final grade tracking."}</p>
          </div>
          {canUpload
            ? (
              <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 self-start">
                {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Upload className="h-4 w-4" /> Upload Marks</>}
              </Button>
            )
            : <Badge className="bg-[#E8821A] text-white hover:bg-[#c0611a] px-3 py-1 rounded-full text-sm self-start md:self-auto">Current Semester</Badge>}
        </div>

        {/* Faculty Upload Form */}
        {canUpload && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Upload Internal Assessment Marks</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student USN *</Label>
                  <Input value={form.studentUsn} onChange={e => setForm(f => ({ ...f, studentUsn: e.target.value }))} placeholder="e.g. 2JH23CS001" className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject Code</Label>
                  <Input value={form.subjectCode} onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))} placeholder="e.g. 18CS52" className="bg-gray-50" />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject *</Label>
                  <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">IA-1 (out of 25) *</Label>
                  <Input type="number" min={0} max={25} value={form.ia1} onChange={e => setForm(f => ({ ...f, ia1: e.target.value }))} placeholder="20" className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">IA-2 (out of 25)</Label>
                  <Input type="number" min={0} max={25} value={form.ia2} onChange={e => setForm(f => ({ ...f, ia2: e.target.value }))} placeholder="22" className="bg-gray-50" />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" disabled={postMarks.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8">{postMarks.isPending ? "Uploading…" : "Upload Marks"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent marks uploads for faculty */}
        {canUpload && (uploads?.length ?? 0) > 0 && (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/50"><CardTitle className="text-sm font-semibold text-[#1a237e]">Recent Marks Uploads</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="text-xs">USN</TableHead><TableHead className="text-xs">Subject</TableHead><TableHead className="text-xs text-center">IA-1 /25</TableHead><TableHead className="text-xs text-center">IA-2 /25</TableHead><TableHead className="text-xs">By</TableHead></TableRow></TableHeader>
                <TableBody>
                  {uploads!.slice(0,8).map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-[#1a237e] text-xs">{u.studentUsn}</TableCell>
                      <TableCell className="text-xs">{u.subject}</TableCell>
                      <TableCell className="text-center text-xs font-bold">{u.ia1}</TableCell>
                      <TableCell className="text-center text-xs font-bold">{u.ia2}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.uploadedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {canUpload && !showForm && (uploads?.length ?? 0) === 0 && (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            <Upload className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No marks uploaded yet</p>
            <p className="text-sm mt-1">Use the button above to upload student marks.</p>
          </div>
        )}

        {/* Student view */}
        {!canUpload && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Internal Avg", value: hasData ? `${internalAvg}/25` : "—", icon: Target, color: "text-[#1a237e]", bg: "bg-blue-50", bar: "bg-[#1a237e]" },
                { label: "Predicted Grade", value: hasData ? "A+" : "—", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" },
                { label: "Class Rank", value: hasData ? "Top 10%" : "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-500" },
              ].map(({ label, value, icon: Icon, color, bg, bar }) => (
                <Card key={label} className="border-border/50 shadow-sm overflow-hidden">
                  <div className={`h-1 ${bar}`} />
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                    <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p><h3 className={`text-2xl font-bold font-heading ${color}`}>{value}</h3></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <CardTitle className="font-heading text-xl text-[#1a237e]">Internal Assessment Details</CardTitle>
                <CardDescription className="text-xs">IA-1 and IA-2 — each out of 25 marks. Average of both IAs considered for final marks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="bg-muted/20"><TableHead className="text-xs font-bold uppercase pl-5">Subject</TableHead><TableHead className="text-xs font-bold uppercase text-center">IA-1 /25</TableHead><TableHead className="text-xs font-bold uppercase text-center">IA-2 /25</TableHead><TableHead className="text-xs font-bold uppercase text-center">Average</TableHead><TableHead className="text-xs font-bold uppercase text-center">Grade</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {hasData
                      ? marks!.map(m => {
                          const avg = (((m.ia1 ?? 0) + (m.ia2 ?? 0)) / 2).toFixed(1);
                          return (
                            <TableRow key={m.subjectCode} className="hover:bg-muted/30">
                              <TableCell className="pl-5"><p className="font-semibold text-sm">{m.subject}</p><p className="text-[10px] text-muted-foreground font-mono">{m.subjectCode}</p></TableCell>
                              <TableCell className="text-center font-bold">{m.ia1 ?? "—"}</TableCell>
                              <TableCell className="text-center font-bold">{m.ia2 ?? "—"}</TableCell>
                              <TableCell className="text-center font-bold text-[#1a237e]">{avg}</TableCell>
                              <TableCell className="text-center"><Badge className={`text-xs font-bold ${gradeColor(m.grade ?? "A")}`}>{m.grade ?? "A"}</Badge></TableCell>
                            </TableRow>
                          );
                        })
                      : PLACEHOLDER_SUBJECTS.map(p => (
                          <TableRow key={p.code} className="opacity-40">
                            <TableCell className="pl-5"><p className="font-semibold text-sm text-muted-foreground">{p.subject}</p><p className="text-[10px] font-mono text-muted-foreground">{p.code}</p></TableCell>
                            {[0,1,2].map(i => <TableCell key={i} className="text-center text-muted-foreground">—</TableCell>)}
                            <TableCell className="text-center"><Badge className="text-xs bg-gray-100 text-gray-400">—</Badge></TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
