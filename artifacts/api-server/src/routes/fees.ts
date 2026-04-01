import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/fees", (_req, res) => {
  res.json({
    studentName: "Aryan Joshi",
    usn: "2JH23CS001",
    totalDue: 2500,
    totalPaid: 102500,
    ledger: [
      { id: "1", description: "Tuition Fee – 2024-25",         amount: 85000, paid: 85000, dueDate: "2024-07-31", paidDate: "2024-07-20", status: "paid",    category: "tuition" },
      { id: "2", description: "Development & Lab Fee – 2024-25", amount: 15000, paid: 15000, dueDate: "2024-07-31", paidDate: "2024-07-20", status: "paid",    category: "development" },
      { id: "3", description: "VTU Exam Registration Fee",      amount: 2500,  paid: 0,     dueDate: "2024-12-15", paidDate: null,         status: "pending", category: "exam" },
      { id: "4", description: "Alumni Association Fee",         amount: 500,   paid: 500,   dueDate: "2024-08-31", paidDate: "2024-08-10", status: "paid",    category: "other" },
      { id: "5", description: "Library Fine",                   amount: 0,     paid: 0,     dueDate: null,         paidDate: null,         status: "nil",     category: "library" },
      { id: "6", description: "Caution Deposit (Refundable)",   amount: 2000,  paid: 2000,  dueDate: "2024-07-31", paidDate: "2024-07-20", status: "paid",    category: "deposit" },
    ],
  });
});

export default router;
