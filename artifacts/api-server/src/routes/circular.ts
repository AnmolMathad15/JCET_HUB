import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Circular { id: string; title: string; date: string; category: string; issuedBy: string; content: string; important?: boolean; }

const circularStore: Circular[] = [
  { id: "1", title: "End Semester Examination Time Table – Nov/Dec 2024", date: "2024-11-01", category: "academic", issuedBy: "Examination Section", content: "The time table for End Semester Examinations for all semesters has been released. Students are advised to check the schedule and report to examination halls 15 minutes before commencement.", important: true },
  { id: "2", title: "Placement Drive – Infosys Technologies Ltd",         date: "2024-10-28", category: "placement", issuedBy: "Placement Cell",     content: "Infosys Technologies Ltd. will be conducting a campus placement drive on 20th November 2024. Eligible students (≥60% aggregate, no active backlogs) may register through the placement portal by 10th November.", important: true },
  { id: "3", title: "Annual Sports Meet – Registration Open",             date: "2024-10-20", category: "sports",   issuedBy: "Sports Department",  content: "The Annual Inter-Department Sports Meet 2024 is scheduled for 5th & 6th October. Students interested in participating in athletics, cricket, basketball, volleyball, or table tennis may register with their respective class teachers." },
  { id: "4", title: "Anti-Ragging Committee – Zero Tolerance Policy",     date: "2024-10-15", category: "general",  issuedBy: "Dean of Students",   content: "All students are reminded that ragging in any form is strictly prohibited and punishable under law. Complaints may be registered at the Anti-Ragging helpline or through the student grievance portal." },
  { id: "5", title: "Workshop on Machine Learning – Registration",        date: "2024-10-10", category: "academic", issuedBy: "CS Department",      content: "A two-day hands-on workshop on Machine Learning using Python will be conducted on 28–29 October 2024. Limited seats available. Register at the department notice board." },
  { id: "6", title: "Scholarship Application – State Merit Scholarship",  date: "2024-10-05", category: "finance",  issuedBy: "Accounts Section",   content: "Students eligible for State Merit Scholarship for the academic year 2024-25 must submit their applications with supporting documents to the accounts section before 31st October 2024." },
  { id: "7", title: "Library Timings Extended – Exam Season",             date: "2024-09-30", category: "general",  issuedBy: "Library",            content: "The central library will remain open from 8:00 AM to 9:00 PM on all working days during the examination season (Nov 1 – Dec 15, 2024)." },
  { id: "8", title: "IA-3 Schedule and Guidelines",                       date: "2024-10-12", category: "exam",     issuedBy: "Academic Section",   content: "Internal Assessment 3 will be conducted from 18th to 23rd October 2024. Students must carry their college ID card to the examination hall. Mobile phones are strictly prohibited.", important: true },
];

router.get("/circular", (_req, res) => {
  res.json([...circularStore].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

router.post("/circular", (req, res) => {
  const { title, content, category, issuedBy, important } = req.body ?? {};
  if (!title || !content || !issuedBy) {
    return res.status(400).json({ error: "validation_error", message: "title, content, and issuedBy are required" });
  }
  const c: Circular = {
    id: `c${Date.now()}`,
    title,
    content,
    category: category ?? "general",
    issuedBy,
    date: new Date().toISOString().split("T")[0],
    important: !!important,
  };
  circularStore.unshift(c);
  res.status(201).json(c);
});

router.delete("/circular/:id", (req, res) => {
  const idx = circularStore.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  circularStore.splice(idx, 1);
  res.json({ success: true });
});

export default router;
