import Layout from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Zap, Trophy, Star, Calendar, TrendingUp, Award } from "lucide-react";

interface Level { name: string; icon: string; color: string; min: number; }
interface NextLevel { name: string; icon: string; needed: number; }
interface Badge { id: string; badgeId: string; awardedAt: string; definition: { name: string; icon: string; description: string; color: string; category: string; } | null; }
interface PointEntry { id: string; points: number; reason: string; category: string; awardedAt: string; }
interface EventAttended { eventId: string; attended: boolean; attendedAt: string | null; event: { title: string; type: string; date: string; xpReward: number; } | null; }

interface AchievementsData {
  student: { name: string; usn: string; branch: string | null; role: string; } | null;
  totalPoints: number;
  level: Level;
  nextLevel: NextLevel | null;
  badges: Badge[];
  recentPoints: PointEntry[];
  eventsAttended: EventAttended[];
}

const LEVEL_THRESHOLDS = [
  { name: "Beginner", icon: "🌱", min: 0, max: 50, color: "bg-gray-200" },
  { name: "Active", icon: "🔥", min: 50, max: 200, color: "bg-green-400" },
  { name: "Rising", icon: "⭐", min: 200, max: 500, color: "bg-blue-400" },
  { name: "Pro", icon: "🏆", min: 500, max: 1000, color: "bg-amber-400" },
  { name: "Elite", icon: "💎", min: 1000, max: 2000, color: "bg-purple-500" },
];

const BADGE_COLORS: Record<string, string> = {
  amber: "from-amber-400 to-yellow-300",
  blue: "from-blue-500 to-cyan-400",
  gold: "from-yellow-400 to-amber-300",
  purple: "from-purple-500 to-violet-400",
  pink: "from-pink-500 to-rose-400",
  green: "from-green-500 to-emerald-400",
  teal: "from-teal-500 to-cyan-400",
};

function ProgressBar({ points, level }: { points: number; level: Level }) {
  const current = LEVEL_THRESHOLDS.find(l => l.name === level.name);
  const next = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.findIndex(l => l.name === level.name) + 1];
  if (!current || !next) return null;
  const pct = Math.min(100, ((points - current.min) / (next.min - current.min)) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current.icon} {current.name} ({current.min} XP)</span>
        <span>{next.icon} {next.name} ({next.min} XP)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full bg-gradient-to-r from-[#1a237e] to-[#E8821A] transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-1">{points} / {next.min} XP</div>
    </div>
  );
}

export default function AchievementsPage() {
  const user = getUser();
  const { data, isLoading } = useApiGet<AchievementsData>("/achievements");

  if (isLoading) {
    return <Layout title="My Achievements"><div className="p-8 text-center text-gray-400">Loading achievements...</div></Layout>;
  }

  if (!data) {
    return <Layout title="My Achievements"><div className="p-8 text-center text-gray-400">No data available. Start attending events to earn XP!</div></Layout>;
  }

  const { totalPoints, level, nextLevel, badges, recentPoints, eventsAttended } = data;

  return (
    <Layout title="My Achievements">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#1a237e] to-[#3949ab] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 select-none">🏆</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-blue-200 text-sm">Campus Achievements</p>
                <h2 className="text-2xl font-bold">{user?.name ?? data.student?.name}</h2>
                <p className="text-blue-300 text-xs">{data.student?.usn} · {data.student?.branch ?? data.student?.role}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold flex items-center gap-2">
                  <Zap className="w-8 h-8 text-amber-300" /> {totalPoints}
                </div>
                <div className="text-blue-200 text-sm">Campus XP</div>
              </div>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-4">
              <div className="text-4xl">{level.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-lg">{level.name}</div>
                {nextLevel && <div className="text-xs text-blue-200">{nextLevel.needed} XP to {nextLevel.icon} {nextLevel.name}</div>}
                <ProgressBar points={totalPoints} level={level} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{eventsAttended.length}</div>
                <div className="text-xs text-blue-200">Events Attended</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{badges.length}</div>
                <div className="text-xs text-blue-200">Badges Earned</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{totalPoints}</div>
                <div className="text-xs text-blue-200">Total XP</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Earned Badges ({badges.length})
            </h3>
            {badges.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                Attend events to earn your first badge! 🏅
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map(b => {
                  const gradColor = BADGE_COLORS[b.definition?.color ?? "amber"] ?? BADGE_COLORS.amber;
                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${gradColor} flex items-center justify-center text-2xl shadow-lg mb-2`}>
                        {b.definition?.icon ?? "🏅"}
                      </div>
                      <div className="font-semibold text-gray-800 text-sm">{b.definition?.name ?? b.badgeId}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{b.definition?.description}</div>
                      <div className="text-xs text-gray-300 mt-1">{new Date(b.awardedAt).toLocaleDateString("en-IN")}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Events Attended ({eventsAttended.length})
            </h3>
            {eventsAttended.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                No events attended yet. Register and attend events to build your record!
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {eventsAttended.map(ea => (
                  <div key={ea.eventId} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a237e] to-[#E8821A] flex items-center justify-center text-lg flex-shrink-0">
                      {ea.event?.type === "technical" ? "💻" : ea.event?.type === "cultural" ? "🎭" : ea.event?.type === "sports" ? "🏅" : ea.event?.type === "hackathon" ? "⚡" : "📌"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{ea.event?.title ?? "Event"}</div>
                      <div className="text-xs text-gray-400">{ea.event?.date ? new Date(ea.event.date).toLocaleDateString("en-IN") : "—"}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 flex-shrink-0">
                      <Zap className="w-3 h-3" /> +{ea.event?.xpReward ?? 50}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Recent XP Activity
          </h3>
          {recentPoints.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">No XP earned yet.</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {recentPoints.slice(0, 10).map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-gray-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                      {p.category === "badge" ? "🏅" : "⚡"}
                    </div>
                    <span className="text-gray-700">{p.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600">+{p.points} XP</span>
                    <span className="text-xs text-gray-400">{new Date(p.awardedAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
