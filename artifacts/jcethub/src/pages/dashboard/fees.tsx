import { Layout } from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface FeeEntry { id: string; description: string; amount: number; paid: number; dueDate: string | null; paidDate: string | null; status: string; category: string; }
interface FeesData { studentName: string; usn: string; totalDue: number; totalPaid: number; ledger: FeeEntry[]; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  paid:    { label: "Paid",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
  pending: { label: "Due",     color: "text-red-700",     bg: "bg-red-50 border-red-200",         Icon: AlertCircle },
  nil:     { label: "No Dues", color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",       Icon: CheckCircle2 },
};

function inr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Fees() {
  const { data } = useApiGet<FeesData>("/fees");

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Fees</h1>
          <p className="text-muted-foreground mt-1 text-sm">College fee payment status for 2024-25</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-50"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Paid</p>
                <p className="text-2xl font-black text-emerald-600">{data ? inr(data.totalPaid) : "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-red-500" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-50"><AlertCircle className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Due</p>
                <p className="text-2xl font-black text-red-600">{data ? inr(data.totalDue) : "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-[#1a237e]" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-50"><Wallet className="h-5 w-5 text-[#1a237e]" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Student</p>
                <p className="text-sm font-bold">{data?.studentName ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{data?.usn ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger */}
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-3">
            <CardTitle className="text-base text-[#1a237e]">Fee Ledger — 2024-25</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {(data?.ledger ?? [
              { id:"1", description:"Tuition Fee – 2024-25",       amount:85000, paid:85000, dueDate:"2024-07-31", paidDate:"2024-07-20", status:"paid",    category:"tuition" },
              { id:"2", description:"Development & Lab Fee",        amount:15000, paid:15000, dueDate:"2024-07-31", paidDate:"2024-07-20", status:"paid",    category:"development" },
              { id:"3", description:"VTU Exam Registration Fee",    amount:2500,  paid:0,     dueDate:"2024-12-15", paidDate:null,         status:"pending", category:"exam" },
            ]).map((entry: FeeEntry) => {
              const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.nil;
              const Icon = cfg.Icon;
              return (
                <div key={entry.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className={`p-2 rounded-lg border self-start ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{entry.description}</h4>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-0.5">
                      {entry.dueDate && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {new Date(entry.dueDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
                      )}
                      {entry.paidDate && (
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Paid: {new Date(entry.paidDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-base">{entry.amount > 0 ? inr(entry.amount) : "—"}</div>
                    <Badge className={`text-[10px] font-bold border ${cfg.bg} ${cfg.color} mt-1`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alert if anything due */}
        {(data?.totalDue ?? 0) > 0 && (
          <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-700">Payment Due</p>
                <p className="text-xs text-red-600 mt-0.5">You have pending fees of <strong>{inr(data!.totalDue)}</strong>. Please pay before the due date to avoid penalties. Visit the Accounts section (Block D, Ground Floor) or use the online payment portal.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
