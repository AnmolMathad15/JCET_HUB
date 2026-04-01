import { useState } from "react";
import { Layout } from "@/components/layout";
import { useApiGet, useApiPost } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Mail, Phone, MapPin, CalendarDays, CheckCircle2, Clock, AlertCircle, MessageSquare, Send, Shield, Plus, X } from "lucide-react";

interface MentoringData {
  mentor: { name: string; designation: string; email: string; phone: string; cabin: string };
  group: string;
  sessions: Array<{ id: string; date: string; time: string; venue: string; topic: string; status: string; notes: string }>;
  actionPoints: string[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  upcoming:  { label: "Upcoming",  color: "text-[#1a237e]",   bg: "bg-blue-50",    dot: "bg-[#1a237e]" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "text-red-700",     bg: "bg-red-50",     dot: "bg-red-500" },
};

const MOCK_MENTEES = [
  { usn: "2JH23CS001", name: "Arjun Kumar" },
  { usn: "2JH23CS002", name: "Priya Singh" },
  { usn: "2JH23CS003", name: "Rahul Mehta" },
  { usn: "2JH23CS004", name: "Ananya Rao" },
  { usn: "2JH23CS005", name: "Vikram Nair" },
];

export default function Mentoring() {
  const user = getUser();
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";
  const canMessage = isFaculty || isAdmin;

  const { data } = useApiGet<MentoringData>("/mentoring");
  const { data: messages } = useApiGet<any[]>("/mentoring/messages");
  const postMessage = useApiPost<any, any>("/mentoring/message");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ toUsn: "", toName: "", message: "" });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    postMessage.mutate({ ...form, sentBy: user?.name ?? user?.usn }, {
      onSuccess: () => {
        toast({ title: "Message sent to mentee!" });
        qc.invalidateQueries({ queryKey: ["/mentoring/messages"] });
        setForm({ toUsn: "", toName: "", message: "" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to send message" }),
    });
  };

  const fillMentee = (m: typeof MOCK_MENTEES[0]) => {
    setForm(f => ({ ...f, toUsn: m.usn, toName: m.name }));
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight flex items-center gap-2"><Users className="h-7 w-7" /> Mentoring</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">{canMessage ? "Manage mentee students and send messages." : "Track mentoring sessions and faculty guidance."}</p>
          </div>
          {canMessage && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 self-start">
              {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><MessageSquare className="h-4 w-4" /> Message Mentee</>}
            </Button>
          )}
        </div>

        {/* Faculty Message Form */}
        {canMessage && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Send className="h-4 w-4" /> Send Message to Mentee</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Quick Select Mentee</Label>
                <div className="flex flex-wrap gap-2">
                  {MOCK_MENTEES.map(m => (
                    <button key={m.usn} type="button" onClick={() => fillMentee(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${form.toUsn === m.usn ? "bg-[#1a237e] text-white border-[#1a237e]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a237e]"}`}>
                      {m.name} <span className="opacity-60 ml-1">{m.usn}</span>
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={handleSend} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student USN *</Label>
                  <Input value={form.toUsn} onChange={e => setForm(f => ({ ...f, toUsn: e.target.value }))} placeholder="e.g. 2JH23CS001" className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student Name</Label>
                  <Input value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))} placeholder="Student name (optional)" className="bg-gray-50" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Message *</Label>
                  <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Type your message to the student…" className="bg-gray-50 resize-none" rows={3} required />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={postMessage.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8 gap-2">
                    <Send className="h-4 w-4" />{postMessage.isPending ? "Sending…" : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sent Messages (faculty view) */}
        {canMessage && (messages?.length ?? 0) > 0 && (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-[#1a237e] flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Sent Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {messages!.slice(0, 6).map((m: any) => (
                  <div key={m.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#1a237e]">To: {m.toName ? `${m.toName} (${m.toUsn})` : m.toUsn}</p>
                        <p className="text-sm mt-1 text-foreground/80">{m.message}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground">{new Date(m.sentAt).toLocaleDateString("en-IN")}</p>
                        <Badge variant="outline" className="text-[9px] mt-1 border-emerald-200 bg-emerald-50 text-emerald-700">Sent</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student view: Mentor card + sessions */}
        {!canMessage && (
          <>
            <Card className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white border-0 shadow-lg overflow-hidden relative">
              <div className="absolute right-4 top-4 opacity-10"><Users className="w-28 h-28" /></div>
              <CardContent className="p-6 relative z-10 flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black flex-shrink-0">
                  {data?.mentor.name.split(" ").slice(1).map(n => n[0]).join("").substring(0,2).toUpperCase() ?? "—"}
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Your Faculty Mentor</p>
                  <h2 className="text-xl font-black mt-0.5">{data?.mentor.name ?? "Loading…"}</h2>
                  <p className="text-white/80 text-sm">{data?.mentor.designation ?? "—"}</p>
                  <p className="text-white/60 text-xs mt-1">{data?.group ?? "—"}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-white/80">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{data?.mentor.email ?? "—"}</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{data?.mentor.phone ?? "—"}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{data?.mentor.cabin ?? "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-sm text-[#1a237e] uppercase tracking-widest">Mentoring Sessions</h3>
                {(data?.sessions ?? [
                  { id:"1", date:"2024-11-15", time:"10:00 AM – 11:00 AM", venue:"Room 205", topic:"Career Guidance", status:"upcoming", notes:"Bring resume" },
                  { id:"2", date:"2024-10-18", time:"10:00 AM – 11:00 AM", venue:"Room 205", topic:"IA-3 Performance Review", status:"completed", notes:"Discussed marks" },
                  { id:"3", date:"2024-09-20", time:"10:30 AM – 11:30 AM", venue:"Room 205", topic:"Attendance Issues", status:"completed", notes:"Remedial action planned" },
                ]).map((s: any) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.completed;
                  return (
                    <Card key={s.id} className={`shadow-sm border-border/50 overflow-hidden ${s.status === "upcoming" ? "ring-2 ring-[#1a237e]/20" : ""}`}>
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-shrink-0 text-center">
                          <div className="bg-[#1a237e]/10 rounded-lg p-2 min-w-[3rem]">
                            <div className="text-[10px] font-bold text-[#1a237e] uppercase">{new Date(s.date).toLocaleDateString("en-US",{month:"short"})}</div>
                            <div className="text-xl font-black text-[#1a237e]">{new Date(s.date).getDate()}</div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm">{s.topic}</h4>
                            <Badge variant="outline" className={`text-[9px] border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 inline-block`} />{cfg.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.venue}</span>
                          </div>
                          {s.notes && <p className="mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">{s.notes}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#1a237e] uppercase tracking-widest">Action Points</h3>
                <Card className="shadow-sm border-border/50">
                  <CardContent className="p-4 space-y-3">
                    {(data?.actionPoints ?? [
                      "Improve attendance in Operating Systems (72%)",
                      "Complete pending mini-project by Nov 10",
                      "Register for Infosys placement drive",
                      "Clear library dues before semester end",
                    ]).map((pt: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <AlertCircle className="h-3.5 w-3.5 text-[#E8821A] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-foreground/80 leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Faculty mentees panel */}
        {canMessage && !showForm && (messages?.length ?? 0) === 0 && (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-[#1a237e] flex items-center gap-2"><Users className="h-4 w-4" /> My Mentees — Group C, CSE Section A</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {MOCK_MENTEES.map(m => (
                  <div key={m.usn} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a237e]/10 flex items-center justify-center text-xs font-bold text-[#1a237e]">{m.name.split(" ").map(n => n[0]).join("")}</div>
                      <div><p className="text-sm font-semibold">{m.name}</p><p className="text-[11px] text-muted-foreground font-mono">{m.usn}</p></div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setForm(f => ({ ...f, toUsn: m.usn, toName: m.name })); setShowForm(true); }} className="h-7 gap-1 text-[11px] border-[#1a237e]/30 text-[#1a237e] hover:bg-[#1a237e] hover:text-white">
                      <MessageSquare className="h-3 w-3" /> Message
                    </Button>
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
