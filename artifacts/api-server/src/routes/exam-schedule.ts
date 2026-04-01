import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/exam-schedule", (_req, res) => {
  res.json({
    notification: {
      ref: "VTU/BGM/BoS/R; IV & VI sem UG/2025-26/6556",
      date: "20 Mar 2026",
      subject: "Revised Academic Calendar for II, IV & VI Semesters of all UG programmes",
      issuedBy: "Prof. Prasad B. Rampure M.E., Ph.D. – Registrar, VTU",
      note: "The Academic Calendar has been revised by interchanging the date duration allotted for Practical and Theory Examinations.",
    },
    semesters: [
      {
        sem: "II Semester",
        program: "B.E. / B.Tech",
        colorClass: "blue",
        commencement: "24 Feb 2026",
        lastWorkingDay: "15 Jun 2026",
        theory: { start: "16 Jun 2026", end: "08 Jul 2026" },
        practical: { start: "09 Jul 2026", end: "21 Jul 2026" },
        nextSemester: "22 Jul 2026",
      },
      {
        sem: "IV Semester",
        program: "B.E. / B.Tech",
        colorClass: "indigo",
        commencement: "23 Feb 2026",
        lastWorkingDay: "15 Jun 2026",
        theory: { start: "16 Jun 2026", end: "08 Jul 2026" },
        practical: { start: "09 Jul 2026", end: "21 Jul 2026" },
        nextSemester: "22 Jul 2026",
      },
      {
        sem: "VI Semester",
        program: "B.E. / B.Tech",
        colorClass: "navy",
        commencement: "27 Jan 2026",
        lastWorkingDay: "16 May 2026",
        theory: { start: "18 May 2026", end: "17 Jun 2026" },
        practical: { start: "18 Jun 2026", end: "30 Jun 2026" },
        nextSemester: "06 Jul 2026",
      },
      {
        sem: "VIII Semester",
        program: "B.E. / B.Tech",
        colorClass: "amber",
        commencement: "27 Jan 2026",
        lastWorkingDay: "09 May 2026",
        theory: { start: "11 May 2026", end: "30 May 2026" },
        practical: { start: "06 May 2026", end: "12 May 2026" },
        nextSemester: "06 Jul 2026",
      },
    ],
    generalInfo: [
      "Theory examinations: 09:30 AM – 12:30 PM.",
      "Practical / Viva-Voce examinations: 10:00 AM onwards.",
      "Report to the examination hall 15 minutes before commencement.",
      "Carry hall ticket (VTU portal) + valid college ID card.",
      "Colleges shall conduct additional classes on weekdays, Saturdays and Sundays to ensure syllabus completion.",
      "Summer Semester (II & IV Sem) commences 22 Jul 2026 — 10 weeks inclusive of examinations.",
    ],
  });
});

export default router;
