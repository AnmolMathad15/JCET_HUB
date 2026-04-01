import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface MentoringMessage { id: string; toUsn: string; toName?: string; message: string; sentBy: string; sentAt: string; read: boolean; }
const mentoringMessages: MentoringMessage[] = [];

router.get("/mentoring/messages", (_req, res) => {
  res.json(mentoringMessages);
});

router.post("/mentoring/message", (req, res) => {
  const { toUsn, toName, message, sentBy } = req.body ?? {};
  if (!toUsn || !message || !sentBy) {
    return res.status(400).json({ error: "validation_error", message: "toUsn, message, sentBy required" });
  }
  const msg: MentoringMessage = {
    id: `msg${Date.now()}`,
    toUsn: String(toUsn).toUpperCase(),
    toName: toName ?? "",
    message,
    sentBy,
    sentAt: new Date().toISOString(),
    read: false,
  };
  mentoringMessages.unshift(msg);
  res.status(201).json({ success: true, message: msg });
});

router.get("/mentoring", (_req, res) => {
  res.json({
    mentor: { name: "Dr. Priya Sharma", designation: "Associate Professor, CS Dept.", email: "priya.sharma@jcet.edu", phone: "9876500001", cabin: "Room 305, CS Block" },
    group: "Group C – 5th Sem CSE (Section A)",
    sessions: [
      { id: "1", date: "2024-11-15", time: "10:00 AM – 11:00 AM", venue: "Room 205", topic: "Career Guidance & Higher Studies",    status: "upcoming",  notes: "Bring your resume and academic records" },
      { id: "2", date: "2024-10-18", time: "10:00 AM – 11:00 AM", venue: "Room 205", topic: "IA-3 Performance Review",             status: "completed", notes: "Students discussed IA-3 marks and areas of improvement" },
      { id: "3", date: "2024-09-20", time: "10:30 AM – 11:30 AM", venue: "Room 205", topic: "Attendance & Academic Issues",        status: "completed", notes: "Attendance shortfall cases discussed and remedial action planned" },
      { id: "4", date: "2024-08-23", time: "10:00 AM – 11:00 AM", venue: "Room 301", topic: "Semester Orientation & Goal Setting", status: "completed", notes: "Semester plan and individual goals set" },
    ],
    actionPoints: [
      "Improve attendance in Operating Systems (currently 72%)",
      "Complete pending mini-project submission by Nov 10",
      "Register for Infosys placement drive before Nov 10",
      "Clear library dues before end of semester",
    ],
  });
});

export default router;
