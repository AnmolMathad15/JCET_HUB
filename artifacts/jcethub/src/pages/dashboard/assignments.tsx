import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, FileText, Upload, Clock, CheckCircle2, XCircle, Eye, Star, X, Check } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  batchName: string | null;
  facultyName: string | null;
  dueDate: string | null;
  maxMarks: number | null;
  createdAt: string;
  submission?: Submission | null;
  submissions?: Submission[];
}

interface Submission {
  id: string;
  studentId: string;
  studentUsn: string | null;
  studentName: string | null;
  fileUrl: string | null;
  fileName: string | null;
  remarks: string | null;
  marksAwarded: number | null;
  status: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

export default function AssignmentsPage() {
  const user = getUser();
  const qc = useQueryClient();
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty" || user?.role === "admin";

  const { data: assignments = [], isLoading } = useApiGet<Assignment[]>("/assignments");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", subjectName: "", batchName: "", dueDate: "", maxMarks: "10"
  });
  const [saving, setSaving] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitForm, setSubmitForm] = useState({ fileUrl: "", fileName: "", remarks: "" });
  const [submitting, setSubmitting] = useState(false);

  const [gradeForm, setGradeForm] = useState<{ subId: string; marks: string; remarks: string } | null>(null);
  const [grading, setGrading] = useState(false);

  const createAssignment = async () => {
    if (!createForm.title) return;
    setSaving(true);
    try {
      await apiFetch("/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, maxMarks: parseInt(createForm.maxMarks) }),
      });
      qc.invalidateQueries({ queryKey: ["/assignments"] });
      setCreateForm({ title: "", description: "", subjectName: "", batchName: "", dueDate: "", maxMarks: "10" });
      setShowCreateForm(false);
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitForm),
      });
      qc.invalidateQueries({ queryKey: ["/assignments"] });
      setSelectedAssignment(null);
      setSubmitForm({ fileUrl: "", fileName: "", remarks: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const gradeSubmission = async (assignmentId: string) => {
    if (!gradeForm) return;
    setGrading(true);
    try {
      await apiFetch(`/assignments/${assignmentId}/submissions/${gradeForm.subId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marksAwarded: parseInt(gradeForm.marks), remarks: gradeForm.remarks }),
      });
      qc.invalidateQueries({ queryKey: ["/assignments"] });
      setGradeForm(null);
      setSelectedAssignment(null);
    } finally {
      setGrading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await apiFetch(`/assignments/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/assignments"] });
  };

  const isOverdue = (dueDate: string | null) => dueDate && new Date(dueDate) < new Date();
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "No deadline";

  return (
    <Layout title="Assignments">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">Assignments</h2>
          </div>
          {isFaculty && (
            <button
              onClick={() => setShowCreateForm(s => !s)}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
            >
              <Plus className="w-4 h-4" /> Create Assignment
            </button>
          )}
        </div>

        {showCreateForm && isFaculty && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">New Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Assignment 1 – Sorting Algorithms" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Instructions or description..." value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Data Structures" value={createForm.subjectName} onChange={e => setCreateForm(f => ({ ...f, subjectName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Batch / Section</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. A1" value={createForm.batchName} onChange={e => setCreateForm(f => ({ ...f, batchName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Marks</label>
                <input type="number" min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.maxMarks} onChange={e => setCreateForm(f => ({ ...f, maxMarks: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createAssignment} disabled={saving} className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593] disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? "Creating..." : "Create Assignment"}
              </button>
              <button onClick={() => setShowCreateForm(false)} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{isFaculty ? "No assignments yet. Create one above." : "No assignments posted for your batch yet."}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(a => {
              const submitted = isStudent && a.submission;
              const graded = submitted && a.submission?.status === "graded";
              const overdue = isOverdue(a.dueDate);

              return (
                <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800 text-base">{a.title}</h3>
                        {isStudent && (
                          graded ? (
                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-3 h-3" /> Graded {a.submission?.marksAwarded}/{a.maxMarks}
                            </span>
                          ) : submitted ? (
                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          ) : overdue ? (
                            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Overdue
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )
                        )}
                        {isFaculty && (
                          <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">
                            {a.submissions?.length ?? 0} submissions
                          </span>
                        )}
                      </div>
                      {a.description && <p className="text-sm text-gray-500 mb-2">{a.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {a.subjectName && <span>📚 {a.subjectName}</span>}
                        {a.batchName && <span>👥 Batch {a.batchName}</span>}
                        {a.facultyName && <span>👤 {a.facultyName}</span>}
                        <span className={overdue && !submitted ? "text-red-500 font-medium" : ""}>
                          🕐 Due: {formatDate(a.dueDate)}
                        </span>
                        <span>📊 Max: {a.maxMarks} marks</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {isStudent && !submitted && !overdue && (
                        <button
                          onClick={() => setSelectedAssignment(a)}
                          className="flex items-center gap-1 bg-[#1a237e] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#283593]"
                        >
                          <Upload className="w-3 h-3" /> Submit
                        </button>
                      )}
                      {isFaculty && (
                        <button
                          onClick={() => setSelectedAssignment(a)}
                          className="flex items-center gap-1 border border-[#1a237e] text-[#1a237e] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#1a237e]/5"
                        >
                          <Eye className="w-3 h-3" /> View Submissions
                        </button>
                      )}
                      {isFaculty && (
                        <button
                          onClick={() => deleteAssignment(a.id)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isStudent && graded && a.submission?.remarks && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500"><strong>Faculty remarks:</strong> {a.submission.remarks}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedAssignment && isStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Submit Assignment</h3>
                  <p className="text-sm text-gray-500">{selectedAssignment.title}</p>
                </div>
                <button onClick={() => setSelectedAssignment(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">File / Drive Link *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://drive.google.com/..." value={submitForm.fileUrl} onChange={e => setSubmitForm(f => ({ ...f, fileUrl: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">File Name</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Assignment1_2JH23CS001.pdf" value={submitForm.fileName} onChange={e => setSubmitForm(f => ({ ...f, fileName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Remarks (optional)</label>
                  <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" value={submitForm.remarks} onChange={e => setSubmitForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => submitAssignment(selectedAssignment.id)} disabled={submitting || !submitForm.fileUrl} className="flex-1 bg-[#1a237e] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#283593] disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
                <button onClick={() => setSelectedAssignment(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {selectedAssignment && isFaculty && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Submissions</h3>
                  <p className="text-sm text-gray-500">{selectedAssignment.title} · Max {selectedAssignment.maxMarks} marks</p>
                </div>
                <button onClick={() => { setSelectedAssignment(null); setGradeForm(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {(selectedAssignment.submissions?.length ?? 0) === 0 ? (
                <p className="text-center text-gray-400 py-8">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedAssignment.submissions?.map(sub => (
                    <div key={sub.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <div className="font-medium text-gray-800">{sub.studentName ?? "Unknown"}</div>
                          <div className="text-xs text-gray-400">{sub.studentUsn} · {new Date(sub.submittedAt).toLocaleString()}</div>
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                              <FileText className="w-3 h-3" /> {sub.fileName ?? "View File"}
                            </a>
                          )}
                          {sub.remarks && <p className="text-xs text-gray-500 mt-1">"{sub.remarks}"</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.status === "graded" ? (
                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">
                              {sub.marksAwarded}/{selectedAssignment.maxMarks}
                            </span>
                          ) : (
                            <button
                              onClick={() => setGradeForm({ subId: sub.id, marks: "", remarks: "" })}
                              className="text-xs bg-[#E8821A] text-white px-3 py-1 rounded-lg font-medium hover:bg-[#d4741a]"
                            >
                              Grade
                            </button>
                          )}
                        </div>
                      </div>
                      {gradeForm?.subId === sub.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 items-end">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Marks (/{selectedAssignment.maxMarks})</label>
                            <input type="number" min={0} max={selectedAssignment.maxMarks ?? 10} className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm" value={gradeForm.marks} onChange={e => setGradeForm(f => f ? { ...f, marks: e.target.value } : null)} />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                            <input className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" value={gradeForm.remarks} onChange={e => setGradeForm(f => f ? { ...f, remarks: e.target.value } : null)} />
                          </div>
                          <button onClick={() => gradeSubmission(selectedAssignment.id)} disabled={grading || !gradeForm.marks} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                            {grading ? "..." : "Save"}
                          </button>
                          <button onClick={() => setGradeForm(null)} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
