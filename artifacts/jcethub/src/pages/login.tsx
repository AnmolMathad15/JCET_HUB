import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin } from "@workspace/api-client-react";
import { setAuthToken, setUser, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, UserCircle, GraduationCap, Eye, EyeOff } from "lucide-react";

const RIBBON_TEXT = "Jain College of Engineering and Technology, Hubballi";

const DEMO_CREDS = [
  { role: "student" as const, usn: "2JH23CS001", password: "student@001", label: "Student" },
  { role: "faculty" as const, usn: "FAC001",     password: "faculty@001", label: "Faculty" },
  { role: "admin"   as const, usn: "ADMIN1",     password: "admin@001",   label: "Admin" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const loginMutation = useLogin();

  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student");

  useEffect(() => {
    if (isAuthenticated()) setLocation("/dashboard");
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usn || !password) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter both USN and password" });
      return;
    }
    loginMutation.mutate(
      { data: { usn: usn.toUpperCase(), password, role } },
      {
        onSuccess: (data) => {
          setAuthToken(data.token);
          setUser(data.user);
          qc.clear();
          toast({ title: "Login Successful", description: `Welcome back, ${data.user.name}` });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid credentials. Check demo credentials below." });
        },
      }
    );
  };

  const fillDemo = (cred: typeof DEMO_CREDS[0]) => {
    setRole(cred.role);
    setUsn(cred.usn);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-zinc-900">

      {/* ── College building background ── */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/clg-building.jpg')" }}
      />
      {/* Dark gradient overlay so text is readable */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#070d30]/45 via-[#0a1040]/35 to-[#070d30]/50" />

      {/* ── Ribbon marquee ── */}
      <div className="relative z-10 overflow-hidden bg-[#1a237e]/90 backdrop-blur-sm border-b-2 border-[#E8821A]" style={{ height: 46 }}>
        <div className="ribbon-track flex items-center h-full whitespace-nowrap">
          {[0, 1].map((clone) => (
            <span key={clone} className="ribbon-half flex items-center" aria-hidden={clone === 1 ? true : undefined}>
              {Array(8).fill(null).map((_, i) => (
                <span key={i} className="flex items-center gap-3 px-5">
                  <img src="/jgi-logo.jpg" alt="JGI" className="h-8 w-8 object-cover rounded-full flex-shrink-0" />
                  <span className="text-white font-bold text-[12px] tracking-widest uppercase">{RIBBON_TEXT}</span>
                  <span className="text-[#E8821A] text-xl leading-none">•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Login card ── */}
      <div className="flex-1 flex items-center justify-center z-10 p-4 py-8">
        <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-md">
          {/* Amber accent line */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#E8821A] via-[#f5c518] to-[#E8821A]" />

          <CardHeader className="space-y-4 pt-7 pb-4 text-center">

            {/* ── Circle logo with glow ── */}
            <div className="mx-auto relative">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#E8821A]/60 logo-glow">
                <img
                  src="/college-logo.png"
                  alt="JCET Logo"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
            </div>

            {/* ── App name ── */}
            <div className="space-y-1">
              <CardTitle className="brand-name leading-none">
                <span className="text-[#1a237e]">JCET</span>
                <span className="text-[#E8821A]"> HUB</span>
              </CardTitle>
              <CardDescription className="text-[13px] text-gray-600 font-semibold tracking-wide">
                Jain College of Engineering and Technology
              </CardDescription>
              <CardDescription className="text-[11px] text-gray-400 tracking-[0.2em] uppercase font-medium">
                Smart Campus Portal
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-gray-600 font-semibold text-[11px] uppercase tracking-widest">Login as</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger id="role" className="h-11 bg-gray-50 border-gray-200" data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student" data-testid="option-student">
                      <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#1a237e]" /> Student</div>
                    </SelectItem>
                    <SelectItem value="faculty" data-testid="option-faculty">
                      <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#1a237e]" /> Faculty</div>
                    </SelectItem>
                    <SelectItem value="admin" data-testid="option-admin">
                      <div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-[#1a237e]" /> Administrator</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usn" className="text-gray-600 font-semibold text-[11px] uppercase tracking-widest">
                  {role === "student" ? "USN / Roll Number" : "Employee ID"}
                </Label>
                <Input id="usn" placeholder={role === "student" ? "e.g. 2JH23CS001" : "Enter your ID"} value={usn} onChange={(e) => setUsn(e.target.value)} className="h-11 bg-gray-50 border-gray-200" data-testid="input-usn" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-600 font-semibold text-[11px] uppercase tracking-widest">Password</Label>
                  <a href="#" className="text-[11px] text-[#E8821A] hover:text-[#c0611a] font-semibold transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-gray-50 border-gray-200 pr-11" data-testid="input-password" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a237e] transition-colors" data-testid="button-toggle-password" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-bold shadow-md bg-[#1a237e] hover:bg-[#283593] text-white tracking-wide transition-colors" disabled={loginMutation.isPending} data-testid="button-login">
                {loginMutation.isPending ? "Authenticating…" : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3 pb-6 pt-3 bg-gray-50/70 border-t border-gray-100 px-6">
            <div className="w-full space-y-2">
              <p className="text-[11px] text-center text-gray-500 font-semibold uppercase tracking-wider">Demo Credentials — click to fill</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_CREDS.map((c) => (
                  <button key={c.role} type="button" onClick={() => fillDemo(c)}
                    className="rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 px-2 py-2 text-center transition-colors cursor-pointer"
                    data-testid={`button-demo-${c.role}`}>
                    <p className="text-[10px] font-bold text-[#1a237e] uppercase tracking-wide">{c.label}</p>
                    <p className="text-[9px] font-mono text-blue-700 mt-0.5">{c.usn}</p>
                    <p className="text-[9px] font-mono text-blue-600">{c.password}</p>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Protected by JGI Secure Identity</p>
          </CardFooter>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ribbon-track { display:flex; width:max-content; animation: ribbonScroll 32s linear infinite; }
        @keyframes ribbonScroll { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        .logo-glow {
          box-shadow:
            0 0 0 3px rgba(232,130,26,0.5),
            0 0 18px 6px rgba(232,130,26,0.55),
            0 0 40px 12px rgba(26,35,126,0.35),
            0 0 60px 20px rgba(232,130,26,0.15);
        }
        .brand-name {
          font-family: 'Rajdhani', 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 2.6rem;
          letter-spacing: 0.05em;
        }
      `}} />
    </div>
  );
}
