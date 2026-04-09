import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Batch { id: string; name: string; department_id: string; semester: string; studentCount?: number }
interface Student { id: string; name: string; usn: string; branch: string; semester: string; attended: number; total: number; absent: number; percentage: number; status: string }
interface SubjectRow { subject: string; subjectCode: string; attended: number; total: number; absent: number; percentage: number; status: string }
interface SummaryStudent extends Student { subjects?: SubjectRow[]; totalPresent?: number; totalClasses?: number; overallPercentage?: number }
interface Session { id: string; date: string; subject: string; total: number; present: number; absent: number; facultyName?: string }

const BRANCH_SUBJECTS: Record<string, { label: string; code: string }[]> = {
  CSE: [
    { label: "Data Science", code: "CS601" },
    { label: "Computer Networks", code: "CS602" },
    { label: "Compiler Design", code: "CS603" },
    { label: "Software Engineering", code: "CS604" },
    { label: "Machine Learning", code: "CS605" },
    { label: "Operating Systems", code: "CS606" },
  ],
  ECE: [
    { label: "Digital Signal Processing", code: "EC601" },
    { label: "Embedded Systems", code: "EC602" },
    { label: "VLSI Design", code: "EC603" },
    { label: "Control Systems", code: "EC604" },
    { label: "Microcontrollers & Embedded", code: "EC605" },
  ],
  AIML: [
    { label: "Deep Learning", code: "AI601" },
    { label: "Natural Language Processing", code: "AI602" },
    { label: "Computer Vision", code: "AI603" },
    { label: "Big Data Analytics", code: "AI604" },
    { label: "AI Ethics & Governance", code: "AI605" },
  ],
  ME: [
    { label: "Dynamics of Machinery", code: "ME601" },
    { label: "Heat Transfer", code: "ME602" },
    { label: "Machine Design", code: "ME603" },
    { label: "Manufacturing Science", code: "ME604" },
  ],
};

function getBranchFromBatchId(id: string): string {
  if (id.includes("cse")) return "CSE";
  if (id.includes("ece")) return "ECE";
  if (id.includes("aiml")) return "AIML";
  if (id.includes("me")) return "ME";
  return "CSE";
}

const pctColor = (p: number) => p >= 75 ? "#22c55e" : p >= 65 ? "#f59e0b" : "#ef4444";
const pctBg    = (p: number) => p >= 75 ? "rgba(34,197,94,.1)" : p >= 65 ? "rgba(245,158,11,.1)" : "rgba(239,68,68,.1)";
const today    = new Date().toISOString().split("T")[0];


/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  const user   = JSON.parse(localStorage.getItem("user") ?? "{}");
  const isFac  = user.role === "faculty" || user.role === "admin";
  const [tab, setTab] = useState<"mark"|"summary"|"sessions"|"mine">(isFac ? "mark" : "mine");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#1a237e 0%,#283593 100%)", padding: "28px 32px 0", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 30 }}>📋</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1 }}>Attendance</h1>
            <p style={{ margin: 0, opacity: .75, fontSize: 13 }}>
              {isFac ? "Mark daily P/A · Semester summary · Batch-wise analytics" : "Track your attendance across all subjects"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 20, flexWrap: "wrap" }}>
          {isFac && (["mark","summary","sessions"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: tab===t ? "#fff" : "transparent",
              color: tab===t ? "#1a237e" : "rgba(255,255,255,.8)",
              borderRadius: "8px 8px 0 0", transition: "all .2s",
            }}>
              {t==="mark" ? "✏️ Mark Attendance" : t==="summary" ? "📊 Semester Summary" : "📅 Session Log"}
            </button>
          ))}
          <button onClick={() => setTab("mine")} style={{
            padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: tab==="mine" ? "#fff" : "transparent",
            color: tab==="mine" ? "#1a237e" : "rgba(255,255,255,.8)",
            borderRadius: "8px 8px 0 0", transition: "all .2s",
          }}>
            {isFac ? "👤 My Subjects" : "📚 My Subjects"}
          </button>
        </div>
      </div>

      {/* ── Panels ── */}
      <div style={{ padding: "24px 32px" }}>
        {tab==="mark"     && isFac && <MarkPanel user={user} />}
        {tab==="summary"  && isFac && <SummaryPanel />}
        {tab==="sessions" && isFac && <SessionsPanel />}
        {tab==="mine"              && <MyPanel />}
      </div>
    </div>
  );
}

/* ─── Batch selector shared hook ────────────────────────────────────────── */
function useBatches() {
  return useQuery<Batch[]>({
    queryKey: ["fac-batches"],
    queryFn: async () => {
      return apiFetch<Batch[]>("/faculty/attendance/all-batches");
    },
  });
}

/* ═══════════════ MARK ATTENDANCE ════════════════════════════════════════ */
function MarkPanel({ user }: { user: any }) {
  const qc = useQueryClient();
  const { data: batches = [] } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [date, setDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<string, "present"|"absent">>({});
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<any>(null);

  const branch   = batchId ? getBranchFromBatchId(batchId) : "";
  const subjects = branch ? (BRANCH_SUBJECTS[branch] ?? []) : [];

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["att-students", batchId, subject],
    enabled: !!batchId,
    queryFn: async () => {
      return apiFetch<Student[]>(`/faculty/attendance/students?batchId=${batchId}&subject=${encodeURIComponent(subject)}`);
    },
  });

  const resetBatch = (id: string) => { setBatchId(id); setSubject(""); setSubjectCode(""); setStatuses({}); setSaved(false); };
  const resetSubj  = (s: string)  => {
    const f = subjects.find(x => x.label === s);
    setSubject(s); setSubjectCode(f?.code ?? ""); setStatuses({}); setSaved(false);
  };

  const get = (id: string): "present"|"absent" => statuses[id] ?? "absent";
  const toggle = (id: string) => setStatuses(p => ({ ...p, [id]: p[id]==="present" ? "absent" : "present" }));
  const allP   = () => setStatuses(Object.fromEntries(students.map(s => [s.id, "present" as const])));
  const allA   = () => setStatuses(Object.fromEntries(students.map(s => [s.id, "absent"  as const])));
  const cntP   = students.filter(s => get(s.id)==="present").length;

  const mutation = useMutation({
    mutationFn: async () => {
      const records = students.map(s => ({ studentId: s.id, studentUsn: s.usn, status: get(s.id) }));
      return apiFetch<any>("/faculty/attendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, subject, subjectCode, branch, semester: "6", batchId, records }),
      });
    },
    onSuccess: d => {
      setSaved(true); setResult(d);
      qc.invalidateQueries({ queryKey: ["att-students"] });
      qc.invalidateQueries({ queryKey: ["att-sessions"] });
      qc.invalidateQueries({ queryKey: ["att-summary"] });
    },
  });

  return (
    <div>
      {/* Selector bar */}
      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Sel label="Batch" style={{ flex: "1 1 180px" }}>
            <select value={batchId} onChange={e => resetBatch(e.target.value)} style={selSt}>
              <option value="">— Select batch —</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.studentCount ?? "?"} students)</option>)}
            </select>
          </Sel>
          {batchId && (
            <Sel label="Subject" style={{ flex: "1 1 220px" }}>
              <select value={subject} onChange={e => resetSubj(e.target.value)} style={selSt}>
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.code} value={s.label}>{s.label} ({s.code})</option>)}
              </select>
            </Sel>
          )}
          {batchId && (
            <Sel label="Date" style={{ flex: "0 0 160px" }}>
              <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={selSt} />
            </Sel>
          )}
        </div>
      </div>

      {/* Success banner */}
      {saved && result && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #22c55e", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 36 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: "#15803d", fontSize: 16 }}>Attendance saved for {result.date}</div>
            <div style={{ color: "#166534", fontSize: 14, marginTop: 2 }}>
              <b>{result.present}</b> present · <b>{result.absent}</b> absent · <b>{result.total}</b> total — {subject} ({subjectCode})
            </div>
            <button onClick={() => { setSaved(false); setStatuses({}); }} style={{ marginTop: 8, padding: "6px 16px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Mark Another Session
            </button>
          </div>
        </div>
      )}

      {/* Student grid */}
      {!saved && batchId && subject && (
        isLoading ? <Spinner /> :
        students.length === 0 ? <Empty icon="👥" title="No students in this batch" /> :
        <>
          {/* Toolbar */}
          <div style={{ ...card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#1a237e", fontSize: 15, flex: 1 }}>
              {branch} · {subject} · <span style={{ color: "#64748b" }}>{date}</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", padding: "4px 14px", borderRadius: 20, fontWeight: 600 }}>
              <span style={{ color: "#22c55e" }}>{cntP}</span> / {students.length} present
            </div>
            <button onClick={allP} style={{ ...smBtn, background: "#dcfce7", color: "#15803d" }}>All Present ✓</button>
            <button onClick={allA} style={{ ...smBtn, background: "#fee2e2", color: "#dc2626" }}>All Absent ✗</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 10, marginBottom: 24 }}>
            {students.map(s => {
              const present = get(s.id)==="present";
              return (
                <button key={s.id} onClick={() => toggle(s.id)} style={{
                  background: present ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "#fff",
                  border: `2px solid ${present ? "#22c55e" : "#e2e8f0"}`,
                  borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12, transition: "all .15s",
                  boxShadow: present ? "0 2px 8px rgba(34,197,94,.15)" : "0 1px 3px rgba(0,0,0,.06)",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: present ? "#22c55e" : "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: present ? "#fff" : "#94a3b8", fontWeight: 800, fontSize: 17,
                    transition: "all .15s",
                  }}>
                    {present ? "P" : "A"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{s.usn}</div>
                    {s.total > 0 && (
                      <div style={{ fontSize: 11, color: pctColor(s.percentage), fontWeight: 600, marginTop: 2 }}>
                        Sem so far: {s.attended}/{s.total} ({s.percentage}%)
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sticky submit */}
          <div style={{ position: "sticky", bottom: 20, display: "flex", justifyContent: "center", gap: 12 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{
              padding: "14px 40px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#1a237e,#E8821A)", color: "#fff",
              fontSize: 16, fontWeight: 700, boxShadow: "0 4px 16px rgba(26,35,126,.35)",
              opacity: mutation.isPending ? .7 : 1, transition: "all .2s",
            }}>
              {mutation.isPending ? "Saving…" : `💾 Save — ${cntP} Present, ${students.length - cntP} Absent`}
            </button>
          </div>
          {mutation.isError && <p style={{ textAlign: "center", color: "#ef4444", marginTop: 12 }}>Failed to save. Please try again.</p>}
        </>
      )}

      {!batchId && <Empty icon="📋" title="Select a batch to begin marking attendance" sub={`${batches.length} batches available across all branches`} />}
      {batchId && !subject && (
        <div style={{ ...card, textAlign: "center", padding: "32px 20px", color: "#64748b" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Now select a subject to load the student list</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ SEMESTER SUMMARY ══════════════════════════════════════ */
function SummaryPanel() {
  const { data: batches = [] } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"safe"|"warning"|"danger">("all");

  const branch   = batchId ? getBranchFromBatchId(batchId) : "";
  const subjects = branch ? (BRANCH_SUBJECTS[branch] ?? []) : [];

  const { data: summary = [], isLoading } = useQuery<SummaryStudent[]>({
    queryKey: ["att-summary", batchId, subject],
    enabled: !!batchId,
    queryFn: async () => {
      return apiFetch<SummaryStudent[]>(`/faculty/attendance/summary?batchId=${batchId}&subject=${encodeURIComponent(subject)}`);
    },
  });

  const filtered = useMemo(() => {
    let list = summary;
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.usn.toLowerCase().includes(search.toLowerCase()));
    if (filter !== "all") list = list.filter(s => (s.status ?? "safe") === filter);
    return list;
  }, [summary, search, filter, subject]);

  const counts = { safe: 0, warning: 0, danger: 0 };
  summary.forEach(s => { const st = (s.status ?? "safe") as keyof typeof counts; if (st in counts) counts[st]++; });

  return (
    <div>
      {/* Selectors */}
      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Sel label="Batch" style={{ flex: "1 1 180px" }}>
            <select value={batchId} onChange={e => { setBatchId(e.target.value); setSubject(""); setSearch(""); setFilter("all"); }} style={selSt}>
              <option value="">— Select batch —</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Sel>
          {batchId && (
            <Sel label="Subject (blank = all subjects)" style={{ flex: "1 1 240px" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={selSt}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.code} value={s.label}>{s.label} ({s.code})</option>)}
              </select>
            </Sel>
          )}
          {batchId && (
            <Sel label="Search" style={{ flex: "1 1 160px" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or USN…" style={selSt} />
            </Sel>
          )}
        </div>
      </div>

      {batchId && (
        <>
          {/* Status pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {([
              {v:"all",     label:"All",         cnt: summary.length, bg:"#e2e8f0", col:"#334155"},
              {v:"safe",    label:"Safe ≥75%",   cnt: counts.safe,    bg:"#dcfce7", col:"#15803d"},
              {v:"warning", label:"Warning ≥65%",cnt: counts.warning, bg:"#fef9c3", col:"#a16207"},
              {v:"danger",  label:"Danger <65%", cnt: counts.danger,  bg:"#fee2e2", col:"#dc2626"},
            ] as const).map(p => (
              <button key={p.v} onClick={() => setFilter(p.v)} style={{
                padding: "7px 16px", borderRadius: 20, border: `2px solid ${filter===p.v ? p.col : "transparent"}`,
                background: p.bg, color: p.col, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s",
              }}>
                {p.label} ({p.cnt})
              </button>
            ))}
          </div>

          {isLoading ? <Spinner /> : !subject ? (
            /* All-subject table */
            <TableWrap>
              <thead>
                <tr style={{ background: "#1a237e", color: "#fff" }}>
                  <Th>#</Th><Th>USN</Th><Th align="left">Name</Th>
                  {((filtered[0]?.subjects ?? []) as SubjectRow[]).map((sub) => (
                    <Th key={sub.subjectCode}>{sub.subjectCode}<br/><small style={{ fontWeight:400, opacity:.7 }}>{sub.subject.split(" ").slice(0,2).join(" ")}</small></Th>
                  ))}
                  <Th>Overall</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const pct = s.overallPercentage ?? 0;
                  return (
                    <tr key={s.id} style={{ background: i%2===0 ? "#f8fafc" : "#fff" }}>
                      <Td>{i+1}</Td>
                      <Td mono>{s.usn}</Td>
                      <Td align="left" bold>{s.name}</Td>
                      {(s.subjects ?? []).map((sub) => (
                        <Td key={sub.subjectCode} bg={pctBg(sub.percentage)}>
                          <span style={{ color: pctColor(sub.percentage), fontWeight:700 }}>{sub.percentage}%</span><br/>
                          <small style={{ color:"#64748b" }}>{sub.attended}/{sub.total}</small>
                        </Td>
                      ))}
                      {!(s.subjects ?? []).length && <Td><span style={{ color:"#94a3b8" }}>—</span></Td>}
                      <Td bg={pctBg(pct)}>
                        <span style={{ color:pctColor(pct), fontWeight:700 }}>{pct}%</span><br/>
                        <small style={{ color:"#64748b" }}>{s.totalPresent}/{s.totalClasses}</small>
                      </Td>
                      <Td><StatusBadge pct={pct} /></Td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={20} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No students match</td></tr>}
              </tbody>
            </TableWrap>
          ) : (
            /* Single-subject table */
            <TableWrap>
              <thead>
                <tr style={{ background: "#1a237e", color: "#fff" }}>
                  <Th>#</Th><Th>USN</Th><Th align="left">Name</Th>
                  <Th>Classes Held</Th><Th>Present</Th><Th>Absent</Th>
                  <Th>Percentage</Th><Th>Status</Th><Th>Condonation</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const pct     = s.percentage ?? 0;
                  const total   = s.total ?? 0;
                  const att     = s.attended ?? 0;
                  const needed  = pct < 75 && total > 0 ? Math.ceil((0.75*total - att)/0.25) : 0;
                  const canMiss = pct >= 75 ? Math.floor((att - 0.75*total)/0.75) : 0;
                  return (
                    <tr key={s.id} style={{ background: i%2===0 ? "#f8fafc" : "#fff" }}>
                      <Td>{i+1}</Td>
                      <Td mono>{s.usn}</Td>
                      <Td align="left" bold>{s.name}</Td>
                      <Td>{total}</Td>
                      <Td><span style={{ color:"#15803d", fontWeight:600 }}>{att}</span></Td>
                      <Td><span style={{ color:"#dc2626", fontWeight:600 }}>{s.absent ?? total-att}</span></Td>
                      <Td bg={pctBg(pct)}>
                        <span style={{ color:pctColor(pct), fontWeight:700 }}>{pct}%</span>
                        <div style={{ height:4, background:"#e2e8f0", borderRadius:2, marginTop:4 }}>
                          <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:pctColor(pct), borderRadius:2 }} />
                        </div>
                      </Td>
                      <Td><StatusBadge pct={pct} /></Td>
                      <Td>
                        {pct >= 75
                          ? <span style={{ color:"#15803d", fontSize:12 }}>Can miss {canMiss} more</span>
                          : pct >= 65
                            ? <span style={{ color:"#a16207", fontSize:12 }}>Need {needed} for condonation</span>
                            : <span style={{ color:"#dc2626", fontSize:12 }}>Need {needed} to reach 75%</span>}
                      </Td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={9} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No students match</td></tr>}
              </tbody>
            </TableWrap>
          )}
        </>
      )}

      {!batchId && <Empty icon="📊" title="Select a batch to view the semester summary" />}
    </div>
  );
}

/* ═══════════════ SESSION LOG ════════════════════════════════════════════ */
function SessionsPanel() {
  const { data: batches = [] } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");

  const branch   = batchId ? getBranchFromBatchId(batchId) : "";
  const subjects = branch ? (BRANCH_SUBJECTS[branch] ?? []) : [];

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["att-sessions", batchId, subject],
    enabled: !!batchId && !!subject,
    queryFn: async () => {
      return apiFetch<Session[]>(`/faculty/attendance/sessions?batchId=${batchId}&subject=${encodeURIComponent(subject)}`);
    },
  });

  const avgPct = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.total > 0 ? (s.present/s.total)*100 : 0), 0) / sessions.length)
    : 0;

  return (
    <div>
      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Sel label="Batch" style={{ flex: "1 1 180px" }}>
            <select value={batchId} onChange={e => { setBatchId(e.target.value); setSubject(""); }} style={selSt}>
              <option value="">— Select batch —</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Sel>
          {batchId && (
            <Sel label="Subject" style={{ flex: "1 1 220px" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={selSt}>
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.code} value={s.label}>{s.label} ({s.code})</option>)}
              </select>
            </Sel>
          )}
        </div>
      </div>

      {batchId && subject && (
        isLoading ? <Spinner /> :
        sessions.length === 0 ? (
          <Empty icon="📅" title={`No sessions yet for ${subject}`} sub="Use 'Mark Attendance' to add the first session" />
        ) : (
          <>
            {/* Summary stat bar */}
            <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Total Sessions", val: sessions.length, col: "#1a237e", bg: "#ede9fe" },
                { label: "Avg Attendance", val: `${avgPct}%`, col: pctColor(avgPct), bg: pctBg(avgPct) },
                { label: "Total Classes", val: sessions.reduce((a,s)=>a+s.total,0), col: "#475569", bg: "#f1f5f9" },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "12px 20px", flex: "0 0 auto" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.col }}>{c.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{c.label}</div>
                </div>
              ))}
            </div>
            <TableWrap>
              <thead>
                <tr style={{ background: "#1a237e", color: "#fff" }}>
                  <Th>#</Th><Th>Date</Th><Th>Total</Th><Th>Present</Th><Th>Absent</Th><Th>Class %</Th><Th>Marked By</Th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.present/s.total)*100) : 0;
                  return (
                    <tr key={s.id} style={{ background: i%2===0 ? "#f8fafc" : "#fff" }}>
                      <Td>{i+1}</Td>
                      <Td bold>{s.date}</Td>
                      <Td>{s.total}</Td>
                      <Td><span style={{ color:"#15803d", fontWeight:600 }}>{s.present}</span></Td>
                      <Td><span style={{ color:"#dc2626", fontWeight:600 }}>{s.absent}</span></Td>
                      <Td bg={pctBg(pct)}><span style={{ color:pctColor(pct), fontWeight:700 }}>{pct}%</span></Td>
                      <Td><span style={{ color:"#64748b" }}>{s.facultyName ?? "Faculty"}</span></Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </>
        )
      )}
      {(!batchId || !subject) && <Empty icon="📅" title="Select a batch and subject to view session history" />}
    </div>
  );
}

/* ═══════════════ MY ATTENDANCE ══════════════════════════════════════════ */
function MyPanel() {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["my-attendance"],
    queryFn: async () => {
      return apiFetch<SubjectRow[]>("/attendance/me");
    },
  });

  const totalPresent = data.reduce((a, r) => a + (r.attended ?? 0), 0);
  const totalClasses = data.reduce((a, r) => a + (r.total ?? 0), 0);
  const overall = totalClasses > 0 ? Math.round((totalPresent/totalClasses)*100) : 0;

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Overall",        val: `${overall}%`, icon: "📊", col: pctColor(overall), bg: pctBg(overall) },
          { label: "Subjects",       val: data.length,   icon: "📚", col: "#1a237e",          bg: "#ede9fe"      },
          { label: "Classes Present",val: totalPresent,  icon: "✅", col: "#15803d",          bg: "#dcfce7"      },
          { label: "Classes Absent", val: totalClasses-totalPresent, icon:"❌", col:"#dc2626", bg:"#fee2e2"      },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "16px 20px", border: `1.5px solid ${c.col}22` }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.col }}>{c.val}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? <Spinner /> : data.length === 0 ? (
        <Empty icon="📚" title="No attendance records yet" sub="Your faculty will update this after marking sessions" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {data.map((r: any) => {
            const pct    = r.percentage ?? 0;
            const absent = (r.total ?? 0) - (r.attended ?? 0);
            const needed = pct < 75 && (r.total ?? 0) > 0 ? Math.ceil((0.75*(r.total??0) - (r.attended??0))/0.25) : 0;
            const canMiss= pct >= 75 ? Math.floor(((r.attended??0) - 0.75*(r.total??0))/0.75) : 0;
            return (
              <div key={r.subjectCode ?? r.subject} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", border: `1.5px solid ${pctColor(pct)}33` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{r.subject}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{r.subjectCode}</div>
                  </div>
                  <StatusBadge pct={pct} label={`${pct}%`} large />
                </div>
                {/* Progress bar */}
                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pctColor(pct), borderRadius: 4, transition: "width .6s" }} />
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                  <span>Held: <b style={{ color: "#1e293b" }}>{r.total}</b></span>
                  <span>Present: <b style={{ color: "#15803d" }}>{r.attended}</b></span>
                  <span>Absent: <b style={{ color: "#dc2626" }}>{absent}</b></span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: pctColor(pct) }}>
                  {pct >= 75
                    ? `✓ Safe — can skip ${canMiss} more class${canMiss!==1?"es":""}`
                    : pct >= 65
                      ? `⚠ Warning — attend ${needed} more for condonation`
                      : `✗ Danger — need ${needed} more class${needed!==1?"es":""} to reach 75%`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Mini components ─────────────────────────────────────────────────────── */
function Sel({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>{label}</label>
      {children}
    </div>
  );
}
function TableWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflow: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table></div>;
}
function Th({ children, align }: { children?: React.ReactNode; align?: string }) {
  return <th style={{ padding: "12px 14px", textAlign: (align as any) ?? "center", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{children}</th>;
}
function Tr({ children }: { children: React.ReactNode }) { return <>{children}</>; }
function Td({ children, align, bold, mono, bg }: { children?: React.ReactNode; align?: string; bold?: boolean; mono?: boolean; bg?: string }) {
  return <td style={{ padding: "10px 14px", textAlign: (align as any) ?? "center", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", fontWeight: bold ? 600 : undefined, fontFamily: mono ? "monospace" : undefined, fontSize: mono ? 11 : undefined, background: bg }}>{children}</td>;
}
function StatusBadge({ pct, label, large }: { pct: number; label?: string; large?: boolean }) {
  const text = pct>=75 ? "Safe" : pct>=65 ? "Warning" : "Danger";
  return <span style={{ padding: large ? "5px 14px" : "3px 10px", borderRadius: 12, background: pctBg(pct), color: pctColor(pct), fontWeight: 700, fontSize: large ? 15 : 11, display: "inline-block" }}>{label ?? text}</span>;
}
function Spinner() { return <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 15 }}>Loading…</div>; }
function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px", color: "#94a3b8" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>{title}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Shared style tokens ─────────────────────────────────────────────────── */
const card: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", marginBottom: 20 };
const selSt: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", color: "#1e293b", cursor: "pointer" };
const smBtn: React.CSSProperties = { padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all .15s" };
