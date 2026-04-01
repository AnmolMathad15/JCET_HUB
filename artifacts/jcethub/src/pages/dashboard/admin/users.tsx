import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet, apiFetch } from "@/lib/api";
import { Users, Plus, Pencil, Trash2, X, Check, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Department { id: string; name: string; code: string; }
interface Batch { id: string; name: string; departmentId: string | null; }
interface UserRow {
  id: string; usn: string; name: string; role: string;
  branch: string | null; semester: string | null; email: string | null;
  phone: string | null; departmentId: string | null; batchId: string | null;
  admissionType: string | null;
}

const ROLES = ["student", "faculty", "admin"];
const ADMISSION_TYPES = ["KCET", "Management", "COMEDK"];

export default function UsersPage() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (roleFilter) params.set("role", roleFilter);
  if (deptFilter) params.set("departmentId", deptFilter);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", "15");

  const queryPath = `/admin/users?${params.toString()}`;
  const { data, isLoading } = useApiGet<{ users: UserRow[]; total: number; page: number; limit: number }>(queryPath);
  const { data: departments = [] } = useApiGet<Department[]>("/admin/departments");
  const { data: batches = [] } = useApiGet<Batch[]>("/admin/batches");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    usn: "", name: "", role: "student", password: "", branch: "",
    semester: "", email: "", phone: "", departmentId: "", batchId: "", admissionType: "KCET"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));
  const batchMap = Object.fromEntries(batches.map(b => [b.id, b.name]));
  const availBatches = form.departmentId ? batches.filter(b => b.departmentId === form.departmentId) : batches;

  const resetForm = () => {
    setForm({ usn: "", name: "", role: "student", password: "", branch: "", semester: "", email: "", phone: "", departmentId: "", batchId: "", admissionType: "KCET" });
    setEditId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (u: UserRow) => {
    setForm({
      usn: u.usn, name: u.name, role: u.role, password: "",
      branch: u.branch ?? "", semester: u.semester ?? "", email: u.email ?? "",
      phone: u.phone ?? "", departmentId: u.departmentId ?? "", batchId: u.batchId ?? "",
      admissionType: u.admissionType ?? "KCET"
    });
    setEditId(u.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.role || (!editId && !form.password)) {
      setError("Name, role, and password (for new users) are required"); return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: any = { ...form };
      if (editId && !form.password) delete payload.password;
      if (editId) {
        await apiFetch(`/admin/users/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      qc.invalidateQueries({ queryKey: [queryPath] });
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: [queryPath] });
  };

  const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700",
    faculty: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
  };

  return (
    <Layout title="User Management">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-gray-800">User Management</h2>
            {data && <span className="text-sm text-gray-400">({data.total} total)</span>}
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#283593]"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 w-48"
              placeholder="Search name / USN / email"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editId ? "Edit User" : "New User"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {!editId && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">USN *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" placeholder="2JH23CS001" value={form.usn} onChange={e => setForm(f => ({ ...f, usn: e.target.value.toUpperCase() }))} />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Role *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{editId ? "Password (leave blank to keep)" : "Password *"}</label>
                <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="student@jcet.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Branch</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="CSE" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Semester</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="5" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Admission Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.admissionType} onChange={e => setForm(f => ({ ...f, admissionType: e.target.value }))}>
                  {ADMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, batchId: "" }))}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Batch</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
                  <option value="">— Select —</option>
                  {availBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
          ) : (data?.users ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400">No users found.</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">USN</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Dept / Batch</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Admission</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.users ?? []).map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{u.usn}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.departmentId ? deptMap[u.departmentId] ?? "—" : "—"}
                        {u.batchId ? ` / ${batchMap[u.batchId] ?? "—"}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{u.admissionType ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(u)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(u.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.total ?? 0) > 15 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Page {data?.page} of {Math.ceil((data?.total ?? 0) / 15)}</span>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">Prev</button>
                    <button disabled={page >= Math.ceil((data?.total ?? 0) / 15)} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
