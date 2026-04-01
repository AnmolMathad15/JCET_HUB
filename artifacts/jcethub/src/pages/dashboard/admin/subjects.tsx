import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { BookOpen, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Department { id: string; name: string; code: string; }
interface Subject { id: string; name: string; code: string; departmentId: string | null; semester: string | null; credits: number | null; }

export default function SubjectsPage() {
  const qc = useQueryClient();
  const { data: subjects = [], isLoading } = useApiGet<Subject[]>("/admin/subjects");
  const { data: departments = [] } = useApiGet<Department[]>("/admin/departments");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", departmentId: "", semester: "", credits: "4" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));
  const filtered = filterDept ? subjects.filter(s => s.departmentId === filterDept) : subjects;

  const resetForm = () => {
    setForm({ name: "", code: "", departmentId: "", semester: "", credits: "4" });
    setEditId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (s: Subject) => {
    setForm({ name: s.name, code: s.code, departmentId: s.departmentId ?? "", semester: s.semester ?? "", credits: String(s.credits ?? 4) });
    setEditId(s.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.code) { setError("Name and code are required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, credits: parseInt(form.credits) };
      if (editId) {
        await apiFetch(`/admin/subjects/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      qc.invalidateQueries({ queryKey: ["/admin/subjects"] });
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await apiFetch(`/admin/subjects/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/admin/subjects"] });
  };

  return (
    <Layout title="Subjects">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">Subjects</h2>
          </div>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editId ? "Edit Subject" : "New Subject"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3">
              {[
                { label: "Subject Name *", key: "name", placeholder: "e.g. Data Structures" },
                { label: "Subject Code *", key: "code", placeholder: "e.g. CS501" },
                { label: "Semester", key: "semester", placeholder: "e.g. 5" },
                { label: "Credits", key: "credits", placeholder: "4" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(fo => ({ ...fo, [f.key]: f.key === "code" ? e.target.value.toUpperCase() : e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.departmentId}
                  onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593] disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={resetForm} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No subjects found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sem</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Credits</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">{s.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.departmentId ? (
                        <span className="text-gray-600">{deptMap[s.departmentId] ?? s.departmentId}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.semester ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.credits ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(s)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
