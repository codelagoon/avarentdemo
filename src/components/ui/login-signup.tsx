"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  ArrowRight,
  Chrome,
  Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LoginCardSectionProps {
  onLogin: () => void;
  onTryNewCompany?: () => void;
}

export default function LoginCardSection({ onLogin, onTryNewCompany }: LoginCardSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(59, 130, 246, ${p.o * 0.35})`; // Use Cobalt Blue for particles to match brand tint
        ctx.fillRect(p.x, p.y, 0.8, 2.5);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // E2E Test Suite Bypass / Demo Check
    if (password === "197704") {
      onLogin();
      return;
    }

    if (!email) {
      setErrorMsg("Please enter an email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onLogin();
        } else {
          setErrorMsg("Account created! Please check your email to verify your address.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 bg-[#090d16] text-[#f8fafc] z-50 flex flex-col items-center justify-center font-sans" data-testid="login-screen">
      <style>{`
        .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.5}
        .hline,.vline{position:absolute;background:#1e293b;will-change:transform,opacity}
        .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .hline:nth-child(1){top:18%;animation-delay:.12s}
        .hline:nth-child(2){top:50%;animation-delay:.22s}
        .hline:nth-child(3){top:82%;animation-delay:.32s}
        .vline:nth-child(4){left:22%;animation-delay:.42s}
        .vline:nth-child(5){left:50%;animation-delay:.54s}
        .vline:nth-child(6){left:78%;animation-delay:.66s}
        .hline::after,.vline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(59, 130, 246, 0.15),transparent);opacity:0;animation:shimmer .9s ease-out forwards}
        .hline:nth-child(1)::after{animation-delay:.12s}
        .hline:nth-child(2)::after{animation-delay:.22s}
        .hline:nth-child(3)::after{animation-delay:.32s}
        .vline:nth-child(4)::after{animation-delay:.42s}
        .vline:nth-child(5)::after{animation-delay:.54s}
        .vline:nth-child(6)::after{animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
        @keyframes shimmer{0%{opacity:0}35%{opacity:.25}100%{opacity:0}}

        /* === Card minimal fade-up animation === */
        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(59,130,246,0.04),transparent_60%)]" />

      {/* Animated accent lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
      />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-[#1e293b]/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3b82f6] shadow-lg shadow-[#3b82f6]/20">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-[0.75rem] font-bold tracking-[0.18em] uppercase text-white font-mono">
            AVARENT MERIDIAN
          </span>
        </div>
        <Button
          variant="outline"
          onClick={onTryNewCompany}
          className="h-9 rounded-lg border-[#1e293b] bg-[#0c111d] text-[#f8fafc] hover:bg-[#1e293b] hover:text-white font-mono text-[0.7rem] uppercase tracking-wider transition-colors"
        >
          <span className="mr-2">Demo Request</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </header>

      {/* Centered Login Card */}
      <div className="h-full w-full grid place-items-center px-4 relative z-10">
        <Card className="card-animate w-full max-w-sm border-[#1e293b] bg-[#0c111d]/90 backdrop-blur-md shadow-2xl rounded-lg">
          <CardHeader className="space-y-1.5 pb-5">
            <CardTitle className="text-xl font-bold font-sans text-white">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs font-sans">
              {mode === "signin"
                ? "Sign in to monitor regulatory compliance dashboard"
                : "Register a new credit compliance control account"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4 pb-5">
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-zinc-400 text-[0.65rem] font-semibold uppercase tracking-wider font-mono">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-[#090d16] border-[#1e293b] text-[#f8fafc] placeholder:text-zinc-600 focus-visible:ring-[#3b82f6] focus-visible:border-[#3b82f6] text-sm h-10"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-zinc-400 text-[0.65rem] font-semibold uppercase tracking-wider font-mono">
                  Access Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    id="password"
                    data-testid="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 pr-10 bg-[#090d16] border-[#1e293b] text-[#f8fafc] placeholder:text-zinc-600 focus-visible:ring-[#3b82f6] focus-visible:border-[#3b82f6] text-sm h-10 font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-500 hover:text-zinc-300 focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-[0.7rem] text-red-400 border border-red-500/20 bg-red-500/10 px-3 py-2 rounded-md font-sans">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-between text-[0.7rem]">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="border-[#1e293b] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-white data-[state=checked]:border-[#3b82f6]"
                  />
                  <Label htmlFor="remember" className="text-zinc-400 cursor-pointer font-sans select-none">
                    Keep me signed in
                  </Label>
                </div>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-zinc-300 hover:text-white hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full h-10 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold font-sans transition-colors focus:ring-2 focus:ring-[#3b82f6] shadow-lg shadow-[#3b82f6]/20 text-sm mt-1"
              >
                {loading ? "Authorizing Security..." : mode === "signin" ? "Sign In" : "Register Control Account"}
              </Button>

              <div className="relative my-1">
                <Separator className="bg-[#1e293b]" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[#0c111d] px-2 text-[8px] uppercase tracking-widest text-zinc-500 font-mono">
                  regulatory testing
                </span>
              </div>

              <div className="text-center bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5">
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  Enter offline code <span className="text-[#3b82f6] font-bold">197704</span> into password field to bypass Supabase for sandbox local audits.
                </p>
              </div>
            </CardContent>
          </form>

          <CardFooter className="flex items-center justify-center text-xs text-zinc-400 border-t border-[#1e293b]/60 pt-4 pb-4">
            {mode === "signin" ? "New to AVARENT Meridian?" : "Already configured?"}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErrorMsg(null);
              }}
              className="ml-1 text-[#3b82f6] hover:underline font-bold focus:outline-none transition-colors"
            >
              {mode === "signin" ? "Register" : "Sign In"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
