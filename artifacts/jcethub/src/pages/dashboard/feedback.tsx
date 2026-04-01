import { Layout } from "@/components/layout";
import { useApiPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";

const CATEGORIES = [
  "Academic – Teaching Quality",
  "Academic – Syllabus & Curriculum",
  "Infrastructure – Classrooms",
  "Infrastructure – Labs & Equipment",
  "Library",
  "Transportation",
  "Canteen & Facilities",
  "Administration",
  "Events & Activities",
  "Other",
];

export default function Feedback() {
  const { toast } = useToast();
  const mutation = useApiPost<{ success: boolean; message: string }>("/feedback");

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message) {
      toast({ variant: "destructive", title: "Required fields missing", description: "Please select a category and write your feedback." });
      return;
    }
    mutation.mutate({ category, subject, message, rating } as any, {
      onSuccess: (data) => {
        toast({ title: "Feedback submitted!", description: data.message });
        setSubmitted(true);
      },
      onError: () => toast({ variant: "destructive", title: "Submission failed", description: "Please try again later." }),
    });
  };

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a237e]">Thank you!</h2>
          <p className="text-muted-foreground text-center max-w-sm">Your feedback has been submitted to the concerned department. We appreciate your input.</p>
          <Button onClick={() => { setSubmitted(false); setCategory(""); setSubject(""); setMessage(""); setRating(0); }} className="bg-[#1a237e] hover:bg-[#283593]">
            Submit another
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Feedback</h1>
          <p className="text-muted-foreground mt-1 text-sm">Share your suggestions, complaints or appreciation with JCET administration</p>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base text-[#1a237e] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#E8821A]" /> Submit Feedback
            </CardTitle>
            <CardDescription>Your feedback is anonymous and will be reviewed by the department.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-600">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 bg-gray-50">
                    <SelectValue placeholder="Select feedback category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-widest text-gray-600">Subject (optional)</Label>
                <Input id="subject" placeholder="Brief subject line" value={subject} onChange={e => setSubject(e.target.value)} className="h-11 bg-gray-50" />
              </div>

              {/* Star rating */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-600">Overall Rating</Label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star} type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                    >
                      <Star className={`h-7 w-7 transition-colors ${star <= (hovered || rating) ? "fill-[#E8821A] text-[#E8821A]" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-widest text-gray-600">Your Feedback *</Label>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Describe your experience, issue, or suggestion in detail…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="bg-gray-50 resize-none"
                />
                <p className="text-[10px] text-muted-foreground">{message.length}/500 characters</p>
              </div>

              <Button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-[#1a237e] hover:bg-[#283593] text-white font-bold">
                {mutation.isPending ? "Submitting…" : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
