import { useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { getUser } from "@/lib/auth";
import { useApiGet } from "@/lib/api";
import { Users, BookOpen, Building2, Layers, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface Stats {
  students: number;
  faculty: number;
  departments: number;
  subjects: number;
  batches: number;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const user = getUser();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user]);

  const { data: stats, isLoading } = useApiGet<Stats>("/admin/stats");

  const cards = [
    {
      title: "Departments",
      value: stats?.departments ?? 0,
      icon: Building2,
      color: "bg-blue-600",
      href: "/dashboard/admin/departments",
      desc: "Manage academic departments",
    },
    {
      title: "Batches",
      value: stats?.batches ?? 0,
      icon: Layers,
      color: "bg-purple-600",
      href: "/dashboard/admin/batches",
      desc: "Manage student batches & sections",
    },
    {
      title: "Subjects",
      value: stats?.subjects ?? 0,
      icon: BookOpen,
      color: "bg-green-600",
      href: "/dashboard/admin/subjects",
      desc: "Manage course subjects",
    },
    {
      title: "Students",
      value: stats?.students ?? 0,
      icon: GraduationCap,
      color: "bg-amber-600",
      href: "/dashboard/admin/users",
      desc: "Manage student accounts",
    },
    {
      title: "Faculty",
      value: stats?.faculty ?? 0,
      icon: Users,
      color: "bg-red-600",
      href: "/dashboard/admin/users",
      desc: "Manage faculty accounts",
    },
    {
      title: "Faculty-Subject Map",
      value: "—",
      icon: ArrowRight,
      color: "bg-teal-600",
      href: "/dashboard/admin/faculty-assignments",
      desc: "Assign faculty to subjects & batches",
    },
  ];

  return (
    <Layout title="Admin Control Panel">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Admin Control Panel</h2>
          <p className="text-blue-200 text-sm">Full system control — manage departments, users, subjects, and assignments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.title} href={c.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${c.color} rounded-xl p-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {isLoading ? "—" : c.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{c.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Admin Access Notice:</strong> You have full control over all system data. Changes made here are permanent and affect all users.
        </div>
      </div>
    </Layout>
  );
}
