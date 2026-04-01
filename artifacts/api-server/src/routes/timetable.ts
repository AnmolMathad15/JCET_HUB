import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TIMINGS = [
  { period: 1, start: "8:30 AM",  end: "9:30 AM"  },
  { period: 2, start: "9:30 AM",  end: "10:30 AM" },
  // Break 10:30–10:45
  { period: 3, start: "10:45 AM", end: "11:45 AM" },
  { period: 4, start: "11:45 AM", end: "12:45 PM" },
  // Lunch 12:45–1:30
  { period: 5, start: "1:30 PM",  end: "2:20 PM"  },
  { period: 6, start: "2:20 PM",  end: "3:10 PM"  },
  { period: 7, start: "3:10 PM",  end: "4:00 PM"  },
];

// ─── 6A – CSE ──────────────────────────────────────────────────────────────
const TT_6A = [
  // MON: [OEC, BCS613A, BREAK, BCS602, BCS601, LUNCH, BCS685, VAC, NSS]
  { day:"MON", p:1, code:"OEC",     name:"Open Elective",       faculty:"",               room:"202" },
  { day:"MON", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T", room:"202" },
  { day:"MON", p:3, code:"BCS602",  name:"Machine Learning",    faculty:"Dr. Maheshkumar Patil", room:"202" },
  { day:"MON", p:4, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"202" },
  { day:"MON", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },

  // TUE: [BAIL657C, BCSL606, BCS601, BCS685, VAC]
  { day:"TUE", p:1, code:"BAIL657C",name:"Generative AI",       faculty:"Prof. Trupti T",        room:"112" },
  { day:"TUE", p:2, code:"BCSL606", name:"ML Lab",              faculty:"Prof. Pooja S",         room:"A-208" },
  { day:"TUE", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"A-208" },
  { day:"TUE", p:4, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },

  // WED: [BCS601, BCS613A, BCS602, BIKS609, OEC, BCS685, VAC]
  { day:"WED", p:1, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"202" },
  { day:"WED", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"202" },
  { day:"WED", p:3, code:"BCS602",  name:"Machine Learning",    faculty:"Dr. Maheshkumar Patil", room:"202" },
  { day:"WED", p:4, code:"BIKS609", name:"Indian Knowledge System",faculty:"Prof. Sneha M S",   room:"202" },
  { day:"WED", p:5, code:"OEC",     name:"Open Elective",       faculty:"",               room:"202" },
  { day:"WED", p:6, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },

  // THU: [BCS613A, BCS602, BCS601, BCS602, OEC, BCS685, NSS]
  { day:"THU", p:1, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"202" },
  { day:"THU", p:2, code:"BCS602",  name:"Machine Learning",    faculty:"Dr. Maheshkumar Patil", room:"202" },
  { day:"THU", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"202" },
  { day:"THU", p:4, code:"BCS602",  name:"Machine Learning",    faculty:"Dr. Maheshkumar Patil", room:"202" },
  { day:"THU", p:5, code:"OEC",     name:"Open Elective",       faculty:"",               room:"202" },
  { day:"THU", p:6, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },

  // FRI: [CC LAB, BCS602, BCS613A, BCS685, NSS, NSS]
  { day:"FRI", p:1, code:"BCS601",  name:"CC Lab",              faculty:"Prof. Amruta Naveen",   room:"A-208" },
  { day:"FRI", p:2, code:"BCS602",  name:"Machine Learning",    faculty:"Dr. Maheshkumar Patil", room:"202" },
  { day:"FRI", p:3, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"202" },
  { day:"FRI", p:4, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },

  // SAT: [BCS685, BCS685, NSS, NSS, NSS]
  { day:"SAT", p:1, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },
  { day:"SAT", p:2, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"202" },
];

// ─── 6B – CSE ──────────────────────────────────────────────────────────────
const TT_6B = [
  // MON: [BCSL606, BREAK, BCS601, BCS613A, LUNCH, CC LAB, NSS]
  { day:"MON", p:1, code:"BCSL606", name:"ML Lab",              faculty:"Prof. Harshita",        room:"A-208" },
  { day:"MON", p:2, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"203" },
  { day:"MON", p:3, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"203" },
  { day:"MON", p:4, code:"BCS601",  name:"CC Lab",              faculty:"Prof. Amruta Naveen",   room:"A-208" },

  // TUE: [BCS601, BCS602, BCS613A, OEC, OEC, BCS685, VAC]
  { day:"TUE", p:1, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"203" },
  { day:"TUE", p:2, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Harshita",        room:"203" },
  { day:"TUE", p:3, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"203" },
  { day:"TUE", p:4, code:"OEC",     name:"Open Elective",       faculty:"",               room:"203" },
  { day:"TUE", p:5, code:"OEC",     name:"Open Elective",       faculty:"",               room:"203" },
  { day:"TUE", p:6, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },

  // WED: [BCS613A, BCS602, BAIL657C, BCS685, VAC, NSS]
  { day:"WED", p:1, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"203" },
  { day:"WED", p:2, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Harshita",        room:"203" },
  { day:"WED", p:3, code:"BAIL657C",name:"Generative AI",       faculty:"Prof. Megha S",         room:"112" },
  { day:"WED", p:4, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },

  // THU: [BCS602, BIKS609, BCS602, BCS601, VAC, BCS685, NSS]
  { day:"THU", p:1, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Harshita",        room:"203" },
  { day:"THU", p:2, code:"BIKS609", name:"Indian Knowledge System",faculty:"Prof. Sneha M S",   room:"203" },
  { day:"THU", p:3, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Harshita",        room:"203" },
  { day:"THU", p:4, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"203" },
  { day:"THU", p:6, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },

  // FRI: [BCS602, BCS613A, BCS601, OEC, BCS685, NSS, NSS]
  { day:"FRI", p:1, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Harshita",        room:"203" },
  { day:"FRI", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Trupti T",       room:"203" },
  { day:"FRI", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Amruta Naveen",   room:"203" },
  { day:"FRI", p:4, code:"OEC",     name:"Open Elective",       faculty:"",               room:"203" },
  { day:"FRI", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },

  // SAT
  { day:"SAT", p:1, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },
  { day:"SAT", p:2, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"203" },
];

// ─── 6C – CSE ──────────────────────────────────────────────────────────────
const TT_6C = [
  // MON: [BCS602, OEC, BREAK, BCS613A, BCS601, LUNCH, BCS685, VAC, NSS]
  { day:"MON", p:1, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Padma D",         room:"204" },
  { day:"MON", p:2, code:"OEC",     name:"Open Elective",       faculty:"",               room:"204" },
  { day:"MON", p:3, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Megha S",        room:"204" },
  { day:"MON", p:4, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Preethi",         room:"204" },
  { day:"MON", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },

  // TUE: [BCS613A, BCS602, BCS601, BIKS609, BCS685, VAC, NSS]
  { day:"TUE", p:1, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Megha S",        room:"204" },
  { day:"TUE", p:2, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Padma D",         room:"204" },
  { day:"TUE", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Preethi",         room:"204" },
  { day:"TUE", p:4, code:"BIKS609", name:"Indian Knowledge System",faculty:"Prof. Vishal P",    room:"204" },
  { day:"TUE", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },

  // WED: [BCS602, BCS613A, BCS601, OEC, ML LAB, VAC]
  { day:"WED", p:1, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Padma D",         room:"204" },
  { day:"WED", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Megha S",        room:"204" },
  { day:"WED", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Preethi",         room:"204" },
  { day:"WED", p:4, code:"OEC",     name:"Open Elective",       faculty:"",               room:"204" },
  { day:"WED", p:5, code:"BCSL606", name:"ML Lab",              faculty:"Prof. Padma D",         room:"A-208" },

  // THU: [CC LAB, BCS613A, BCS602, BAIL657C, BCS685]
  { day:"THU", p:1, code:"BCS601",  name:"CC Lab",              faculty:"Prof. Preethi",         room:"A-208" },
  { day:"THU", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Megha S",        room:"204" },
  { day:"THU", p:3, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Padma D",         room:"204" },
  { day:"THU", p:4, code:"BAIL657C",name:"Generative AI",       faculty:"Dr. Maheshkumar Patil", room:"112" },
  { day:"THU", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },

  // FRI: [BCS602, OEC, BCS601, BCS685, BCS685, BCS685, VAC]
  { day:"FRI", p:1, code:"BCS602",  name:"Machine Learning",    faculty:"Prof. Padma D",         room:"204" },
  { day:"FRI", p:2, code:"OEC",     name:"Open Elective",       faculty:"",               room:"204" },
  { day:"FRI", p:3, code:"BCS601",  name:"Cloud Computing",     faculty:"Prof. Preethi",         room:"204" },
  { day:"FRI", p:4, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },
  { day:"FRI", p:5, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },
  { day:"FRI", p:6, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },

  // SAT
  { day:"SAT", p:1, code:"BCS685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"204" },
];

// ─── 6D – AIML ─────────────────────────────────────────────────────────────
const TT_6D = [
  // MON: [BCS613A, BAI602, BREAK, BIKS609, BAI601, LUNCH, BAIL657C, NSS]
  { day:"MON", p:1, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Praveen",        room:"205" },
  { day:"MON", p:2, code:"BAI602",  name:"Machine Learning-I",  faculty:"Prof. Rakesh",         room:"205" },
  { day:"MON", p:3, code:"BIKS609", name:"Indian Knowledge System",faculty:"Prof. Vishal P",    room:"205" },
  { day:"MON", p:4, code:"BAI601",  name:"Natural Language Processing",faculty:"Prof. Harshita",room:"205" },
  { day:"MON", p:5, code:"BAIL657C",name:"Generative AI",       faculty:"Prof. Vinod",          room:"112" },

  // TUE: [BCS613A, BAI602, BAI601, OEC, BAI685, VAC, NSS]
  { day:"TUE", p:1, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Praveen",        room:"205" },
  { day:"TUE", p:2, code:"BAI602",  name:"Machine Learning-I",  faculty:"Prof. Rakesh",         room:"205" },
  { day:"TUE", p:3, code:"BAI601",  name:"Natural Language Processing",faculty:"Prof. Harshita",room:"205" },
  { day:"TUE", p:4, code:"OEC",     name:"Open Elective",       faculty:"",               room:"205" },
  { day:"TUE", p:5, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },

  // WED: [BAI601, BCS613A, BAI602, OEC, BAI685, VAC, NSS]
  { day:"WED", p:1, code:"BAI601",  name:"Natural Language Processing",faculty:"Prof. Harshita",room:"205" },
  { day:"WED", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Praveen",        room:"205" },
  { day:"WED", p:3, code:"BAI602",  name:"Machine Learning-I",  faculty:"Prof. Rakesh",         room:"205" },
  { day:"WED", p:4, code:"OEC",     name:"Open Elective",       faculty:"",               room:"205" },
  { day:"WED", p:5, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },

  // THU: [BAI602, BCS613A, ML LAB, BAI685, BAI685, VAC]
  { day:"THU", p:1, code:"BAI602",  name:"Machine Learning-I",  faculty:"Prof. Rakesh",         room:"205" },
  { day:"THU", p:2, code:"BCS613A", name:"Blockchain Technology",faculty:"Prof. Praveen",        room:"205" },
  { day:"THU", p:3, code:"BAIL606", name:"ML Lab",              faculty:"Prof. Rakesh",         room:"A-208" },
  { day:"THU", p:4, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },
  { day:"THU", p:5, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },

  // FRI: [OEC, BAI602, BAI601, BIKS609, NLP LAB, NSS]
  { day:"FRI", p:1, code:"OEC",     name:"Open Elective",       faculty:"",               room:"205" },
  { day:"FRI", p:2, code:"BAI602",  name:"Machine Learning-I",  faculty:"Prof. Rakesh",         room:"205" },
  { day:"FRI", p:3, code:"BAI601",  name:"Natural Language Processing",faculty:"Prof. Harshita",room:"205" },
  { day:"FRI", p:4, code:"BIKS609", name:"Indian Knowledge System",faculty:"Prof. Vishal P",    room:"205" },
  { day:"FRI", p:5, code:"BAI601",  name:"NLP Lab",             faculty:"Prof. Harshita",       room:"A-208" },

  // SAT
  { day:"SAT", p:1, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },
  { day:"SAT", p:2, code:"BAI685",  name:"Project Phase I",     faculty:"Prof. Vishwanath H",    room:"205" },
];

const SECTION_MAP: Record<string, typeof TT_6A> = {
  "6A": TT_6A, "6B": TT_6B, "6C": TT_6C, "6D": TT_6D,
};

router.get("/timetable", (req, res) => {
  const { section = "6A" } = req.query as Record<string, string>;

  const raw = SECTION_MAP[section.toUpperCase()] ?? TT_6A;

  const dayOrder: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

  const records = raw
    .sort((a, b) => dayOrder[a.day] - dayOrder[b.day] || a.p - b.p)
    .map(r => {
      const timing = TIMINGS.find(t => t.period === r.p);
      return {
        day: r.day,
        period: r.p,
        startTime: timing?.start ?? "",
        endTime: timing?.end ?? "",
        subject: r.name,
        subjectCode: r.code,
        faculty: r.faculty,
        room: r.room,
      };
    });

  res.json(records);
});

export default router;
