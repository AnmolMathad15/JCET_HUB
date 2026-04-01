import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetUpcomingEvents } from "@workspace/api-client-react";
import { useApiPost } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Plus, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PLACEHOLDER_EVENTS = [
  { title: "Hackathon 2024", type: "technical", description: "Annual 24-hour coding challenge for all students.", date: "2024-11-20T09:00:00", venue: "CS Block Lab" },
  { title: "Cultural Fest", type: "cultural", description: "Celebrate diversity with music, dance and art.", date: "2024-12-05T10:00:00", venue: "Open Amphitheater" },
  { title: "Technical Symposium", type: "academic", description: "Paper presentation and project expo event.", date: "2024-12-12T09:00:00", venue: "Seminar Hall A" },
  { title: "Sports Meet", type: "sports", description: "Inter-department sports championship.", date: "2024-12-18T08:00:00", venue: "Sports Ground" },
];

function typeBadgeClass(type: string) {
  switch (type) {
    case "technical": return "bg-blue-50 text-[#1a237e] border-blue-200";
    case "cultural":  return "bg-purple-50 text-purple-700 border-purple-200";
    case "academic":  return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "sports":    return "bg-orange-50 text-[#E8821A] border-orange-200";
    case "exam":      return "bg-red-50 text-red-700 border-red-200";
    default:          return "bg-muted text-muted-foreground";
  }
}

export default function Events() {
  const user = getUser();
  const canCreate = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const { data: events } = useGetUpcomingEvents({ query: { queryKey: ["/api/dashboard/events"] } });
  const postEvent = useApiPost<any, any>("/dashboard/events");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "technical", venue: "" });

  const hasData = !!events?.length;
  const displayEvents = hasData ? events! : PLACEHOLDER_EVENTS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postEvent.mutate(form, {
      onSuccess: () => {
        toast({ title: "Event created successfully!" });
        qc.invalidateQueries({ queryKey: ["/api/dashboard/events"] });
        setForm({ title: "", description: "", date: "", type: "technical", venue: "" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to create event" }),
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-5">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Campus Events</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Academic, cultural, and sports events calendar.</p>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2">
                {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Create Event</>}
              </Button>
            )}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <span className="bg-white text-[#1a237e] border-transparent shadow-sm px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer">Upcoming</span>
              <span className="px-4 py-1.5 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Past Events</span>
            </div>
          </div>
        </div>

        {/* Faculty Create Event Form */}
        {canCreate && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Create Campus Event</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Event Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Hackathon 2025" className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-gray-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</Label>
                  <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="exam">Exam</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Venue</Label>
                  <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Seminar Hall A" className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the event…" className="bg-gray-50 resize-none" rows={2} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={postEvent.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8">{postEvent.isPending ? "Creating…" : "Create Event"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Event cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 ${!hasData ? "opacity-55" : ""}`}>
          {displayEvents.map((event, idx) => {
            const d = new Date(event.date);
            return (
              <Card key={idx} className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-200 flex flex-col">
                <CardHeader className="p-0 border-b border-border/50 bg-muted/30">
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="bg-[#1a237e] text-white text-center rounded-xl p-2.5 min-w-[4rem] shadow-sm flex-shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.toLocaleDateString("en-US", { month: "short" })}</div>
                      <div className="text-2xl font-heading font-bold leading-none mt-0.5">{d.getDate()}</div>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base font-heading leading-snug line-clamp-1">{event.title}</CardTitle>
                      <Badge variant="outline" className={`capitalize text-[10px] font-semibold px-2 py-0.5 border ${typeBadgeClass(event.type)}`}>{event.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col">
                  {event.description && (
                    <CardDescription className="text-xs text-foreground/70 mb-4 leading-relaxed line-clamp-2">{event.description}</CardDescription>
                  )}
                  <div className="mt-auto pt-3 border-t border-border/40 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#1a237e]/60 flex-shrink-0" /><span>{d.toLocaleDateString("en-IN")}</span></div>
                    {event.venue && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#1a237e]/60 flex-shrink-0" /><span className="truncate">{event.venue}</span></div>}
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
