import { Layout } from "@/components/layout";
import { useApiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Clock, Phone, CheckCircle2, ExternalLink, Navigation } from "lucide-react";
import { useState } from "react";

const BUS_TRACKER_URL = "https://nextstop-jgi--anmolka203.replit.app";

interface TransportData {
  studentBusRoute: string;
  busPass: { valid: boolean; validTill: string; passNo: string };
  routes: Array<{
    routeNo: string; name: string; returnTime: string; driver: string; contactNo: string;
    stops: Array<{ stop: string; departure: string }>;
  }>;
}

export default function Transport() {
  const { data } = useApiGet<TransportData>("/transport");
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const selectedRoute = data?.routes.find(r => r.routeNo === (activeRoute ?? data?.studentBusRoute));

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1a237e] tracking-tight">Transport</h1>
            <p className="text-muted-foreground mt-1 text-sm">College bus routes, schedule and live tracking</p>
          </div>
          {/* Live Bus Tracker CTA */}
          <a
            href={BUS_TRACKER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#1a237e] hover:bg-[#283593] text-white gap-2 shadow-md">
              <Navigation className="h-4 w-4" />
              Live Bus Tracker
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </a>
        </div>

        {/* Live Tracker Banner */}
        <Card className="border-[#1a237e]/30 bg-gradient-to-r from-[#1a237e]/5 to-[#E8821A]/5 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-[#1a237e] flex-shrink-0">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-[#1a237e]">NextStop – JCET Live Bus Tracker</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Track your college bus in real-time, view ETA, and get stop-by-stop updates.</p>
            </div>
            <a
              href={BUS_TRACKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Button variant="outline" size="sm" className="border-[#1a237e] text-[#1a237e] hover:bg-[#1a237e] hover:text-white gap-1.5">
                Open Tracker <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Bus pass card */}
        <Card className="bg-gradient-to-br from-[#E8821A] to-[#c0611a] text-white border-0 shadow-lg overflow-hidden relative">
          <div className="absolute right-4 top-4 opacity-10"><Bus className="w-24 h-24" /></div>
          <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Your Bus Pass</p>
              <div className="text-xl font-black mt-1">{data?.studentBusRoute ?? "—"}</div>
              <p className="text-sm text-white/80 mt-0.5">Pass No: <span className="font-mono font-bold">{data?.busPass.passNo ?? "—"}</span></p>
            </div>
            <div className="text-right">
              <Badge className="bg-white text-[#E8821A] font-bold mb-1">
                {data?.busPass.valid ? "✓ Valid" : "Expired"}
              </Badge>
              <p className="text-xs text-white/70">
                Valid till {data?.busPass.validTill
                  ? new Date(data.busPass.validTill).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Route list */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-[#1a237e] uppercase tracking-wide">All Routes</h3>
            {(data?.routes ?? [
              { routeNo:"Route 1", name:"Loading…" },
              { routeNo:"Route 2", name:"Loading…" },
              { routeNo:"Route 3", name:"Loading…" },
              { routeNo:"Route 4", name:"Loading…" },
            ]).map((r: any) => {
              const isActive = (activeRoute ?? data?.studentBusRoute) === r.routeNo;
              return (
                <button
                  key={r.routeNo}
                  onClick={() => setActiveRoute(r.routeNo)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${isActive ? "bg-[#1a237e] text-white border-[#1a237e] shadow-md" : "bg-card border-border/50 hover:border-[#1a237e]/40 hover:shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : "bg-[#1a237e]/10"}`}>
                      <Bus className={`h-4 w-4 ${isActive ? "text-white" : "text-[#1a237e]"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{r.routeNo}</div>
                      <div className={`text-xs truncate ${isActive ? "text-white/70" : "text-muted-foreground"}`}>{r.name}</div>
                    </div>
                    {r.routeNo === data?.studentBusRoute && (
                      <CheckCircle2 className={`h-4 w-4 ml-auto flex-shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Route details */}
          <div className="lg:col-span-2">
            {selectedRoute ? (
              <Card className="shadow-sm border-border/50 h-full">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base text-[#1a237e]">{selectedRoute.name}</CardTitle>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Return: {selectedRoute.returnTime}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />Driver: {selectedRoute.driver} ({selectedRoute.contactNo})</span>
                      </div>
                    </div>
                    <a href={BUS_TRACKER_URL} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-[#1a237e]/40 text-[#1a237e] hover:bg-[#1a237e] hover:text-white gap-1.5 text-xs">
                        <Navigation className="h-3.5 w-3.5" /> Track Live
                      </Button>
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#1a237e]/20" />
                    {selectedRoute.stops.map((stop, i) => (
                      <div key={i} className="relative mb-4 last:mb-0">
                        <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          i === 0 ? "bg-[#E8821A] border-[#E8821A]"
                            : i === selectedRoute.stops.length - 1 ? "bg-[#1a237e] border-[#1a237e]"
                            : "bg-white border-[#1a237e]"}`}>
                          {(i === 0 || i === selectedRoute.stops.length - 1) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex justify-between items-center ml-2">
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${i === selectedRoute.stops.length - 1 ? "text-[#1a237e]" : "text-muted-foreground"}`} />
                            {stop.stop}
                          </p>
                          <span className="text-xs font-bold text-[#E8821A] ml-4 flex-shrink-0">{stop.departure}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-border/50 h-48 flex items-center justify-center opacity-40">
                <div className="text-center text-muted-foreground">
                  <Bus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Select a route to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
