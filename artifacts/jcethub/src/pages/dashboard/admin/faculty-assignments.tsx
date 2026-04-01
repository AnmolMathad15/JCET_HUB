import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { Link2, Plus, Trash2, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Department { id: string; name: string; code: string; }
interface Subject { id: string; name: string; code: string; }
interface Batch { id: string; name: string; departmentId: string | null; }
interface UserRow { id: string; name: string; usn: string; }
interface Assignment { id: string; facultyId: string; subjectId: string; batchId: string; }

export default function FacultyAssignmentsPage() {
  const qc = useQueryClient();
  const { data: assignments = [], isLoading } = useApiGet<Assignment[]>("/admin/faculty-assignments");
  const { data: departments = [] } = useApiGet<Department[]>("/admin/departments");
  const { data: subjects = [] } = useApiGet<Subject[]>("/admin/subjects");
  const { data: batches = [] } = useApiGet<Batch[]>("/admin/batches");
  const { data: facultyData } = useApiGet<{ users: UserRow[] }>("/admin/users?role=faculty&limit=100");

  const faculty = facultyData?.users ?? [];

  const [form, setForm] = useState({ facultyId: "", subjectId: "", batchId: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, `${s.code} – ${s.name}`]));
  const batchMap = Object.fromEntries(batches.map(b => [b.id, b.name]));
  const facultyMap = Object.fromEntries(faculty.map(f => [f.id, f.name]));

  const save = async () => {
    if (!form.facultyId || !form.subjectId || !form.batchId) { setError("All fields required"); return; }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/admin/faculty-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      qc.invalidateQueries({ queryKey: ["/admin/faculty-assignments"] });
      setForm({ facultyId: "", subjectId: "", batchId: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    await apiFetch(`/admin/faculty-assignments/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/admin/faculty-assignments"] });
  };

  return (
    <Layout title="Faculty Subject Assignments">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">Faculty → Subject → Batch</h2>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
          >
            <Plus className="w-4 h-4" /> Assign Faculty
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Assign Faculty to Subject & Batch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Faculty *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                  <option value="">— Select Faculty —</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Batch *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
                  <option value="">— Select Batch —</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593] disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? "Saving..." : "Assign"}
              </button>
              <button onClick={() => { setShowForm(false); setError(""); }} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No assignments yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Faculty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{facultyMap[a.facultyId] ?? a.facultyId}</td>
                    <td className="px-4 py-3 text-gray-600">{subjectMap[a.subjectId] ?? a.subjectId}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">{batchMap[a.batchId] ?? a.batchId}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
