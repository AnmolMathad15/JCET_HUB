import { useState } from "react";
import { Layout } from "@/components/layout";
import { useApiGet, useApiPost } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, Briefcase, Dumbbell, Info, BookOpen, BadgeDollarSign, Plus, X, Send, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Circular { id: string; title: string; date: string; category: string; issuedBy: string; content: string; important?: boolean; }

const CAT_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  academic:  { label: "Academic",  color: "text-[#1a237e]",   bg: "bg-blue-50 border-blue-200",     Icon: BookOpen },
  placement: { label: "Placement", color: "text-[#E8821A]",   bg: "bg-amber-50 border-amber-200",   Icon: Briefcase },
  sports:    { label: "Sports",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",Icon: Dumbbell },
  general:   { label: "General",   color: "text-gray-600",    bg: "bg-gray-50 border-gray-200",     Icon: Info },
  finance:   { label: "Finance",   color: "text-purple-700",  bg: "bg-purple-50 border-purple-200", Icon: BadgeDollarSign },
  exam:      { label: "Exam",      color: "text-red-700",     bg: "bg-red-50 border-red-200",       Icon: FileText },
};

const CATS = Object.keys(CAT_CONFIG);

export default function Circular() {
  const user = getUser();
  const canPost = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const { data: circulars, isLoading } = useApiGet<Circular[]>("/circular");
  const postCircular = useApiPost<Circular, any>("/circular");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "academic", issuedBy: "", important: false });

  const filtered = (circulars ?? []).filter(c => activeFilter === "all" || c.category === activeFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postCircular.mutate({ ...form, issuedBy: form.issuedBy || (user?.name ?? user?.usn ?? "Faculty") }, {
      onSuccess: () => {
        toast({ title: "Circular posted successfully!" });
        qc.invalidateQueries({ queryKey: ["/circular"] });
        setForm({ title: "", content: "", category: "academic", issuedBy: "", important: false });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to post circular" }),
    });
  };

  const handleDelete = (id: string) => {
    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/circular/${id}`, { method: "DELETE" }).then(() => {
      toast({ title: "Circular deleted" });
      qc.invalidateQueries({ queryKey: ["/circular"] });
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight flex items-center gap-2"><FileText className="h-7 w-7" /> Circulars & Notices</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Official communications from the college administration.</p>
          </div>
          {canPost && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 self-start">
              {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Send className="h-4 w-4" /> Post Circular</>}
            </Button>
          )}
        </div>

        {/* Faculty Post Form */}
        {canPost && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Post New Circular</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Circular title…" className="bg-gray-50" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Category</Label>
                    <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATS.map(c => <option key={c} value={c}>{CAT_CONFIG[c].label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Issued By</Label>
                    <Input value={form.issuedBy} onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))} placeholder={user?.name ?? "Department Name"} className="bg-gray-50" />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Content *</Label>
                    <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write the circular content here…" className="bg-gray-50 resize-none" rows={4} required />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="important" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} className="w-4 h-4 accent-[#E8821A]" />
                    <Label htmlFor="important" className="text-sm font-medium cursor-pointer">Mark as Important / Urgent</Label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={postCircular.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8 gap-2">
                    <Send className="h-4 w-4" />{postCircular.isPending ? "Posting…" : "Post Circular"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Category filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {["all", ...CATS].map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${activeFilter === cat ? "bg-[#1a237e] text-white border-[#1a237e]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a237e]"}`}>
              {cat === "all" ? "All" : CAT_CONFIG[cat]?.label ?? cat}
            </button>
          ))}
        </div>

        {/* Circulars list */}
        <div className="space-y-3">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <Card key={i} className="animate-pulse border-border/50"><CardContent className="p-5 h-20 bg-muted/30" /></Card>)
            : filtered.map(c => {
                const cfg = CAT_CONFIG[c.category] ?? CAT_CONFIG.general;
                const isExpanded = expanded === c.id;
                return (
                  <Card key={c.id} className={`overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer ${c.important ? "ring-1 ring-red-200" : ""}`} onClick={() => setExpanded(isExpanded ? null : c.id)}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}><cfg.Icon className={`h-4 w-4 ${cfg.color}`} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm leading-snug">{c.title}</p>
                                {c.important && <Badge className="bg-red-100 text-red-700 text-[9px] font-bold border-0 px-1.5">URGENT</Badge>}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{c.issuedBy} · {formatDistanceToNow(new Date(c.date), { addSuffix: true })}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge variant="outline" className={`text-[10px] capitalize font-semibold border ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                              {isAdmin && <Button size="sm" variant="ghost" onClick={ev => { ev.stopPropagation(); handleDelete(c.id); }} className="h-6 w-6 p-0 text-red-400 hover:bg-red-50"><Trash2 className="h-3 w-3" /></Button>}
                              <AlertCircle className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                          {isExpanded && <p className="mt-3 text-sm text-foreground/80 leading-relaxed border-t border-border/40 pt-3">{c.content}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>
    </Layout>
  );
}
