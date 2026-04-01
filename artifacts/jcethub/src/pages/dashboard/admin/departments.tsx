import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { Building2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Department {
  id: string;
  name: string;
  code: string;
  hodName: string | null;
  createdAt: string;
}

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const { data: departments = [], isLoading } = useApiGet<Department[]>("/admin/departments");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", hodName: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setForm({ name: "", code: "", hodName: "" });
    setEditId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (d: Department) => {
    setForm({ name: d.name, code: d.code, hodName: d.hodName ?? "" });
    setEditId(d.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.code) { setError("Name and code are required"); return; }
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await apiFetch(`/admin/departments/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      qc.invalidateQueries({ queryKey: ["/admin/departments"] });
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    await apiFetch(`/admin/departments/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/admin/departments"] });
  };

  return (
    <Layout title="Departments">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">Departments</h2>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editId ? "Edit Department" : "New Department"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                  placeholder="e.g. Computer Science & Engineering"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Code *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 uppercase"
                  placeholder="e.g. CSE"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">HOD Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
                  placeholder="e.g. Dr. Ravi Kumar"
                  value={form.hodName}
                  onChange={e => setForm(f => ({ ...f, hodName: e.target.value }))}
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593] disabled:opacity-50"
              >
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
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No departments yet. Add one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">HOD</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {departments.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{d.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.hodName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(d)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(d.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
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
