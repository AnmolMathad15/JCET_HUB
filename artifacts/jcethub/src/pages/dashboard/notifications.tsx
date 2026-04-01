import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetNotifications } from "@workspace/api-client-react";
import { useApiPost } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Calendar as CalendarIcon, FileText, Plus, X, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

function getIcon(type: string) {
  switch (type) {
    case "alert": return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "exam":  return <FileText className="h-5 w-5 text-[#E8821A]" />;
    case "event": return <CalendarIcon className="h-5 w-5 text-emerald-600" />;
    default:      return <Bell className="h-5 w-5 text-[#1a237e]" />;
  }
}
function getBadgeClass(type: string) {
  switch (type) {
    case "alert": return "bg-red-50 text-red-700 border-red-200";
    case "exam":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "event": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:      return "bg-blue-50 text-[#1a237e] border-blue-200";
  }
}
const PLACEHOLDER = [
  { type: "alert", title: "Attendance Warning", msg: "Your attendance in one or more subjects is below 75%." },
  { type: "exam",  title: "Mid-term Schedule Released", msg: "IA-2 examinations are scheduled from next week." },
  { type: "event", title: "Cultural Fest Registration Open", msg: "Register before the deadline to participate." },
  { type: "info",  title: "Library Books Due", msg: "Return or renew your library books before end of semester." },
  { type: "alert", title: "Fee Payment Reminder", msg: "Last date for semester fee payment is approaching." },
];

export default function Notifications() {
  const user = getUser();
  const canPost = user?.role === "faculty" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const { data: notifications } = useGetNotifications({ query: { queryKey: ["/api/notifications"] } });
  const postNotification = useApiPost<any, any>("/notifications");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });

  const hasData = !!notifications?.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postNotification.mutate(form, {
      onSuccess: () => {
        toast({ title: "Notification posted successfully!" });
        qc.invalidateQueries({ queryKey: ["/api/notifications"] });
        setForm({ title: "", message: "", type: "info" });
        setShowForm(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to post notification" }),
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-4">
          <div>
            {isAdmin && <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit"><Shield className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Admin Control</span></div>}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Campus announcements and alerts.</p>
          </div>
          <div className="flex items-center gap-3">
            {canPost && (
              <Button onClick={() => setShowForm(!showForm)} className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2">
                {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Send className="h-4 w-4" /> Post Notice</>}
              </Button>
            )}
            <button className="text-xs font-semibold text-[#1a237e] hover:text-[#E8821A] transition-colors flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
        </div>

        {/* Faculty Post Form */}
        {canPost && showForm && (
          <Card className="border-[#1a237e]/30 shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#1a237e] to-[#E8821A]" />
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#1a237e] flex items-center gap-2"><Plus className="h-4 w-4" /> Post New Notification</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title…" className="bg-gray-50" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</Label>
                    <select className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="info">Info</option>
                      <option value="alert">Alert / Urgent</option>
                      <option value="exam">Exam</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Message *</Label>
                  <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Write the notification message here…" className="bg-gray-50 resize-none" rows={3} required />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={postNotification.isPending} className="bg-[#1a237e] hover:bg-[#283593] text-white px-8 gap-2">
                    <Send className="h-4 w-4" />{postNotification.isPending ? "Posting…" : "Post Notification"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notifications list */}
        <div className="space-y-3 pt-1">
          {hasData
            ? notifications!.map(n => (
                <Card key={n.id} className={`overflow-hidden border-border/50 transition-all hover:shadow-md ${!n.isRead ? "bg-[#1a237e]/[0.02] border-l-4 border-l-[#1a237e]" : "bg-card"}`}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm leading-snug">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className={`text-[10px] capitalize font-semibold ${getBadgeClass(n.type)}`}>{n.type}</Badge>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#1a237e] flex-shrink-0" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">{formatDistanceToNow(new Date(n.createdAt ?? Date.now()), { addSuffix: true })}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            : PLACEHOLDER.map((n, i) => (
                <Card key={i} className={`overflow-hidden border-border/50 transition-all opacity-50 ${i < 2 ? "border-l-4 border-l-[#1a237e]" : ""}`}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-semibold text-sm">{n.title}</p><p className="text-xs text-muted-foreground mt-1">{n.msg}</p></div>
                        <Badge variant="outline" className={`text-[10px] capitalize font-semibold ${getBadgeClass(n.type)}`}>{n.type}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">Loading…</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </Layout>
  );
}
