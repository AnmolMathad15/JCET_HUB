import { useState } from "react";
import Layout from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Trophy, Zap, TrendingUp, Users, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number; studentId: string; name: string; usn: string; branch: string;
  totalPoints: number; badgeCount: number; eventsAttended: number;
  level: { name: string; icon: string; color: string; };
}

const DEPT_TABS = ["All", "CSE", "ECE", "ME", "CE", "ISE", "AIML", "EEE"];

function PointBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, max > 0 ? (current / max) * 100 : 0);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="bg-gradient-to-r from-[#1a237e] to-[#E8821A] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-7 h-7 flex items-center justify-center font-bold text-sm text-gray-500">#{rank}</span>;
}

export default function LeaderboardPage() {
  const user = getUser();
  const { data: board = [], isLoading } = useApiGet<LeaderboardEntry[]>("/leaderboard");
  const [dept, setDept] = useState("All");

  const filtered = dept === "All" ? board : board.filter(e => (e.branch ?? "").includes(dept));
  const reranked = filtered.map((e, i) => ({ ...e, displayRank: i + 1 }));
  const maxPoints = reranked[0]?.totalPoints ?? 1;

  const myEntry = board.find(e => e.studentId === user?.id);
  const myRank = myEntry ? board.findIndex(e => e.studentId === user?.id) + 1 : null;
  const myDeptRank = myEntry ? reranked.findIndex(e => e.studentId === user?.id) + 1 : null;

  const top3 = reranked.slice(0, 3);

  return (
    <Layout title="Campus Leaderboard">
      <div className="space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#E8821A]/70 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] leading-none opacity-5 select-none pointer-events-none">🏆</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-400/30 border border-amber-300/30 rounded-2xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Campus Leaderboard</h2>
                <p className="text-blue-200 text-xs mt-0.5">Top students ranked by XP earned from events & activities</p>
              </div>
            </div>
            {myEntry && (
              <div className="bg-white/10 border border-white/10 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-blue-200 mb-1">Global Rank</div>
                  <div className="text-3xl font-extrabold">#{myRank}</div>
                </div>
                {dept !== "All" && myDeptRank && myDeptRank > 0 && (
                  <div>
                    <div className="text-xs text-blue-200 mb-1">{dept} Rank</div>
                    <div className="text-3xl font-extrabold">#{myDeptRank}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-blue-200 mb-1">Campus XP</div>
                  <div className="text-2xl font-extrabold flex items-center gap-1">
                    <Zap className="w-5 h-5 text-amber-300" /> {myEntry.totalPoints}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-200 mb-1">Level</div>
                  <div className="text-lg font-bold">{myEntry.level.icon} {myEntry.level.name}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-200 mb-1">Events Attended</div>
                  <div className="text-2xl font-bold">{myEntry.eventsAttended}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DEPT_TABS.map(d => (
            <button key={d} onClick={() => setDept(d)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${dept === d ? "bg-[#1a237e] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {d === "All" ? "🌐 All Depts" : d}
              {d !== "All" && (
                <span className="ml-1.5 text-xs opacity-70">({board.filter(e => (e.branch ?? "").includes(d)).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Podium for top 3 */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[top3[1], top3[0], top3[2]].map((e, i) => {
              if (!e) return <div key={i} />;
              const heights = ["h-28", "h-36", "h-24"];
              const isMe = e.studentId === user?.id;
              const gradients = [
                "from-slate-100 to-gray-50 border-slate-200",
                "from-amber-50 to-yellow-50 border-amber-300",
                "from-orange-50 to-amber-50 border-orange-200",
              ];
              return (
                <div key={e.studentId} className={`bg-gradient-to-b ${gradients[i]} border rounded-2xl p-3 flex flex-col items-center justify-end ${heights[i]} text-center shadow-sm ${isMe ? "ring-2 ring-[#1a237e]/30" : ""}`}>
                  <RankBadge rank={i === 0 ? 2 : i === 1 ? 1 : 3} />
                  <div className="font-bold text-gray-800 text-sm truncate w-full mt-1">{e.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-gray-400">{e.usn}</div>
                  <div className="text-xs font-bold text-[#1a237e] flex items-center gap-0.5 mt-1">
                    <Zap className="w-3 h-3 text-amber-500" /> {e.totalPoints}
                  </div>
                  <div className="text-[10px] text-gray-400">{e.level.icon} {e.level.name}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> {dept === "All" ? "All Students" : `${dept} Department`}
              <span className="text-gray-300 font-normal">· {reranked.length} students</span>
            </span>
            <div className="grid grid-cols-4 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
              <span className="text-right">Badges</span>
              <span className="text-right">Events</span>
              <span className="text-right">Level</span>
              <span className="text-right">XP</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-[#1a237e]/30 border-t-[#1a237e] rounded-full animate-spin mx-auto mb-2" />
              Loading leaderboard...
            </div>
          ) : reranked.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-100 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No students in this department have earned XP yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reranked.map(e => {
                const isMe = e.studentId === user?.id;
                return (
                  <div key={e.studentId}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50/70 transition-all ${isMe ? "bg-[#1a237e]/5 border-l-4 border-[#1a237e]" : ""}`}>
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <RankBadge rank={e.displayRank} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm truncate ${isMe ? "text-[#1a237e]" : "text-gray-800"}`}>{e.name}</span>
                        {isMe && <span className="text-[10px] bg-[#1a237e] text-white px-1.5 py-0.5 rounded-full">You</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-mono">{e.usn}</span>
                        {e.branch && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded font-medium">{e.branch}</span>}
                      </div>
                      <PointBar current={e.totalPoints} max={maxPoints} />
                    </div>
                    <div className="grid grid-cols-4 gap-4 shrink-0 text-right">
                      <div>
                        <div className="text-sm font-bold text-purple-600">{e.badgeCount}</div>
                        <div className="text-[10px] text-gray-400">badges</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-green-600">{e.eventsAttended}</div>
                        <div className="text-[10px] text-gray-400">events</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{e.level.icon}</div>
                        <div className="text-[10px] text-gray-400">{e.level.name}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5 justify-end font-extrabold text-amber-600 text-sm">
                          <Zap className="w-3 h-3" /> {e.totalPoints}
                        </div>
                        <div className="text-[10px] text-gray-400">XP</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to earn XP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎯", title: "Attend Events", desc: "Earn 50–250 XP for each event you attend in person", color: "bg-blue-50 border-blue-200" },
            { icon: "🏅", title: "Earn Badges", desc: "Hit milestones (1st event, 5 events, 10 events) to unlock badges (+25 XP each)", color: "bg-amber-50 border-amber-200" },
            { icon: "📈", title: "Level Up", desc: "Beginner → Active → Rising → Pro → Elite 💎", color: "bg-purple-50 border-purple-200" },
          ].map(c => (
            <div key={c.title} className={`${c.color} border rounded-xl p-4`}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="font-bold text-gray-800 text-sm">{c.title}</div>
              <div className="text-gray-500 text-xs mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
