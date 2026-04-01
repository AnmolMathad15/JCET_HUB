import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Note {
  id: string;
  subject: string;
  title: string;
  description: string;
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  semester: string;
  tags?: string;
}

const notesStore: Note[] = [
  { id: "n1", subject: "Data Structures & Algorithms", title: "Module 3 – Graph Algorithms Notes", description: "Complete notes on BFS, DFS, Dijkstra's, and Floyd-Warshall with solved examples.", uploadedBy: "Dr. Suresh Patil", uploadedAt: "2024-10-15T09:00:00Z", semester: "5th", tags: "graphs,BFS,DFS" },
  { id: "n2", subject: "Operating Systems", title: "Process Scheduling – Short Notes", description: "Concise notes covering FCFS, SJF, Round Robin, and Priority scheduling with numerical problems.", uploadedBy: "Prof. Kavitha R.", uploadedAt: "2024-10-20T11:00:00Z", semester: "5th", tags: "scheduling,CPU" },
  { id: "n3", subject: "Database Management Systems", title: "SQL Commands – Quick Reference", description: "Comprehensive SQL DDL/DML/DCL command reference with syntax and examples for IA preparation.", uploadedBy: "Dr. Anand M.", uploadedAt: "2024-10-22T14:00:00Z", semester: "5th", tags: "SQL,DDL,DML" },
  { id: "n4", subject: "Computer Networks", title: "OSI and TCP/IP Model – Comparison Table", description: "Detailed comparison of OSI and TCP/IP models with protocol stack and layer functions.", uploadedBy: "Prof. Ravi Kumar", uploadedAt: "2024-10-25T10:00:00Z", semester: "5th", tags: "OSI,TCP/IP,networking" },
];

router.get("/notes", (_req, res) => {
  res.json([...notesStore].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
});

router.post("/notes", (req, res) => {
  const { subject, title, description, fileUrl, uploadedBy, semester, tags } = req.body ?? {};
  if (!subject || !title || !uploadedBy) {
    return res.status(400).json({ error: "validation_error", message: "subject, title, and uploadedBy are required" });
  }
  const note: Note = {
    id: `n${Date.now()}`,
    subject,
    title,
    description: description ?? "",
    fileUrl: fileUrl ?? undefined,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    semester: semester ?? "Current",
    tags: tags ?? "",
  };
  notesStore.unshift(note);
  res.status(201).json(note);
});

router.delete("/notes/:id", (req, res) => {
  const idx = notesStore.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  notesStore.splice(idx, 1);
  res.json({ success: true });
});

export default router;
