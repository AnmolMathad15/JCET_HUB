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
import {
  BookMarked, Plus, X, Search, Download, Trash2,
  FileText, Tag, User, Calendar, Shield,
} from "lucide-react";

interface Note { id: string; subject: string; title: string; description: string; fileUrl?: string; uploadedBy: string; uploadedAt: string; semester: string; tags?: string; }

const SUBJECTS = ["Data Structures & Algorithms", "Operating Systems", "Database Management Systems", "Computer Networks", "Engineering Mathematics", "Computer Organization", "OOP with Java", "Microprocessors", "Other"];

export default function Notes() {
  const user = getUser();
  const canUpload = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const { data: notes, isLoading } = useApiGet<Note[]>("/notes");
  const postNote = useApiPost<Note, any>("/notes");
  const deleteNote = useApiPost<any, any>("/notes/delete");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");
  const [form, setForm] = useState({ subject: "", title: "", description: "", fileUrl: "", semester: "5th", tags: "" });

  const filtered = (notes ?? []).filter(n => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q);
    const matchSubject = filterSubject === "All" || n.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.title) return;
    postNote.mutate({ ...form, uploadedBy: user?.name ?? user?.usn ?? "Faculty" }, {
      onSuccess: () => {
        toast({ title: "Notes uploaded successfully!" });
        qc.invalidateQueries({ queryKey: ["/notes"] });
        setForm({ subject: "", title: "", description: "", fileUrl: "", semester: "5th", tags: "" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Upload failed", description: "Please try again." }),
    });
  };

  const handleDelete = (id: string) => {
    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/notes/${id}`, { method: "DELETE" }).then(() => {
      toast({ title: "Note deleted" });
      qc.invalidateQueries({ queryKey: ["/notes"] });
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && (
              <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight flex items-center gap-2">
              <BookMarked className="h-7 w-7" /> App Notes
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Subject-wise study notes and materials shared by faculty.</p>
          </div>
          {canUpload && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 self-start md:self-auto">
              {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Upload Notes</>}
            </Button>
          )}
        </div>

        {/* Upload Form */}
        {canUpload && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Upload New Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject *</Label>
                  <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Semester</Label>
                  <Input value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} placeholder="e.g. 5th" className="bg-gray-50" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Module 3 – Graph Algorithms Notes" className="bg-gray-50" required />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what these notes cover…" className="bg-gray-50 resize-none" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">File / Drive Link</Label>
                  <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://drive.google.com/..." className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. graphs, BFS, algorithms" className="bg-gray-50" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={postNote.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8">
                    {postNote.isPending ? "Uploading…" : "Upload Notes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-gray-50" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", ...SUBJECTS.slice(0, 5)].map(s => (
              <button key={s} onClick={() => setFilterSubject(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterSubject === s ? "bg-[#1a237e] text-white border-[#1a237e]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a237e]"}`}>
                {s === "Data Structures & Algorithms" ? "DSA" : s === "Database Management Systems" ? "DBMS" : s === "Operating Systems" ? "OS" : s === "Computer Networks" ? "CN" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Notes count */}
        <p className="text-sm text-muted-foreground font-medium">{filtered.length} note{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Notes list */}
        <div className="space-y-3">
          {isLoading
            ? Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse border-border/50"><CardContent className="p-5 h-24 bg-muted/30" /></Card>
              ))
            : filtered.length === 0
            ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookMarked className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No notes found</p>
                <p className="text-sm mt-1">{canUpload ? "Upload the first note using the button above." : "Check back later."}</p>
              </div>
            )
            : filtered.map(note => (
              <Card key={note.id} className="border-border/50 hover:shadow-md transition-all overflow-hidden">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1a237e]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-[#1a237e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm leading-snug">{note.title}</h3>
                        <Badge variant="outline" className="text-[10px] mt-1 border-blue-200 bg-blue-50 text-[#1a237e]">{note.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {note.fileUrl && (
                          <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px] border-[#1a237e]/40 text-[#1a237e] hover:bg-[#1a237e] hover:text-white">
                              <Download className="h-3 w-3" /> Download
                            </Button>
                          </a>
                        )}
                        {(isAdmin || (canUpload && note.uploadedBy === (user?.name ?? user?.usn))) && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(note.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {note.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{note.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{note.uploadedBy}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(note.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="flex items-center gap-1"><BookMarked className="h-3 w-3" />{note.semester} Semester</span>
                      {note.tags && note.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="flex items-center gap-0.5"><Tag className="h-2.5 w-2.5" />{t}</span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </Layout>
  );
}
