import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/results", (_req, res) => {
  res.json({
    cgpa: 8.75,
    totalCredits: 120,
    semesters: [
      {
        semester: 1, sgpa: 8.5, credits: 22, year: "2021-22",
        subjects: [
          { name: "Engineering Mathematics I",     code: "18MAT11", grade: "A",  points: 9 },
          { name: "Engineering Physics",           code: "18PHY12", grade: "A",  points: 9 },
          { name: "Basic Electrical Engineering",  code: "18ELE13", grade: "B+", points: 8 },
          { name: "Elements of Civil Engineering", code: "18CIV14", grade: "A",  points: 9 },
          { name: "Engineering Chemistry",         code: "18CHE12", grade: "B",  points: 7 },
          { name: "C Programming",                 code: "18CPL17", grade: "O",  points: 10 },
        ],
      },
      {
        semester: 2, sgpa: 8.8, credits: 22, year: "2021-22",
        subjects: [
          { name: "Engineering Mathematics II",    code: "18MAT21", grade: "A",  points: 9 },
          { name: "Engineering Physics Lab",       code: "18PHYL16",grade: "O",  points: 10 },
          { name: "Basic Electronics",             code: "18ELN14", grade: "A",  points: 9 },
          { name: "Elements of Mech. Engineering", code: "18EME22", grade: "B+", points: 8 },
          { name: "Environmental Studies",         code: "18ES24",  grade: "A",  points: 9 },
          { name: "Data Structures Lab",           code: "18CSL26", grade: "O",  points: 10 },
        ],
      },
      {
        semester: 3, sgpa: 9.0, credits: 24, year: "2022-23",
        subjects: [
          { name: "Engineering Mathematics III",   code: "18MAT31", grade: "A",  points: 9 },
          { name: "Data Structures",               code: "18CS32",  grade: "O",  points: 10 },
          { name: "Analog & Digital Electronics",  code: "18EC33",  grade: "A+", points: 9 },
          { name: "Computer Organization",         code: "18CS34",  grade: "A",  points: 9 },
          { name: "Discrete Mathematics",          code: "18CS35",  grade: "O",  points: 10 },
          { name: "OOP with Java Lab",             code: "18CSL38", grade: "O",  points: 10 },
        ],
      },
      {
        semester: 4, sgpa: 8.7, credits: 24, year: "2022-23",
        subjects: [
          { name: "Engineering Mathematics IV",    code: "18MAT41", grade: "A",  points: 9 },
          { name: "Analysis & Design of Algorithms",code:"18CS42",  grade: "A+", points: 9 },
          { name: "Microprocessors",               code: "18CS44",  grade: "A",  points: 9 },
          { name: "Database Management Systems",   code: "18CS43",  grade: "O",  points: 10 },
          { name: "Operating Systems",             code: "18CS45",  grade: "B+", points: 8 },
          { name: "DBMS Lab",                      code: "18CSL46", grade: "O",  points: 10 },
        ],
      },
    ],
  });
});

export default router;
