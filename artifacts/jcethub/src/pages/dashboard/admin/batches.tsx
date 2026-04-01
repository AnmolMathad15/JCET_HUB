import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { Layers, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Department { id: string; name: string; code: string; }
interface Batch { id: string; name: string; departmentId: string | null; semester: string | null; year: string | null; }

export default function BatchesPage() {
  const qc = useQueryClient();
  const { data: batches = [], isLoading } = useApiGet<Batch[]>("/admin/batches");
  const { data: departments = [] } = useApiGet<Department[]>("/admin/departments");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", departmentId: "", semester: "", year: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));

  const resetForm = () => {
    setForm({ name: "", departmentId: "", semester: "", year: "" });
    setEditId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (b: Batch) => {
    setForm({ name: b.name, departmentId: b.departmentId ?? "", semester: b.semester ?? "", year: b.year ?? "" });
    setEditId(b.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) { setError("Batch name is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await apiFetch(`/admin/batches/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/admin/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      qc.invalidateQueries({ queryKey: ["/admin/batches"] });
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    await apiFetch(`/admin/batches/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/admin/batches"] });
  };

  return (
    <Layout title="Batches">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">Batches / Sections</h2>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
          >
            <Plus className="w-4 h-4" /> Add Batch
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editId ? "Edit Batch" : "New Batch"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              {[
                { label: "Batch Name *", key: "name", placeholder: "e.g. A1" },
                { label: "Semester", key: "semester", placeholder: "e.g. 5" },
                { label: "Year", key: "year", placeholder: "e.g. 2021" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(fo => ({ ...fo, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
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
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No batches yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Semester</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Year</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-[#1a237e]">{b.name}</td>
                    <td className="px-4 py-3">
                      {b.departmentId ? (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{deptMap[b.departmentId] ?? b.departmentId}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.semester ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.year ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(b)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(b.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
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
